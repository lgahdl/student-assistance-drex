# Diagrama de Contratos do DREX

O diagrama abaixo representa as relações entre os principais contratos do DREX conforme a documentação oficial no repositório `pilotord-kit-onboarding`.

```mermaid
classDiagram
    %% Controles de Acesso
    class CBDCAccessControl {
        +authorizedAccounts: mapping
        +PAUSER_ROLE
        +MINTER_ROLE
        +ACCESS_ROLE
        +MOVER_ROLE
        +BURNER_ROLE
        +FREEZER_ROLE
        +enableAccount()
        +disableAccount()
        +verifyAccount()
    }

    %% Token principal do Banco Central
    class RealDigital {
        +frozenBalanceOf: mapping
        +name: "Real Digital"
        +symbol: "BRL"
        +decimals(): 2
        +mint()
        +burn()
        +move()
        +increaseFrozenBalance()
        +decreaseFrozenBalance()
    }

    %% Tokens dos bancos participantes
    class RealTokenizado {
        +participant: string
        +cnpj8: uint256
        +reserve: address
        +name: "RealTokenizado@CNPJ8"
        +symbol: "BRL@CNPJ8"
        +updateReserve()
        +mint()
        +burn()
    }

    %% Gerenciamento de carteiras default
    class RealDigitalDefaultAccount {
        +defaultAccount: mapping
        +updateDefaultWallet()
    }

    %% Habilitação de carteiras adicionais
    class RealDigitalEnableAccount {
        +enableAccount()
        +disableAccount()
    }

    %% Sistema de emissão do DREX
    class STR {
        +requestToMint()
    }

    %% Dicionário de chaves para identificação
    class KeyDictionary {
        +addAccount()
        +getWallet()
        +getKey()
        +getCustomerData()
    }

    %% Títulos Públicos Federais tokenizados
    class TPFt {
        +titles: mapping
        +mint()
    }

    %% Operações e swaps
    class SwapOneStep {
        +executeSwap()
    }

    class SwapTwoSteps {
        +startSwap()
        +confirmSwap()
        +cancelSwap()
    }

    class SwapTwoStepsReserve {
        +startSwap()
        +confirmSwap()
        +cancelSwap()
    }

    %% Relações entre contratos
    CBDCAccessControl <|-- RealDigital : herda
    CBDCAccessControl <|-- RealTokenizado : herda
    CBDCAccessControl <|-- TPFt : utiliza

    RealDigital --> STR : referenciado
    RealDigital --> RealDigitalDefaultAccount : referenciado
    RealDigital --> RealDigitalEnableAccount : referenciado
    RealDigital --> SwapOneStep : utilizado
    RealDigital --> SwapTwoSteps : utilizado
    RealDigital --> SwapTwoStepsReserve : utilizado

    RealTokenizado --> RealDigital : usa como lastro
    RealTokenizado --> KeyDictionary : consulta identidades

    SwapOneStep --> RealDigital : transfere
    SwapOneStep --> RealTokenizado : queima/emite

    SwapTwoSteps --> RealDigital : transfere
    SwapTwoSteps --> RealTokenizado : queima/emite

    SwapTwoStepsReserve --> RealDigital : transfere
    SwapTwoStepsReserve --> RealTokenizado : queima/emite

    TPFt --> RealDigital : operações DVP
```

## Descrição do Diagrama

O diagrama acima mostra as relações entre os principais contratos do DREX:

1. **CBDCAccessControl** é a base para controle de acesso, implementado pelos contratos principais.

2. **RealDigital** é o token base emitido pelo Banco Central, que implementa controle de acesso.

3. **RealTokenizado** representa os tokens emitidos pelos bancos participantes (DVt e MEt), lastreados em RealDigital.

4. **STR** é o contrato que simula o Sistema de Transferência de Reservas, permitindo a emissão de RealDigital.

5. **KeyDictionary** mantém o registro de clientes, similar ao DICT (Diretório de Identificadores de Contas Transacionais).

6. Os contratos de **Swap** (**SwapOneStep**, **SwapTwoSteps**, **SwapTwoStepsReserve**) implementam diferentes modelos de transferência entre tokens.

7. **TPFt** implementa os Títulos Públicos Federais tokenizados, com suas operações específicas.

Este diagrama representa as relações documentadas oficialmente no repositório `pilotord-kit-onboarding`. 