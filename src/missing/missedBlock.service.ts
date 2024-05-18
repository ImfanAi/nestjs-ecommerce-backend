import { Inject, Injectable } from "@nestjs/common";
import { LessThanOrEqual, Repository } from "typeorm";
import { MissedBlockDto } from "./missedBlock.dto";
import { MissedBlock } from "./missedBlock.entity";

@Injectable()
export class MissedBlockService {
    constructor(
        @Inject('MISSEDBLOCK_REPOSITORY')
        private blockRepository: Repository<MissedBlock>
    ) {}

    async insert(block: MissedBlockDto) {
        return await this.blockRepository.save(block);
    }

    async findByNetwork(network: string, retry?: number): Promise<MissedBlock[]> {
        return await this.blockRepository.find({where: {network, retry: LessThanOrEqual(retry)}});
    }

    async updateFetchStatus(id: number, fetched: boolean, retry: number) {
        const updatedAt = new Date(Date.now()).toLocaleString();
        return await this.blockRepository.update({id}, {fetched, updatedAt, retry})
    }
}
