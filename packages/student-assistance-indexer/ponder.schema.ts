import { onchainTable } from "ponder";

// Transfers table - tracks all transfers from students
export const transfers = onchainTable("transfers", (t) => ({
  id: t.text().primaryKey(), // transaction hash
  txHash: t.text().notNull(),
  fromAddress: t.text().notNull(),
  toAddress: t.text().notNull(),
  amount: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  indexedAt: t.bigint().notNull(),
}));