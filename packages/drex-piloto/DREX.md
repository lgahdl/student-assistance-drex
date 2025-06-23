# DREX - Real Digital: Implementação Técnica

## O que é o DREX

De acordo com a documentação oficial no repositório `pilotord-kit-onboarding`, o DREX (Digital Real EXperimental) é o piloto da moeda digital do Banco Central do Brasil (BACEN). Conforme documentado em `pilotord-kit-onboarding/RealDigital.md` e `pilotord-kit-onboarding/smartcontracts.md`, o DREX é implementado como:

- Um token baseado no padrão ERC-20 chamado "Real Digital" com símbolo "BRL"
- É emitido e gerenciado pelo Banco Central do Brasil
- Utiliza duas casas decimais conforme descrito na função `decimals()`
- Opera em uma rede permissionada baseada em Hyperledger Besu

## Arquitetura do DREX

### Estrutura e Componentes

Conforme documentado em `pilotord-kit-onboarding/arquitetura.md` e `pilotord-kit-onboarding/smartcontracts.md`, o piloto do DREX é construído com:

1. **Hyperledger Besu versão 23.10.1** - Cliente Ethereum empresarial para redes privadas
2. **Algoritmo de consenso QBFT** (IBFT 2.0 evoluído para QBFT)
3. **Permissionamento onchain** - Controle de quem pode participar da rede

### Topologia da Rede

De acordo com `pilotord-kit-onboarding/arquitetura.md`:

- A comunicação entre os nós da rede se dá pela RSFN (Rede do Sistema Financeiro Nacional)
- Cada participante possui um único nó na rede (exceto o Banco Central)
- O Banco Central do Brasil opera:
  - 4 validadores e 2 fullnodes em Brasília
  - 2 validadores e 2 fullnodes no Rio de Janeiro

## Contratos Inteligentes do DREX

Baseado nos arquivos `pilotord-kit-onboarding/RealDigital.md`, `pilotord-kit-onboarding/RealTokenizado.md`, `pilotord-kit-onboarding/smartcontracts.md` e `pilotord-kit-onboarding/CBDCAccessControl.md`, o sistema utiliza os seguintes contratos principais:

### 1. RealDigital (CBDC)

Conforme documentado em `pilotord-kit-onboarding/RealDigital.md` e `pilotord-kit-onboarding/smartcontracts.md`:

- É o token oficial do Banco Central com símbolo "BRL"
- Implementa controle de acesso para restringir quem pode receber o token
- Possui funções especiais como congelamento de saldo e movimentação autoritativa
- Apenas instituições com Conta Reservas, Conta de Liquidação e o Tesouro Nacional podem ter Real Digital

```solidity
// Trecho do contrato baseado na documentação oficial
function mint(address to, uint256 amount) public {
    // Função para emitir tokens para as carteiras permitidas
    // Apenas quem tem MINTER_ROLE pode executar
}

function burn(uint256 amount) public {
    // Destrói um determinado valor da carteira
}

function move(address from, address to, uint256 amount) public {
    // Função para mover tokens entre carteiras
    // Somente quem possuir MOVER_ROLE pode executar
}
```

### 2. RealTokenizado (DVt e MEt)

Conforme documentado em `pilotord-kit-onboarding/RealTokenizado.md` e `pilotord-kit-onboarding/smartcontracts.md`:

- Representa o token emitido pelos participantes (bancos)
- Símbolo "BRL@CNPJ8" (ex: BRL@11111111)
- Lastreado em Real Digital
- Cada participante tem seu próprio contrato de Real Tokenizado
- A carteira do participante é a gestora do token

```solidity
// Atributos do contrato de acordo com a documentação oficial
string participant;   // Nome do participante
uint256 cnpj8;        // CNPJ8 da instituição
address reserve;      // Carteira de reserva da instituição
```

### 3. CBDCAccessControl

Conforme `pilotord-kit-onboarding/CBDCAccessControl.md`:

- Controla quais endereços podem interagir com os tokens
- Define papéis (roles) como MINTER_ROLE, BURNER_ROLE, ACCESS_ROLE
- Mantém registro de contas autorizadas

```solidity
// Papéis conforme documentação oficial
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
bytes32 public constant ACCESS_ROLE = keccak256("ACCESS_ROLE");
bytes32 public constant MOVER_ROLE = keccak256("MOVER_ROLE");
bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
bytes32 public constant FREEZER_ROLE = keccak256("FREEZER_ROLE");
```

### 4. TPFt (Títulos Públicos Federais Tokenizados)

Conforme `pilotord-kit-onboarding/smartcontractsTitulos.md`:

- Implementado como token ERC1155
- Gerenciado pela Secretaria do Tesouro Nacional
- Permite operações como oferta pública, compra e venda, resgate
- Suporta operações como compromissada, recompra e revenda

### 5. Operações de Swap

Conforme `pilotord-kit-onboarding/smartcontracts.md`, existem três implementações de swap:

1. **SwapOneStep** - Transferência em uma única transação atômica
2. **SwapTwoSteps** - Transferência que requer confirmação do recebedor
3. **SwapTwoStepsReserve** - Similar ao anterior, mas com reserva prévia dos tokens

## Plano de Implementação Local

Baseado nas tecnologias e contratos documentados oficialmente, podemos implementar localmente:

### 1. Configuração de Ambiente

✅ **Hyperledger Besu**
- Já temos um nó Besu rodando localmente na porta 8545
- Versão compatível com a documentada (23.10.1 ou posterior)

### 2. Implementação dos Contratos

Seguindo a documentação oficial, implementaremos:

1. **CBDCAccessControl**
   - Base de controle de acesso para todos os tokens

2. **RealDigital**
   - Token principal do Banco Central
   - Funções de mint, burn, e controle de acesso

3. **RealDigitalDefaultAccount**
   - Gerenciamento de carteiras principais dos participantes
   
4. **RealTokenizado**
   - Uma instância para cada participante
   - Conectado ao RealDigital para lastro

5. **TPFt** (opcional)
   - Implementação básica dos títulos tokenizados
   - Operações de DVP (Delivery versus Payment)

### 3. Cenários de Teste

Usando as operações reais descritas na documentação:

1. **Emissão de DREX**
   - Simulação de STR para emissão de Real Digital
   - Usando o contrato STR conforme documentado

2. **Transferências entre participantes**
   - Transferência direta entre carteiras de participantes
   - Teste de congelamento de saldos

3. **Operações de swap**
   - Testes com SwapOneStep e SwapTwoSteps
   - Validação do fluxo completo

### 4. Considerações de Segurança

Conforme indicado na documentação oficial:

1. **Controle de acesso**
   - Implementação correta de CBDCAccessControl
   - Gestão de carteiras habilitadas

2. **Permissionamento da rede**
   - Configuração da permissão onchain no Besu

3. **RPC seguro**
   - Conforme recomendado, portas RPC não expostas externamente 