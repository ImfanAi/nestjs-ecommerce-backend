import { Address } from "src/address/entity/address.entity";
import { Bep20 } from "src/bep20/bep20.entity";

export type PendingTxn = {
    /// transaction info
    id: number;
    txnHash: string;
    address: string;
    amount: string;
    blockNumber: number;
    wallet?: Bep20;
    addressObj?: Address
}

export class PendingTxnNode<T> {
    public next: PendingTxnNode<T> | null = null;
    public prev: PendingTxnNode<T> | null = null;

    constructor(public data: T) {}
}
