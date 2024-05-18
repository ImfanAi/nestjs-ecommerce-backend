import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import ReceiverService from "src/baseListener/receiver.interface";
import { Repository } from "typeorm";
import { CreateBep20Dto } from "./bep20.dto";
import { Bep20 } from "./bep20.entity";

@Injectable()
export class Bep20Service implements ReceiverService {
    constructor(
        @Inject('BEP20_REPOSITORY')
        private bep20Repository: Repository<Bep20>,
    ) {}

    async create(createBep20: CreateBep20Dto) {
        try {
            const newAddress = await this.bep20Repository.save(createBep20);
            return {
                status: HttpStatus.CREATED,
                address: newAddress.address,
                error: null
            }
        } catch (error) {
            console.log('------- cannot insert new wallet --------');
            console.log(error);
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                address: null,
                error
            }, HttpStatus.BAD_REQUEST);
        }
    }

    async find(): Promise<Bep20[]> {
        return this.bep20Repository.find({
            relations: {
                user: true
            }
        });
    }

    async findByAddress(address: string, lowerCase:boolean = true): Promise<Bep20> {
        if (lowerCase) {
            address = address.toLowerCase();
        }
        return this.bep20Repository.findOne({where: {address}, relations: {user: true, setting: true}})
    }
}
