"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexerService = exports.IndexerService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class IndexerService {
    constructor() {
        this.indexerUrl = process.env.INDEXER_GRAPHQL_URL || 'http://localhost:42069/graphql';
        this.client = axios_1.default.create({
            baseURL: this.indexerUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    async getTransfersByAddress(address, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const query = `
        query GetTransfers($address: String!, $limit: Int!, $offset: Int!) {
          transfers(
            where: {
              or: [
                { from: { equals: $address } }
                { to: { equals: $address } }
              ]
            }
            orderBy: { timestamp: "desc" }
            limit: $limit
            offset: $offset
          ) {
            id
            from
            to
            amount
            timestamp
            blockNumber
            transactionHash
          }
        }
      `;
            const countQuery = `
        query CountTransfers($address: String!) {
          transfers(
            where: {
              or: [
                { from: { equals: $address } }
                { to: { equals: $address } }
              ]
            }
          ) {
            id
          }
        }
      `;
            const variables = {
                address: address.toLowerCase(),
                limit,
                offset
            };
            // Execute both queries
            const [response, countResponse] = await Promise.all([
                this.client.post('', {
                    query,
                    variables
                }),
                this.client.post('', {
                    query: countQuery,
                    variables: { address: address.toLowerCase() }
                })
            ]);
            return {
                transfers: response.data?.data?.transfers || [],
                total: countResponse.data?.data?.transfers?.length || 0
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching transfers from indexer:', error);
            // If indexer is not available, return empty results
            // The API will fall back to database transactions
            return {
                transfers: [],
                total: 0
            };
        }
    }
    async getTransferByHash(txHash) {
        try {
            const query = `
        query GetTransfer($txHash: String!) {
          transfers(
            where: { transactionHash: { equals: $txHash } }
            limit: 1
          ) {
            id
            from
            to
            amount
            timestamp
            blockNumber
            transactionHash
          }
        }
      `;
            const response = await this.client.post('', {
                query,
                variables: { txHash: txHash.toLowerCase() }
            });
            return response.data?.data?.transfers?.[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Error fetching transfer by hash from indexer:', error);
            return null;
        }
    }
    async isIndexerAvailable() {
        try {
            const query = `
        query HealthCheck {
          transfers(limit: 1) {
            id
          }
        }
      `;
            await this.client.post('', { query });
            return true;
        }
        catch (error) {
            logger_1.logger.warn('Indexer is not available:', error);
            return false;
        }
    }
}
exports.IndexerService = IndexerService;
exports.indexerService = new IndexerService();
//# sourceMappingURL=indexerService.js.map