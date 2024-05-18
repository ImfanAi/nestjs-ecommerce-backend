import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { AbstractService } from "src/common/abstract.service";
import { Repository, UpdateResult } from "typeorm";
import { Token } from "./token.entity";

@Injectable()
export class TokenService extends AbstractService {
    constructor(
        @Inject('TOKEN_REPOSITORY')
        private tokenRepository: Repository<Token>,
    ) {
        super(tokenRepository);
    }

    async updateTokenSync(id: number, syncBlock: string): Promise<UpdateResult> {
        return this.tokenRepository.update({id}, {syncBlock});
    }

    async updateTokenSyncByNetwork(network: string, syncBlock: string): Promise<void>{
        this.tokenRepository.update({network}, {syncBlock});
    }
}
