# Ambiente Hyperledger Besu para DREX

Este diretório contém a configuração necessária para executar um ambiente local de desenvolvimento Hyperledger Besu para o projeto DREX.

## Componentes

O ambiente inclui:

1. **Hyperledger Besu**: Cliente Ethereum empresarial que executa a blockchain
2. **Blockscout**: Explorador de blocos para visualizar transações, contratos e contas
3. **PostgreSQL**: Banco de dados para o Blockscout

## Requisitos

- Docker e Docker Compose instalados
- Pelo menos 4GB de RAM livre
- 10GB de espaço em disco

## Como iniciar o ambiente

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar logs dos serviços
docker-compose logs -f besu-node
docker-compose logs -f blockscout

# Parar os serviços
docker-compose down
```

## Acessando os serviços

- **Besu RPC HTTP**: http://localhost:8545
- **Besu RPC WebSocket**: ws://localhost:8546
- **Blockscout (explorador)**: http://localhost:4000

## Configuração do Besu

O nó Besu está configurado com:

- Rede de desenvolvimento (`--network=dev`)
- Mineração habilitada para gerar blocos
- APIs HTTP e WebSocket ativadas
- CORS ativado para desenvolvimento
- Métricas ativadas para monitoramento

## Contas de desenvolvimento

Na rede de desenvolvimento, a seguinte conta já está provisionada com ETH:

- Endereço: `0xfe3b557e8fb62b89f4916b721be55ceb828dbd73`
- Chave privada: `0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63`

## Interagindo com o Besu

Você pode interagir com o nó Besu usando ferramentas como:

- Web3.js ou ethers.js para desenvolvimento JavaScript
- HardHat ou Truffle para deploy de contratos inteligentes
- MetaMask (apontando para http://localhost:8545)

## Problemas comuns

1. **Erro ao conectar ao Besu**:
   - Verifique se os containers estão rodando: `docker-compose ps`
   - Verifique os logs: `docker-compose logs besu-node`

2. **Blockscout não mostra transações**:
   - Pode levar alguns minutos para sincronizar
   - Verifique se o Besu está gerando blocos corretamente

## Próximos passos

1. Implementar contratos inteligentes para o DREX
2. Configurar contas e permissões específicas
3. Desenvolver aplicação para interagir com os contratos 