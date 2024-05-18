import { DataSource } from "typeorm";
import { PaymentRequest } from "./entities/paymentRequest.entity";

export const RequestProviders = [
    {
        provide: 'PAYMENTREQUEST_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(PaymentRequest),
        inject: ['DATA_SOURCE']
    }
]
