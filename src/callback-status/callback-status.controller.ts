import { ClassSerializerInterceptor, Controller, forwardRef, Get, HttpException, HttpStatus, Inject, Param, Post, Query, Request, UnauthorizedException, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/auth/role.enum';
import { UsersService } from 'src/users/users.service';
import { UtilsService } from 'src/utils/utils.service';
import { CallbackStatusService } from './callback-status.service';
import { CallbackStatus } from './entities/callback-status.entity';

@Controller('callback-status')
export class CallbackStatusController {
    constructor(
        @Inject(forwardRef(() => UtilsService))
        private readonly utilService: UtilsService,
        private readonly callbackStatusService: CallbackStatusService
    ) {

    }

    // get callback status
    @UseGuards(JwtAuthGuard)
    @Get()
    async getCallabckStatus(@Request() req: any) {
        return await this.callbackStatusService.getCallbackStatusByUser(req.user.id);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getCallabckStatusById(
        @Request() req: any,
        @Param('id') id: number
    ) {
        const callbackStatus: CallbackStatus = await this.callbackStatusService.findOne({id}, ['user']);
        if(req.user.roles.includes(Role.Admin)) {
            return callbackStatus;
        } else {
            if(callbackStatus.user.id !== req.user.id) {
                throw new UnauthorizedException('You can see only your own callback status');
            }
            return callbackStatus;
        }
    }

    @Roles(Role.Admin)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('user/:id')
    async getCallbackStatusByUser(
        @Param('id') userId: number,
        @Query('page') page: number = 1,
        @Query('take') take: number = 15,
    ) {
        return await this.callbackStatusService.getCallbackStatusByUser(
            userId, page, take
        )
    }

    @UseGuards(JwtAuthGuard)
    @Post('resend/:id')
    async resendCallback(@Request() req: any, @Param('id') id: number) {
        const callbackObj = await this.callbackStatusService.getCallbackStatusById(id);
        if(callbackObj.user.id !== req.user.id) {
            throw new HttpException(
                "Can send only own callback", HttpStatus.FORBIDDEN
            )
        }
        const status = await this.utilService.sendCallback(
            req.user.setting, JSON.parse(callbackObj.content), callbackObj.callback, true
        );

        if(status === 200) {
            // success
            await this.callbackStatusService.updateCallbackStatus(callbackObj.id, status, 'success');
        }
        return {
            status,
        }
    }

}
