import { CacheModule, UnauthorizedException } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing";
import { MailModule } from "src/mail/mail.module";
import { SettingsModule } from "src/settings/settings.module";
import { UsersModule } from "src/users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import * as redisStore from 'cache-manager-redis-store';
import { UsersService } from '../users/users.service';
import { UtilsService } from "src/utils/utils.service";
import { MailService } from "src/mail/mail.service";
import { DatabaseModule } from "src/database/database.module";
import { User } from "src/users/entities/user.entity";
import { TFA_TYPE } from "src/settings/entities/security.entity";
import { authenticator } from 'otplib';
import { toDataURL } from "qrcode";


describe('Auth Service', () => {
    const testEmail = 'test@gmail.com';
    const testToken = 'test_token';
    const oneTimeToken = 'one_time_token';
    const testGoogleToken = 'F5QFA6LINQDS6RZ2';

    let authService: AuthService;
    let userService: UsersService;
    let utilsService: UtilsService;
    let mailService: MailService;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [
                SettingsModule,
                UsersModule,
                PassportModule,
                DatabaseModule,
                JwtModule.register({
                  secret: process.env.JWT_SECRET,
                  signOptions: {expiresIn: '86400'}
                }),
                MailModule,
                CacheModule.register({
                    isGlobal: true,
                    store: redisStore,
                    host: process.env.REDIS,
                    port: 6379
                }),
              ],
              providers: [AuthService, LocalStrategy, JwtStrategy],
              exports: [AuthService],
              controllers: [AuthController],
        }).compile();

        utilsService = app.get<UtilsService>(UtilsService);
        authService = app.get<AuthService>(AuthService);
        userService = app.get<UsersService>(UsersService);
        mailService = app.get<MailService>(MailService);
    });

    describe('Register', () => {
        it('Should return success msg', async () => {
            const createdResult = {
                status: 'success',
                msg: 'Please verify your account'
            }
            jest.spyOn(utilsService, 'generateRandomId').mockImplementation(() => testToken);
            jest.spyOn(mailService, 'sendUserConfirmation').mockImplementation(async () => 'sent');

            expect(await userService.create({
                email: 'test@gmail.com',
                password: 'password',
                firstName: 'first',
                lastName: 'last'
            })).toStrictEqual(createdResult);
        })

        it('emailVerified flag should be false', async () => {
            const createdUser: User = await userService.findOne({email: testEmail}, ['security']);
            expect(createdUser.security.emailVerified).toBe(false);
        })

        it('tfaEnabled flag should be false', async () => {
            const createdUser: User = await userService.findOne({email: testEmail}, ['security']);
            expect(createdUser.security.tfaEnabled).toBe(false);
        })

        it('Cannot login without email verification', async () => {
            const nonVerifiedUser = await userService.findOne({email: testEmail}, ['security'])
            try {
                await authService.login(nonVerifiedUser);
            } catch (error) {
                expect(error).toStrictEqual(new UnauthorizedException({
                    error: true,
                    message: "Please verify email"
                }, "Please verify email"))
            }
        })
    });

    describe('Verify email', () => {
        it('Cannot request 2FA without email verification', async () => {
            const nonVerifiedUser = await userService.findOne({email: testEmail}, ['security'])
            try {
                await authService.requestTfa(nonVerifiedUser, TFA_TYPE.GOOGLE);
            } catch (error) {
                expect(error).toStrictEqual(
                    new UnauthorizedException({
                        error: true,
                        message: "Please verify email"
                    }, "Please verify email")
                )
            }
        })

        it('Email should be verified', async () => {
            const verifiedResult = {
                status: 'success',
                msg: 'Please set 2FA for safety'
            }
            expect(await authService.verifyEmail(testToken)).toStrictEqual(verifiedResult);
            const verifiedUser: User = await userService.findOne({email: testEmail}, ['security']);
            expect(verifiedUser.security.emailVerified).toBe(true);
        })

        it('Cannot login without 2FA', async () => {
            const non2FAUser = await userService.findOne({email: testEmail}, ['security']);
            try {
                await authService.login(non2FAUser);
            } catch (error) {
                expect(error).toStrictEqual(
                    new UnauthorizedException({
                        error: true,
                        message: 'Please set 2FA for safety',
                    }))
            }
        });
    })

    describe('Request 2FA', () => {
        it('Bad 2FA type', async () => {
            const no2FAUser = await userService.findOne({email: testEmail}, ['security']);
            try {
                await authService.requestTfa(no2FAUser, 'BAD 2FA' as TFA_TYPE);
            } catch (error) {
                expect(error).toStrictEqual(new UnauthorizedException({
                    error: true,
                    message: 'Bad 2FA type is requested'
                }, 'Bad 2FA type is requested'))
            }
        });

        // Test with Google case
        it('Shoule receive token', async () => {
            jest.spyOn(authService, 'rnd').mockImplementation(() => oneTimeToken);
            jest.spyOn(authenticator, 'generateSecret').mockImplementation(() => testGoogleToken);
            const qrcode = await toDataURL(testGoogleToken);

            const no2FAUser = await userService.findOne({email: testEmail}, ['security']);
            expect(await authService.requestTfa(no2FAUser, TFA_TYPE.GOOGLE)).toStrictEqual({
                token: oneTimeToken,
                tfa: {
                    type: 'GOOGLE',
                    qrcode
                }
            })
        });

    })

    describe('Confirm 2FA request', () => {
        it('Bad identity token should be failed', async () => {
            const code = authenticator.generate(testGoogleToken);
            const invalidToken = 'invalid-token';
            try {
                await authService.confirmTfaRequest(invalidToken, code, false);
            } catch (error) {
                expect(error).toStrictEqual(new UnauthorizedException({
                    error: true,
                    message: 'Invalid request'
                }, 'Invalid request'))
            }
        });

        it('Bad 2FA code should be failed', async () => {
            const invalidCode = 'invalid-code';
            try {
                await authService.confirmTfaRequest(oneTimeToken, invalidCode, false);
            } catch (error) {
                expect(error).toStrictEqual(new UnauthorizedException({
                    error: true,
                    message: 'Invalid 2FA code'
                }, 'Invalid request'))
            }
        });

        it('2FA should be confirmed', async () => {
            jest.spyOn(authService, 'rnd').mockImplementation(() => oneTimeToken);
            const code = authenticator.generate(testGoogleToken);

            const no2FAUser = await userService.findOne({email: testEmail}, ['security']);
            await authService.requestTfa(no2FAUser, TFA_TYPE.GOOGLE);
            expect(await authService.confirmTfaRequest(oneTimeToken, code, false)).toBeDefined();

            const user: User = await userService.findOne({email: testEmail}, ['security']);
            expect(user.security.tfaEnabled).toBe(true);
            expect(user.security.tfaType).toBe('GOOGLE');
            expect(user.security.googleSecret).toBe(testGoogleToken);
        });
    })

    describe('Login', () => {
        it('Login success', async () => {
            jest.spyOn(authService, 'rnd').mockImplementation(() => oneTimeToken);
            const user = await userService.findOne({email: testEmail, deleted: false}, ['security']);

            expect(await authService.login(user)).toStrictEqual({
                token: oneTimeToken,
                tfa: 'GOOGLE'
            });
        });

        it('Confirm 2FA for Login', async () => {
            const code = authenticator.generate(testGoogleToken);
            expect(await authService.confirmTfaCode(oneTimeToken, code)).toBeDefined();
        })
    })

    describe('Forgot password', () => {
        it('Forgot password', async () => {
            jest.spyOn(authService, 'rnd').mockImplementation(() => oneTimeToken);
            jest.spyOn(mailService, 'sendResetPaassword').mockImplementation(async () => 'sent');

            expect(await authService.forgotPassword(testEmail)).toStrictEqual({
                status: 'success',
                tfa: true
            })
        });

        it('Reset password', async () => {
            const code = authenticator.generate(testGoogleToken);
            expect(await authService.resetPassword(oneTimeToken, 'newPassword', code)).toStrictEqual({
                status: 'success'
            });
        });
    })

    afterAll(async () => {
        await userService.removeByEmail(testEmail);
    })

})
