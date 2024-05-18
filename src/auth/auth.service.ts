import { BadRequestException, CACHE_MANAGER, HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { Security, TFA_TYPE } from 'src/settings/entities/security.entity';
import { toDataURL } from 'qrcode';
import { MailService } from 'src/mail/mail.service';
import { SettingsService } from 'src/settings/settings.service';
import { User } from 'src/users/entities/user.entity';
import { authenticator } from 'otplib';

// const ;

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AuthService {
    constructor(
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
        private usersService: UsersService,
        private settingsService: SettingsService,
        private jwtService: JwtService,
        private mailService: MailService
    ) {}

    rnd = (() => {
        const gen = (min, max) => max++ && [...Array(max-min)].map((s, i) => String.fromCharCode(min+i));

        const sets = {
            num: gen(48,57),
            alphaLower: gen(97,122),
            alphaUpper: gen(65,90),
            special: [...`~!@#$%^&*()_+-=[]\{}|;:'",./<>?`]
        };

        function* iter(len, set) {
            if (set.length < 1) set = Object.values(sets).flat();
            for (let i = 0; i < len; i++) yield set[Math.random() * set.length|0]
        }

        return Object.assign(((len, ...set) => [...iter(len, set.flat())].join('')), sets);
    })()

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne({email, deleted: false}, ['security', 'setting']);
        if(!user) {
            throw new HttpException({
                'status': 404,
                'error': 'User doesn\'t exist'
            }, HttpStatus.NOT_FOUND);
        }

        if(user.suspended) {
            throw new UnauthorizedException('suspended');
        }

        const isMatch = await bcrypt.compare(pass, user.password);
        if(user && isMatch) {
            const {password, ...result} = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        // check user email verified
        const security: Security = user.security as Security;
        if(!security.emailVerified) {
            throw new UnauthorizedException({
                error: true,
                message: "Please verify email"
            }, "Please verify email");
        }

        // check 2FA enabled, send verify email or qrcode image
        const { tfaType, tfaEnabled } = security;
        if(!tfaEnabled) {
            throw new UnauthorizedException({
                error: true,
                message: 'Please set 2FA for safety',
            })
        } else {
            if(tfaType === TFA_TYPE.EMAIL) {
                // send 2fa email
                const code = generateCode();
                user.code = code;
                await this.mailService.send2faCode(user, code);
            }

            // Generate one-time token and return it for 2FA verification
            const token = this.rnd(32, this.rnd.alphaLower);
            await this.cacheManager.set(token, user, {ttl: 300});
            return {
                token,
                tfa: tfaType.toString()
            }
        }

    }

    async confirmTfaCode(token: string, _code: string) {
        const _user: any = await this.cacheManager.get(token);
        if(!_user) {
            throw new UnauthorizedException({
                error: true,
                message: 'Invalid request'
            }, 'Invalid request');
        }

        const { code } = _user;
        const security: Security = _user.security;
        if(security.tfaType === TFA_TYPE.EMAIL && code === _code) {
        } else if(security.tfaType === TFA_TYPE.GOOGLE &&
            authenticator.check(_code, security.googleSecret))
        {} else {
            console.log(security);
            throw new UnauthorizedException({
                error: true,
                message: 'Invalid request'
            }, 'Invalid request');
        }

        const payload = {email: _user.email, id: _user.id, roles: _user.roles}
        return {
            accessToken: this.jwtService.sign(payload)
        }

    }

    async verifyEmail(token: string) {
        const user: any = await this.cacheManager.get(token);

        if(!user) {
            console.log('no user in redis');
            await this.cacheManager.set(token, 'test user', {ttl: 300});
            throw new UnauthorizedException({
                error: true,
                message: 'Invalid verification link'
            }, 'Invalid verification link');
        }

        // clear token
        await this.cacheManager.del(token);

        // Verify email
        if(user.verify !== 'email') {
            throw new UnauthorizedException({
                error: true,
                message: 'Invalid verification link'
            }, 'Invalid verification link');
        }

        // set email verify flag
        await this.settingsService.setEmailVerified(user.security.id);
        return {
            status: 'success',
            msg: 'Please set 2FA for safety'
        }
    }

    async requestTfa(user: User, tfaType: TFA_TYPE) {
        // check email verified
        const security: Security = user.security as Security;
        if(!security.emailVerified) {
            throw new UnauthorizedException({
                error: true,
                message: "Please verify email"
            }, "Please verify email");
        }

        // check current 2FA settings
        if( security.tfaEnabled ) {
            throw new UnauthorizedException({
                error: true,
                message: '2FA is already enabled'
            }, '2FA is already enabled');
        }

        const token = this.rnd(32, this.rnd.alphaLower);

        let qrcode = null;
        if(tfaType === TFA_TYPE.EMAIL) {
            // send 2FA verification code via email
            const code = generateCode();

            // store on cache
            const _user: any = {
                email: user.email,
                code,
                tfaType,
                secret: null
            }
            await this.cacheManager.set(token, _user, {ttl: 300});

            // send email
            await this.mailService.send2faCode(user, code);
        } else if (tfaType === TFA_TYPE.GOOGLE) {
            // return qrcode image
            const secret = authenticator.generateSecret();
            const _user = {
                email: user.email,
                code: null,
                tfaType,
                secret
            }
            await this.cacheManager.set(token, _user, {ttl: 300});
            qrcode = await toDataURL(secret);
        } else {
            // error
            throw new UnauthorizedException({
                error: true,
                message: 'Bad 2FA type is requested'
            }, 'Bad 2FA type is requested');
        }

        return {
            token,
            tfa: {
                type: tfaType.toString(),
                qrcode
            }
        }
    }

    async confirmTfaRequest(token: string, _code: string, jwt?: boolean) {
        // Get user via token
        const _user: any = await this.cacheManager.get(token) ;
        if(!_user) {
            throw new UnauthorizedException({
                error: true,
                message: 'Invalid request'
            }, 'Invalid request');
        }
        await this.cacheManager.del(token);

        // Check 2FA code
        const user = await this.usersService.findOne({email: _user.email, deleted: false}, ['security', 'setting']);
        const security = user.security;
        const { tfaType, secret, code } = _user;

        if(tfaType === TFA_TYPE.EMAIL && code != null && code === _code) {
            user.security = {
                ...security,
                tfaEnabled: true,
                tfaType,
                googleSecret: null
            }
        } else if(tfaType === TFA_TYPE.GOOGLE && secret != null) {
            if(!authenticator.check(_code, secret)) {
                throw new UnauthorizedException({
                    error: true,
                    message: 'Invalid 2FA code'
                }, 'Invalid request');
            }
        } else {
            console.log('There is no such 2FA type', tfaType)
            throw new UnauthorizedException({
                error: true,
                message: 'Invalid request'
            }, 'Invalid request');
        }

        // update user security setting
        await this.settingsService.setTfa(security.id, tfaType, secret);

        // return jwt token or success
        let res: any = {backup: ''};
        if(jwt) {
            const payload = {email: user.email, id: user.id, roles: user.roles}
            res = {
                ...res,
                accessToken: this.jwtService.sign(payload)
            }
        }

        if(!security.tfaEnabled) {
            // first tfa setting! => add backup code.
            // backup code is returned only once for the first 2FA setting
            res.backup = security.backup;
        }
        return res;
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findOne({email, deleted: false}, ['security']);
        if(!user) {
            throw new BadRequestException('No user');
        }

        // checking emai verified
        const { security } = user;
        if(!security.emailVerified) {
            throw new UnauthorizedException("Cannot reset password for non-verified account");
        }

        if(!security.tfaEnabled) {
            throw new UnauthorizedException("Cannot reset password for 2FA disabled account");
        }

        // get code
        const token = this.rnd(32, this.rnd.alphaLower);
        const sent = await this.mailService.sendResetPaassword(user, token);
        if(sent === null) {
            throw new UnauthorizedException("Cannot sent reset link via email");
        }
        await this.cacheManager.set(token, user);
        const res = {
            status: 'success',
            tfa: false
        }
        if(security.tfaType === TFA_TYPE.GOOGLE) {
            return {
                ...res,
                tfa: true
            }
        }
        return res;
    }

    async resetPassword(token: string, newPassword: string, code?: string) {
        // get user via token
        const user: User = await this.cacheManager.get(token) as User;

        if(user === null) {
            // invalid token
            throw new UnauthorizedException({
                error: true,
                message: 'Invalid request'
            }, 'Invalid request');
        }

        const {security} = user;
        if(security.tfaEnabled && security.tfaType === TFA_TYPE.GOOGLE) {
            // verify 2FA code
            if(!authenticator.check(code, security.googleSecret)) {
                throw new UnauthorizedException({
                    error: true,
                    message: 'Invalid request'
                }, 'Invalid 2FA code');
            }
        }

        // reset password
        await this.usersService.resetPassword(user.email, newPassword);
        return {
            status: 'success'
        }
    }

}
