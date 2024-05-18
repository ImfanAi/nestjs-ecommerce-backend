import { Inject, Injectable } from '@nestjs/common';
import { AbstractService } from 'src/common/abstract.service';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateCallbackStatusDto } from './dto/create-callback-status.dto';
import { CallbackStatus } from './entities/callback-status.entity';

@Injectable()
export class CallbackStatusService extends AbstractService {
    constructor(
        @Inject('CALLBACKSTATUS_REPOSITORY')
        private readonly callbackStatusRepo: Repository<CallbackStatus>,
    ) {
        super(callbackStatusRepo);
    }

    // create new status
    async insertNewCallbackStatus(status: CreateCallbackStatusDto) {
        return this.callbackStatusRepo.save(status);
    }

    // update status
    async updateCallbackStatus(id: number, statusCode: number, status: string) {
        return this.callbackStatusRepo.update({id}, {status, statusCode});
    }

    // get status
    async getCallbackStatusByUser(userId: number, page: number = 1, take: number = 15) {
        return this.callbackStatusRepo
            .createQueryBuilder()
            .where('user_id = :userId', {userId: userId})
            .skip((page - 1) * take)
            .take(take)
            .getMany();
    }

    async getCallbackStatusById(id: number) {
        return this.callbackStatusRepo.findOne({where: {id}});
    }
}
