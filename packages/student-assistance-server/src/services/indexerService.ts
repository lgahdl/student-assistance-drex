import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface IndexerTransfer {
  id: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

interface IndexerResponse {
  data: {
    transfers: IndexerTransfer[];
  };
}

export class IndexerService {
  private client: AxiosInstance;
  private indexerUrl: string;

  constructor() {
    this.indexerUrl = process.env.INDEXER_GRAPHQL_URL || 'http://localhost:42069/graphql';
    this.client = axios.create({
      baseURL: this.indexerUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getTransfersByAddress(
    address: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ transfers: IndexerTransfer[]; total: number }> {
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

    } catch (error) {
      logger.error('Error fetching transfers from indexer:', error);
      
      // If indexer is not available, return empty results
      // The API will fall back to database transactions
      return {
        transfers: [],
        total: 0
      };
    }
  }

  async getTransferByHash(txHash: string): Promise<IndexerTransfer | null> {
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

    } catch (error) {
      logger.error('Error fetching transfer by hash from indexer:', error);
      return null;
    }
  }

  async isIndexerAvailable(): Promise<boolean> {
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
    } catch (error) {
      logger.warn('Indexer is not available:', error);
      return false;
    }
  }
}

export const indexerService = new IndexerService(); 