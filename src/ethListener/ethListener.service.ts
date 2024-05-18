import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { NetListenerService } from "src/baseListener/net.listener.service";
import { PegListenerService } from "src/baseListener/peg.listener.service";
import { Bep20Service } from "src/bep20/bep20.service";
import { ERC_NETWORK } from "src/constants";
import { Token } from "src/tokens/token.entity";
import { TokenService } from "src/tokens/token.service";

@Injectable()
export class EthListenerService {
    constructor(
        private readonly ercListener: PegListenerService,
        private readonly bep20Service: Bep20Service,
        @Inject(forwardRef(() => TokenService))
        private readonly tokenService: TokenService,
        private readonly ethListener: NetListenerService
    ) {
        this.init();
    }

    async init() {
        // initiate BEP20 tokens listener service
        this.ercListener.receiverService = this.bep20Service;
        this.ercListener.init('ERC20', 'ETH', process.env.ETH_JSON_RPC);

        const ethToken = await this.tokenService.findOne({network: ERC_NETWORK, name: 'ETH'})
        if(ethToken) {
            await this.ethListener.init(
                'ERC20',
                `${process.env.ETH_JSON_RPC}`,
                ethToken,
                this.bep20Service,
            );
        }
    }

    async addToken(token: Token) {
        await this.ercListener.addToken(token);
    }
}
