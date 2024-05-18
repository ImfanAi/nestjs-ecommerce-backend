import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaginatedResult } from './paginate.result';

@Injectable()
export abstract class AbstractService {
    protected constructor (
        protected readonly repository: Repository<any>
    ) {

    }

    async all() : Promise<any[]> {
        return await this.repository.find();
    }

    async findBy(condition): Promise<any[]> {
        return await this.repository.find({where: condition})
    }

    async paginate(page: number = 1, take: number = 15, relations = [], condition = {}): Promise<PaginatedResult> {
        const [data, total] = await this.repository.findAndCount(
            {where: condition, take, skip: (page - 1) * take, relations}
        );

        return {
            data: data,
            meta: {
                total,
                page,
                last_page: Math.ceil(total / take)
            }
        }
    }

    async create(data): Promise<any> {
        try {
            return await this.repository.save(data);
        } catch (error) {
            console.log(error);
            throw new BadRequestException('cannot create');
        }
    }

    async findOne(condition, relations = []): Promise<any> {
        return await this.repository.findOne({where: condition, relations});
    }

    async update(id: number, data): Promise<any> {
        return await this.repository.update({id}, data);
    }

    async delete(id: number) {
        return await this.repository.delete({id});
    }
}
