import { forwardRef, Module } from "@nestjs/common";
import { AddressModule } from "src/address/address.module";
import { Bep20Module } from "src/bep20/bep20.module";
import { LogModule } from "src/clogs/log.module";
import { RequestModule } from "src/request/request.module";
import { TokensModule } from "src/tokens/token.module";
import { TransactionsModule } from "src/transactions/transactions.module";
import { UtilsModule } from "src/utils/utils.module";
import { Trc20Service } from "./trc20.service";

@Module({
    imports: [
        forwardRef(() => TokensModule),
        Bep20Module,
        TransactionsModule,
        LogModule,
        UtilsModule,
        AddressModule,
        RequestModule
    ],
    providers: [Trc20Service],
    exports: [Trc20Service]
})
export class Trc20Module {}
