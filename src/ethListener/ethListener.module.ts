import { forwardRef, Module } from "@nestjs/common";
import { AddressModule } from "src/address/address.module";
import { EthCacheService } from "src/baseListener/cache.service";
import { NetListenerService } from "src/baseListener/net.listener.service";
import { PegListenerService } from "src/baseListener/peg.listener.service";
import { Bep20Module } from "src/bep20/bep20.module";
import { LogModule } from "src/clogs/log.module";
import { RequestModule } from "src/request/request.module";
import { SettingsModule } from "src/settings/settings.module";
import { TokensModule } from "src/tokens/token.module";
import { TransactionsModule } from "src/transactions/transactions.module";
import { UtilsModule } from "src/utils/utils.module";
import { EthListenerService } from "./ethListener.service";

@Module({
    imports: [
        Bep20Module,
        forwardRef(() => TokensModule),
        SettingsModule, TransactionsModule,
        LogModule, UtilsModule,
        AddressModule,
        RequestModule
    ],
    providers: [EthListenerService, PegListenerService, EthCacheService, NetListenerService],
    exports: [EthListenerService]
})
export class EthListenerModule {}
