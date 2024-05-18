import { Body, Controller, Get, Post, UseGuards, Request, BadRequestException, Patch, Param } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { BalanceService } from "src/balance/balance.service";
import { TokenService } from "src/tokens/token.service";
import { EnableSupportedToken } from "./dto/enableSupportedToken.dto";
import { SupportedTokenService } from "./supportedToken.service";

@Controller('supported')
export class SupportedTokenController {
    constructor(
        private readonly supTokenService: SupportedTokenService,
        private readonly tokenService: TokenService,
        private readonly balanceService: BalanceService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('enable')
    async enableToken(@Request() req: any, @Body() token: EnableSupportedToken) {
        const _token = await this.tokenService.findOne({network: token.network, name: token.name});
        if(!_token) {
            throw new BadRequestException({
                status: 'error',
                msg: 'There is no such token'
            });
        }

        await this.balanceService.create({
            user: req.user.id,
            token: _token.id,
        })
        token.user = req.user;
        return await this.supTokenService.enable(token);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async selectAll(@Request() req: any) {
        return await this.supTokenService.selectAll(req.user);
    }

}
