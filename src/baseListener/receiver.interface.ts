import { Bep20 } from "src/bep20/bep20.entity";

export default interface ReceiverService {
    findByAddress(address: string): Promise<Bep20>
}