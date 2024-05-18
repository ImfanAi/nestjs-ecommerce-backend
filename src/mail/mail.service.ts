import { MailerService } from '@nestjs-modules/mailer';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) {}

    async sendUserConfirmation(user: User, token: string) {
        const url = `${process.env.BASE_URL}/auth/verify/${token}`;
        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Welcome to Nyyu payment gateway! Confirm your email',
                template: './mailVerify',
                context: {
                    name: `${user.firstName} ${user.lastName}`,
                    url
                }
            });
        } catch (error) {
            console.log('cannot send verification email');
            console.log(error);
            return null;
        }
        return 'success';
    }

    async sendResetPaassword(user: User, token: string) {
        const url = `${process.env.BASE_URL}/auth/reset-password/${token}`;
        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Reset your password',
                template: './resetPassword',
                context: {
                    name: `${user.firstName} ${user.lastName}`,
                    url
                }
            });
        } catch (error) {
            console.log('cannot send reset password email');
            console.log(error);
            return null;
        }
        return 'success';
    }

    async sendResetNotify(user: User, content: string, subject: string, template: string) {
        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject,
                template,
                context: {
                    name: `${user.firstName} ${user.lastName}`,
                    content
                }
            });
        } catch (error) {
            console.log('cannot send reset password email');
            console.log(error);
            return null;
        }
        return 'success';
    }

    async send2faCode(user: User, code: string) {
        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Verify 2FA Code',
                template: './2faVerify',
                context: {
                    name: `${user.firstName} ${user.lastName}`, code
                }
            });
        } catch (error) {
            console.log('cannot send 2FA code email');
            console.log(error);
            return null;
        }
    }
}
