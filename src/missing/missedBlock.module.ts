import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/database/database.module";
import { MissedBlockProviders } from "./missedBlock.provider";
import { MissedBlockService } from "./missedBlock.service";

@Module({
    imports: [DatabaseModule],
    providers: [
        ...MissedBlockProviders,
        MissedBlockService
    ],
    exports: [MissedBlockService]
})
export class MissedBlockModule {}
