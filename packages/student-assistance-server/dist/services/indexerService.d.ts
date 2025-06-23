interface IndexerTransfer {
    id: string;
    from: string;
    to: string;
    amount: string;
    timestamp: number;
    blockNumber: number;
    transactionHash: string;
}
export declare class IndexerService {
    private client;
    private indexerUrl;
    constructor();
    getTransfersByAddress(address: string, page?: number, limit?: number): Promise<{
        transfers: IndexerTransfer[];
        total: number;
    }>;
    getTransferByHash(txHash: string): Promise<IndexerTransfer | null>;
    isIndexerAvailable(): Promise<boolean>;
}
export declare const indexerService: IndexerService;
export {};
//# sourceMappingURL=indexerService.d.ts.map