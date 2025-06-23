import { ponder } from "ponder:registry";

// Transfer event handler
ponder.on("StudentAssistanceVault:Transfer", async ({ event, context }) => {
  console.log("🔄 Transfer detected!", {
    from: event.args.from,
    to: event.args.to,
    amount: event.args.amount?.toString(),
    block: event.block.number,
    txHash: event.transaction.hash
  });

  // Store the transfer in the database
  await context.db.insert(context.schema.transfers).values({
    id: event.transaction.hash,
    txHash: event.transaction.hash,
    fromAddress: event.args.from,
    toAddress: event.args.to,
    amount: event.args.amount,
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
    indexedAt: BigInt(Math.floor(Date.now() / 1000)),
  });

  console.log("✅ Transfer stored in database:", event.transaction.hash);
}); 