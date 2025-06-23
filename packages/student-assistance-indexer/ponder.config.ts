import { createConfig } from "ponder";

// Minimal ABI for testing - just the Transfer event  
const StudentAssistanceVaultAbi = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  }
] as const;

export default createConfig({
  chains: {
    besu: {
      id: 1337, // Local Besu network chain ID
      rpc: "http://localhost:8545",
    },
  },
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  contracts: {
    StudentAssistanceVault: {
      chain: "besu",
      address: "0xcC4c41415fc68B2fBf70102742A83cDe435e0Ca7", // StudentAssistanceVault deployed address
      abi: StudentAssistanceVaultAbi,
      startBlock: 0,
    },
  },
}); 