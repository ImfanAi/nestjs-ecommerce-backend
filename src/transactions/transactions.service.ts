import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly txnRepository: Repository<Transaction>
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    return await this.txnRepository.save(createTransactionDto);
  }

  async findByHash(hash: string) {
    return await this.txnRepository.findOne({where: {txnHash: hash}});
  }

  async findAll(page: number, take: number, userId: number) {
    const [transactions, total] = await this.txnRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.paymentRequest', 'paymentRequest')
      .where('paymentRequest.userId = :userId', {userId})
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
    return {
      data: transactions,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / take)
      }
    }
  }

  async findOne(id: number) {
    return await this.txnRepository.findOne({where: {id}});
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return await this.txnRepository.update({id}, updateTransactionDto);
  }

}
