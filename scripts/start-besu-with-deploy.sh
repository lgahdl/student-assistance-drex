#!/bin/bash

echo "🚀 Iniciando Besu node..."

# Start Besu
/opt/besu/bin/besu \
  --data-path=/data \
  --rpc-http-enabled=true \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-cors-origins='*' \
  --rpc-http-api=ETH,NET,WEB3,ADMIN,TXPOOL,DEBUG \
  --rpc-ws-enabled=true \
  --rpc-ws-host=0.0.0.0 \
  --rpc-ws-api=ETH,NET,WEB3,ADMIN,TXPOOL,DEBUG \
  --host-allowlist='*' \
  --min-gas-price=0 \
  --miner-enabled=true \
  --miner-coinbase=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --network=dev \
  --logging=INFO 