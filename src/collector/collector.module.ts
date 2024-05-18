import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/database/database.module";
import { collectorProviders } from "./collector.provider";
import { CollectorService } from "./collector.service";

@Module({
    imports: [
        DatabaseModule
    ], 
    providers: [
        ...collectorProviders
    ],
    exports: [CollectorService]
})

export class CollectorModule {}