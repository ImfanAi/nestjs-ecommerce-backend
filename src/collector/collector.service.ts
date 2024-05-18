import { Inject, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreateCollectorDto } from "./dto/create-collector.dto";
import { Collector } from "./entities/collector.entity";

@Injectable()
export class CollectorService {
    constructor(
        @Inject('COLLECTOR_REPOSITORY')
        private readonly repository: Repository<Collector>,
    ) {}

    // add new address to pending list
    async insertPendingCollector(collectorDto: CreateCollectorDto) {
        return this.repository.create(collectorDto);
    }

    // get pending address 
    async getPendingCollectRequest() {
        return await this.repository.find({where: {
            status: 0
        }});
    }

    // get collecting history
    async getCollectorLogs(status?: number) {
        if(status) {
            return this.repository.find({where: {status}})
        }
        return this.repository.find();
    }

    // sending function 


}