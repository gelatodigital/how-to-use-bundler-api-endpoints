# Gelato Bundler API Interaction

A comprehensive collection of scripts to interact with Gelato's Account Abstraction (AA) bundler API endpoints. This project demonstrates how to use various ERC-4337 bundler methods with different gas payment models.

## 🎯 Overview

This project provides TypeScript examples for all major Gelato bundler API endpoints, showing how to:
- Send UserOperations with different gas payment models (1Balance Sponsored, Native ETH, OnChain Paymaster, ERC-20)
- Estimate gas costs for various payment modes
- Query operation status and receipts
- Get gas prices and supported entry points
- Check bundler chain compatibility

## 🏗️ Project Structure

```
bundler-api-interaction/
├── eth_chainId/                           # Chain ID verification
│   └── checkBundlerChainId.ts
├── eth_sendUserOperation/                 # Send UserOperations
│   ├── 1Balance/
│   │   └── SponsoredGas.ts               # 1Balance sponsored gas
│   ├── Native-Payments/
│   │   └── NativeGasPayments.ts         # Native ETH payment
│   └── OnChain-Paymasters/
│       ├── SponsoredGas.ts               # OnChain paymaster sponsored
│       ├── Erc20GasPayments.ts          # ERC-20 token payment
│       └── signPermit.ts                 # Permit signing utilities
├── eth_estimateUserOperationGas/          # Gas estimation
│   ├── 1Balance/
│   │   └── SponsoredGas.ts              # 1Balance gas estimation
│   ├── Native-Payments/
│   │   └── NativeGasPayments.ts         # Native gas estimation
│   └── OnChain-Paymasters/
│       ├── SponsoredGas.ts              # OnChain paymaster estimation
│       ├── Erc20GasPayments.ts          # ERC-20 gas estimation
│       └── signPermit.ts                 # Permit signing utilities
├── eth_getUserOperationByHash/            # Query by hash
│   └── getUserOperationByHash.ts
├── eth_getUserOperationReceipt/           # Get receipts
│   └── getUserOperationReceipt.ts
├── eth_maxPriorityFeePerGas/              # Priority fee info
│   └── maxPriorityFeePerGas.ts
├── eth_supportedEntryPoints/              # Supported entry points
│   └── supportedEntryPoints.ts
├── eth_getUserOperationGasPrice/          # Gas price info
│   └── getUserOperationGasPrice.ts
├── package.json
└── README.md
```

## 🚀 Available Commands

### **Chain & Entry Point Commands**
```bash
# Check bundler chain ID
pnpm run check-chain

# Get supported entry points
pnpm run supported-entrypoints
```

### **UserOperation Commands**
```bash
# Send UserOperation (1Balance sponsored)
pnpm run send-userop-1balance

# Send UserOperation (native ETH payment)
pnpm run send-userop-native

# Send UserOperation (onchain paymaster sponsored)
pnpm run send-userop-onchain-sponsored

# Send UserOperation (ERC-20 token payment)
pnpm run send-userop-erc20

# Get UserOperation by hash
HASH=0xabc123... pnpm run get-userop

# Get UserOperation receipt
HASH=0xabc123... pnpm run get-receipt
```

### **Gas Estimation Commands**
```bash
# Estimate gas costs (1Balance sponsored)
pnpm run estimate-gas-1balance

# Estimate gas costs (native ETH)
pnpm run estimate-gas-native

# Estimate gas costs (onchain paymaster sponsored)
pnpm run estimate-gas-onchain-sponsored

# Estimate gas costs (ERC-20 token)
pnpm run estimate-gas-erc20
```

### **Gas Price Commands**
```bash
# Get max priority fee
pnpm run max-priority-fee

# Get UserOperation gas price
pnpm run userop-gas-price
```

## 🔧 Environment Setup

Create a `.env` file in the project root:

```env
# Required for most operations
PRIVATE_KEY=0x...                    # Your private key

# Gelato API keys (for sponsored transactions)
GELATO_API_KEY=your_gelato_api_key

PAYMASTER_URL= your_paymaster_url
```

## 📋 Gas Payment Models

### **1. 1Balance Sponsored Transactions**
- **Cost**: $0 gas fees for users
- **Requirements**: `GELATO_API_KEY`
- **Use Cases**: User-friendly dApps, quick prototyping
- **Scripts**: `send-userop-1balance`, `estimate-gas-1balance`

### **2. Native ETH Payment**
- **Cost**: Users pay gas fees in ETH
- **Requirements**: No API key needed
- **Use Cases**: Traditional gas payment, no sponsorship available
- **Scripts**: `send-userop-native`, `estimate-gas-native`

### **3. OnChain Paymaster Sponsored**
- **Cost**: Sponsored via on-chain paymaster contract
- **Requirements**: Paymaster contract deployment
- **Use Cases**: Custom sponsorship logic, on-chain verification
- **Scripts**: `send-userop-onchain-sponsored`, `estimate-gas-onchain-sponsored`

### **4. ERC-20 Token Payment**
- **Cost**: Users pay with ERC-20 tokens
- **Requirements**: ERC-20 token contract, permit support
- **Use Cases**: Token-gated services, custom payment logic
- **Scripts**: `send-userop-erc20`, `estimate-gas-erc20`


## 🛡️ Smart Wallet Integration

### Circle Smart Account

The examples use Circle smart wallets created with @circle-fin/modular-wallets-core:

```typescript
import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";

const account = await toCircleSmartAccount({ client: publicClient, owner: signer });
```

## 🔑 Key Features

- **Multiple Gas Payment Models**: 1Balance Sponsored, Native ETH, OnChain Paymaster, and ERC-20 token payment options
- **TypeScript**: Full type safety and IntelliSense support
- **Error Handling**: Comprehensive error handling and user feedback
- **Gas Optimization**: Automatic gas estimation and optimization
- **Multi-Chain Support**: Configurable for different networks (default: Ethereum Sepolia)
- **Flexible API**: Choose between different payment models based on your needs

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your keys and configuration
   ```

3. **Run examples**:
   ```bash
   # Check if bundler is working
   pnpm run check-chain
   
   # Send a 1Balance sponsored UserOperation (requires API key)
   pnpm run send-userop-1balance
   
   # Send a native ETH UserOperation (no API key needed)
   pnpm run send-userop-native
   ```

## 📚 Dependencies

- **viem**: Ethereum client and utilities
- **@circle-fin/modular-wallets-core**: Account abstraction utilities
- **@gelatonetwork/smartwallet**: Smart wallet integration
- **dotenv**: Environment variable management

## 🔗 Useful Links

- [Gelato Documentation](https://docs.gelato.network/)
- [1Balance Sponsorship](https://docs.gelato.network/developer-services/1balance)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Circle](https://developers.circle.com/w3s/programmable-wallets)