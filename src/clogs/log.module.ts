import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/database/database.module";
import { LogProviders } from "./log.provider";
import { LogService } from "./log.service";

@Module({
    imports: [DatabaseModule],
    providers: [
        ...LogProviders,
        LogService
    ],
    exports: [LogService]
})

export class LogModule {}
