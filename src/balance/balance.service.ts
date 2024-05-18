import { Inject, Injectable } from '@nestjs/common';
import { Token } from 'src/tokens/token.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateBalanceDto } from './dto/create-balance.dto';
import { Balance } from './entities/balance.entity';

@Injectable()
export class BalanceService {
    constructor(
        @Inject('BALANCE_REPOSITORY')
        private balanceRepo: Repository<Balance>,
    ) {

    }

    async create(balanceDto: CreateBalanceDto) {
        return await this.balanceRepo
            .createQueryBuilder()
            .insert()
            .values(balanceDto)
            .orIgnore()
            .execute();
    }

    async addBalance(user: User, token: Token, amount: number) {
        try {
            return await this.balanceRepo.createQueryBuilder()
                .update(Balance)
                .set({balance: () => `"balance" + ${amount}`})
                .where("userId = :userId", {userId: user.id})
                .andWhere('tokenId = :tokenId', {tokenId: token.id})
                .execute();
        } catch (error) {
            console.log(error);
            throw new Error('cannot update balance');
        }
    }

    async setBalance(user: User, token: Token, amount: number) {
        try {
            return await this.balanceRepo
                .createQueryBuilder()
                .update()
                .set({balance: amount})
                .where('userId = :userId', {userId: user.id})
                .andWhere('tokenId = :tokenId', {tokenId: token.id})
                .execute();
        } catch (error) {
            console.log(error);
            throw new Error('cannot update balance');
        }
    }

    async getBalances(user: User) {
        try {
            return await this.balanceRepo
                .createQueryBuilder('balance')
                .where('balance.user_id = :userId', {userId: user.id})
                .leftJoin('balance.token', 'token')
                .select(['balance.balance', 'token.name', 'token.decimal'])
                .getMany();
        } catch (error) {
            console.log(error);
            throw new Error('cannot get user balance');
        }
    }

}
