import { PendingTxnNode } from "./pending.txn";

export interface ILinkedList<T> {
    insertInBegin(data: T): PendingTxnNode<T>;
    insertAtEnd(data: T): PendingTxnNode<T>;
    deleteNode(node: PendingTxnNode<T>): void;
    traverse(): T[];
    size(): number;
    search(comparator: (data: T) => boolean): T[] | null;
}

export class LinkedList<T> implements ILinkedList<T> {
    private head: PendingTxnNode<T> | null = null;

    insertInBegin(data: T): PendingTxnNode<T> {
        const node = new PendingTxnNode(data);
        if(!this.head) {
            this.head = node;
        } else {
            this.head.prev = node;
            node.next = this.head;
            this.head = node;
        }
        return node;
    }
    insertAtEnd(data: T): PendingTxnNode<T> {
        const node = new PendingTxnNode(data);
        if(!this.head) {
            this.head = node;
        } else {
            const getLast = (node: PendingTxnNode<T>): PendingTxnNode<T> => {
                return node.next ? getLast(node.next) : node;
            }
            const lastNode = getLast(this.head);
            node.prev = lastNode;
            lastNode.next = node;
        }
        return node;
    }
    deleteNode(node: PendingTxnNode<T>): void {
        if(!node.prev) {
            this.head = node.next;
        } else {
            const prevNode = node.prev;
            prevNode.next = node.next;
        }
    }
    async deleteByData(comparator: (data: T) => boolean): Promise<boolean> {
        const _delete = (node: PendingTxnNode<T>): Promise<boolean> => {
            if(comparator(node.data)) {
                console.log('found matched');
                // delete
                if(!node.prev) {
                    this.head = node.next;
                } else {
                    const prevNode = node.prev;
                    prevNode.next = node.next;
                }
                return Promise.resolve(true);
            }
            return node.next ? _delete(node.next) : Promise.resolve(false);
        }
        return this.head ? _delete(this.head) : Promise.resolve(false);
    }
    traverse(): T[] {
        const array: T[] = [];
        if(!this.head) {
            return array;
        }

        const addToArray = (node: PendingTxnNode<T>): T[] => {
            array.push(node.data);
            return node.next ? addToArray(node.next) : array;
        };
        return addToArray(this.head);
    }
    size(): number {
        return this.traverse().length;
    }
    search(comparator: (data: T) => boolean): T[] {
        const matched: T[] = [];
        const checkNext = (node: PendingTxnNode<T>): T[] | null => {
            if(comparator(node.data)) {
                matched.push(node.data);
            }
            return node.next ? checkNext(node.next) : matched;
        }
        return this.head ? checkNext(this.head) : [];        
    }
    
}