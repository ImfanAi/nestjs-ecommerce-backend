import { forwardRef, Module } from "@nestjs/common";
import { AddressModule } from "src/address/address.module";
import { Bep20Module } from "src/bep20/bep20.module";
import { LogModule } from "src/clogs/log.module";
import { MissedBlockModule } from "src/missing/missedBlock.module";
import { RequestModule } from "src/request/request.module";
import { TokensModule } from "src/tokens/token.module";
import { TransactionsModule } from "src/transactions/transactions.module";
import { UtilsModule } from "src/utils/utils.module";
import { SolService } from "./sol.service";

@Module({
    imports: [forwardRef(() => TokensModule),
        Bep20Module,
        UtilsModule,
        TransactionsModule,
        LogModule,
        MissedBlockModule,
        AddressModule,
        RequestModule
    ],
    providers: [SolService],
    exports: [SolService]
})
export class SolModule {}
