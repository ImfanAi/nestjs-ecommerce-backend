import { BadRequestException, Body, ClassSerializerInterceptor, Request, Controller, Get, Param, Post, UnauthorizedException, UseGuards, UseInterceptors } from '@nestjs/common';
import { TFA_TYPE } from 'src/settings/entities/security.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller()
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UsersService
    ) {

    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Post('register')
    async signup(@Body() user: CreateUserDto) {
        return this.userService.create(user);
    }

    @Get('verify/:token') // for test?
    async mailVerify(
        @Param('token') token: string
    ) {
        return this.authService.verifyEmail(token);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(LocalAuthGuard)
    @Post('tfa')
    async tfaEnable(@Request() req: any) {
        let tfaType: any;
        if(req.body.type === "EMAIL") {
            tfaType = TFA_TYPE.EMAIL;
        } else if(req.body.type === 'GOOGLE') {
            tfaType = TFA_TYPE.GOOGLE;
        } else {
            throw new UnauthorizedException({
                error: true,
                message: "Invaid 2FA type"
            }, "Please verify email");
        }

        const user = await this.userService.findOne(
            {email: req.user.email, deleted: false}, ['security', 'setting']
        );
        return this.authService.requestTfa(user, tfaType);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Post('tfa/confirm')
    async confirmTfaRequest(@Request() req: any) {
        const tfaCode = req.body.tfaCode;
        const token = req.body.token;
        const jwt = req.body.jwt;
        return this.authService.confirmTfaRequest(token, tfaCode, jwt);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req: any) {
        return this.authService.login(req.user);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Post('verify')
    async tfaVerify(@Request() req: any) {
        const { token, code } = req.body;
        return this.authService.confirmTfaCode(token, code);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Post('forgot-password')
    async forgotPassword(@Request() req: any) {
        const { email } = req.body;
        if(!email) {
        throw new BadRequestException('No email');
        }
        return await this.authService.forgotPassword(email);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Post('backup')
    async backupAccount(@Request() req: any) {
        return 'test';
    }
}
