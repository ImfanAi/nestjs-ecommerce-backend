import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Bep20Service } from 'src/bep20/bep20.service';
import { TokenService } from 'src/tokens/token.service';
import { Token } from 'src/tokens/token.entity';

import { NetListenerService } from '../baseListener/net.listener.service';
import { PegListenerService } from 'src/baseListener/peg.listener.service';
import { BSC_NETWORK } from 'src/constants';

@Injectable()
export class ListenerService {
    constructor(
        private readonly bscListener: PegListenerService,
        private readonly bep20Service: Bep20Service,
        @Inject(forwardRef(() => TokenService))
        private readonly tokenService: TokenService,
        private readonly bnbListener: NetListenerService,
    ) {
        this.init();
    }

    /// initialize listeners for NDB
    async init() {
        // initiate BEP20 tokens listener service
        this.bscListener.receiverService = this.bep20Service;
        this.bscListener.init('BEP20', 'BNB', process.env.BSC_JSON_RPC);

        const bnbToken = await this.tokenService.findOne({network: BSC_NETWORK, name: 'BNB'})
        if(bnbToken) {
            await this.bnbListener.init(
                'BEP20',
                `${process.env.BSC_JSON_RPC}`,
                bnbToken,
                this.bep20Service,
            );
        }
    }

    async addToken(token: Token) {
        await this.bscListener.addToken(token);
    }
}
