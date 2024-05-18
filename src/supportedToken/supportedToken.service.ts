import { Inject, Injectable } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { EnableSupportedToken } from "./dto/enableSupportedToken.dto";
import { SupportedToken } from "./entity/supportedToken.entity";

@Injectable()
export class SupportedTokenService {

    constructor(
        @Inject('SUPPORTEDTOKEN_REPOSITORY')
        private supTokenRepository: Repository<SupportedToken>
    ) {}

    // Enable token, 1st - doesn't exsit case, 2nd - exist, but disabled
    // Disable token, just remove flag, check that exists or not
    async enable(token: EnableSupportedToken)
    {
        const {network, user, name, flag} = token;
        const _token = await this.supTokenRepository.createQueryBuilder('supported_token')
            .where('supported_token.user_id = :userId', {userId: user.id})
            .andWhere('supported_token.network = :network', {network})
            .andWhere('supported_token.name = :name', {name})
            .leftJoinAndSelect('supported_token.user', 'user')
            .getOne();
        if(_token) {
            await this.supTokenRepository.createQueryBuilder()
                .update(_token)
                .set({flag: flag})
                .where('network = :network', {network})
                .andWhere('name = :name', {name})
                .andWhere('user_id = :userId', {userId: user.id})
                .execute();
        } else {
            this.supTokenRepository
            .createQueryBuilder('supported_token')
            .insert()
            .values({
                network, name, user
            })
            .execute();
        }
        return token;
    }

    async checkToken(user: User, network: string, name: string) {
        return await this.supTokenRepository.createQueryBuilder('supported_token')
            .where('supported_token.user_id = :user', {user: user.id})
            .andWhere('supported_token.network = :network', {network})
            .andWhere('supported_token.name = :name', {name})
            .andWhere('supported_token.flag = :flag', {flag: true})
            .leftJoinAndSelect('supported_token.user', 'user')
            .getOne();
    }

    async selectAll(user: User) : Promise<SupportedToken[]> {
        return await this.supTokenRepository.createQueryBuilder('supported_token')
            .where('supported_token.user_id = :userId', {userId: user.id})
            .getMany();
    }
 }
