import { BadRequestException, Body, ClassSerializerInterceptor, Query, Get, Controller, Param, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { get } from 'http';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/auth/role.enum';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { UserRequestService } from './user-request.service';

@Controller('user-request')
export class UserRequestController {
  constructor(
    private readonly userRequestService: UserRequestService,
    private readonly userService: UsersService,
  ) {

  }

  /**
   * Create new request to admin
   * @param body
   * {
   *  email: requester
   *  type: requet type
   * }
   */
  @Post()
  async createNewRequest(@Body() body: any) {
    const email = body.email;
    const requestType = body.type;

    const user = await this.userService.findOne({email, deleted: false}, ['security', 'setting']);
    if(!user) {
      throw new BadRequestException('No user');
    }

    return this.userRequestService.create({
      user, requestType, requestedAt: new Date(Date.now())
    })
  }

  @Roles(Role.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async getUserRequests(
    @Query('page') page?: number,
    @Query('take') take?: number,
    @Query('status') status?: number
  ) {
    return this.userRequestService.findByStatus(page, take, status);
  }

  @Roles(Role.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/approve') // request id
  async approveRequest(@Param('id') id: number) {
    const request = await this.userRequestService.findOneById(id);
    if(!request) {
      return new BadRequestException('No such request');
    }

    if(request.status !== 0) // already processed
    {
      return new BadRequestException('Already processed');
    }
    return await this.userRequestService.approveRequest(request);
  }

  @Roles(Role.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/deny') // request id
  async denyRequest(@Req() req: any, @Param('id') id: number) {
    const request = await this.userRequestService.findOneById(id);
    if(!request) {
      return new BadRequestException('No such request');
    }

    if(request.status !== 0) // already processed
    {
      return new BadRequestException('Already processed');
    }

    await this.userRequestService.denyRequest(request, {
      admin: req.user as User,
      reason: req.body.reason,
      status: 2,
      updatedAt: new Date(Date.now())
    });

    return {
      status: 'success'
    }
  }


}
