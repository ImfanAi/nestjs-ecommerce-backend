import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/role.decorator";
import { Role } from "src/auth/role.enum";
import { CreateTokenDto } from "./dto/token.dto";
import { UpdateTokenDto } from "./dto/update-token.dto";
import { TokenService } from "./token.service";

@Controller('token')
export class TokenController {
    constructor(
        private readonly tokenService: TokenService) {}

    @Roles(Role.Admin)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    async insert(@Body() token: CreateTokenDto) {
        return await this.tokenService.create(token);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll() {
        return await this.tokenService.all();
    }

    @UseGuards(JwtAuthGuard)
    @Get('one')
    async findToken(
        @Query('network') network: string,
        @Query('name') name: string
    ) {
        return await this.tokenService.findOne({network, name});
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findTokenById(@Param('id') id: number) {
        return await this.tokenService.findOne({id});
    }

    @Roles(Role.Admin)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put(':id')
    async updateToken(
        @Param('id') id: number,
        @Body() body: UpdateTokenDto
    ) {
        await this.tokenService.update(id, body);
        return await this.tokenService.findOne({id});
    }

    @Roles(Role.Admin)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    async deleteToken(@Param('id') id: number) {
        const token = await this.tokenService.findOne({id});
        const { affected } = await this.tokenService.delete(id);
        return affected === 1 ? token : null
    }
}
