/**
 * /src/index.ts
 * Ponto de entrada principal para o Piloto DREX
 */

// Carregar variáveis de ambiente
import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { Web3 } from "web3";

// Inicialização do aplicativo Express
const app = express();

// Middleware para processamento de JSON
app.use(express.json());
app.use(cors());

// Configuração da conexão com o Hyperledger Besu
const web3 = new Web3("http://localhost:8545");

// Rota principal
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "DREX Piloto API",
    version: "0.1.0",
    status: "online"
  });
});

// Rota para verificar a conexão com a blockchain
app.get("/blockchain/status", async (req: Request, res: Response) => {
  try {
    const blockNumber = await web3.eth.getBlockNumber();
    const nodeInfo = await web3.eth.getNodeInfo();
    
    res.json({
      connected: true,
      blockNumber,
      nodeInfo
    });
  } catch (error) {
    console.error("Erro ao conectar à blockchain:", error);
    res.status(500).json({
      connected: false,
      error: "Não foi possível conectar à blockchain",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor DREX Piloto rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`Para acessar a API: http://localhost:${PORT}`);
  console.log(`Para verificar a conexão com a blockchain: http://localhost:${PORT}/blockchain/status`);
}); 