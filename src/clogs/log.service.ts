import { Inject, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { LogDto } from "./log.dto";
import { Log } from "./log.entity";

@Injectable()
export class LogService {
    constructor(
        @Inject('LOG_REPOSITORY')
        private logRepository: Repository<Log>,
    ) {}

    async insert(log: LogDto) {
        await this.logRepository.save(log);
    }
}