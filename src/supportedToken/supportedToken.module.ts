import { forwardRef, Module } from "@nestjs/common";
import { BalanceModule } from "src/balance/balance.module";
import { DatabaseModule } from "src/database/database.module";
import { TokensModule } from "src/tokens/token.module";
import { SupportedTokenController } from "./supportedToken.controller";
import { SupportedTokenProviders } from "./supportedToken.provider";
import { SupportedTokenService } from "./supportedToken.service";

@Module({
    imports: [
        DatabaseModule,
        forwardRef(() => TokensModule),
        BalanceModule
    ],
    controllers: [SupportedTokenController],
    providers: [
        ...SupportedTokenProviders,
        SupportedTokenService
    ],
    exports: [SupportedTokenService]
})
export class SupportedTokenModule {}
