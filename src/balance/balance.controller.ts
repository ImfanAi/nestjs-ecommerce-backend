import { Controller, Get, HttpException, HttpStatus, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/auth/role.enum';
import { UsersService } from 'src/users/users.service';
import { BalanceService } from './balance.service';

@Controller('balance')
export class BalanceController {
    constructor(
        private readonly balanceService: BalanceService,
        private readonly userService: UsersService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getBalances(@Request() req: any) {
        return await this.balanceService.getBalances(req.user);
    }

    @Roles(Role.Admin)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get(':id')
    async getBalancesByUser(@Param('id') id: number) {
        const user = await this.userService.findOne({id, deleted: false}, ['setting', 'security']);
        if(!user) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                msg: 'No such user'
            }, HttpStatus.NOT_FOUND)
        }
        return await this.balanceService.getBalances(user);
    }
}
