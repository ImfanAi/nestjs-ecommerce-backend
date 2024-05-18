import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, ClassSerializerInterceptor, BadRequestException, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/auth/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('take') take: number = 15,
    @Query('user') userId?: number
  ) {
    if(!userId) {
      throw new BadRequestException('User ID is required');
    }
    return await this.transactionsService.findAll(page, take, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  async findAllMine (
    @Req() req,
    @Query('page') page: number = 1,
    @Query('take') take: number = 15,
  ) {
    return await this.transactionsService.findAll(page, take, req.user.id);
  }

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.transactionsService.findOne(id);
  }

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateTransactionDto: UpdateTransactionDto) {
    await this.transactionsService.update(+id, updateTransactionDto);
    return await this.transactionsService.findOne(id);
  }

}
