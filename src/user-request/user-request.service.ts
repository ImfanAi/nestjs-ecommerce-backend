import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { SettingsService } from 'src/settings/settings.service';
import { Repository } from 'typeorm';
import { CreateUserRequest } from './dto/create-userrequest.dto';
import { UpdateUserRequestDto } from './dto/update-userrequest.dto';
import { REQUEST_TYPE, UserRequest } from './entities/user-request.entity';

@Injectable()
export class UserRequestService {
    constructor(
        @Inject('USERREQUEST_REPOSITORY')
        private readonly userReqRepository: Repository<UserRequest>,
        private readonly settingsService: SettingsService,
        private readonly mailService: MailService
    ) {

    }

    async create(req: CreateUserRequest) {
        return await this.userReqRepository.save(req);
    }

    async findOneById(id: number) {
        const userRequest = await this.userReqRepository.createQueryBuilder('userrequests')
            .leftJoinAndSelect('userrequests.user', 'user')
            .leftJoinAndSelect('user.security', 'security')
            .where('userrequests.id = :id', {id})
            .getOne();
        console.log(userRequest);
        return userRequest;
    }

    async findByStatus(page: number = 1, take: number = 15, status?: number) {
        let queryBuilder = this.userReqRepository.createQueryBuilder('userrequests')
            .leftJoinAndSelect('userrequests.admin', 'admin')
            .leftJoinAndSelect('userrequests.user', 'user');
        if(status) {
            queryBuilder = queryBuilder.where('userrequests.status = :status', {status});
        }
        const [userRequests, total] = await queryBuilder
            .take(take)
            .skip((page - 1) * take)
            .getManyAndCount();
        return {
            data: userRequests,
            meta: {
                total,
                page,
                last_page: Math.ceil(total / take)
            }
        }
    }

    async approveRequest(request: UserRequest) {
        switch(request.requestType) {
            case REQUEST_TYPE.TFA_RESET:
                const security = request.user.security;
                await this.settingsService.resetTfa(security.id);
                await this.mailService.sendResetNotify(request.user,
                    'Your 2FA has been reset',
                    './notify2FAReset',
                    'Your 2FA has been reset. Please set again');
                break;
            default:
                throw new BadRequestException('No such request type');
        }

        return {
            status: 'success'
        }
    }

    async denyRequest(request: UserRequest, dto: UpdateUserRequestDto) {
        await this.userReqRepository.update({id: request.id}, dto);
        await this.mailService.sendResetNotify(
            request.user,
            'Your request has been denied',
            './notify2FAReset',
            `Your request ${request.requestType} has been denied. Because of ${dto.reason}`
        );

        return {
            status: 'success'
        };
    }
}
