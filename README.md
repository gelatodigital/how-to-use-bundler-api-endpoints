# Gelato Bundler API Interaction

A comprehensive collection of scripts to interact with Gelato's Account Abstraction (AA) bundler API endpoints. This project demonstrates how to use various ERC-4337 bundler methods with different gas payment models.

## 🎯 Overview

This project provides TypeScript examples for all major Gelato bundler API endpoints, showing how to:
- Send UserOperations with different gas payment models (Sponsored, Native ETH)
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
│   ├── sendUserOp1Balance.ts             # Sponsored (1Balance)
│   └── sendUserOpNative.ts               # Native ETH payment
├── eth_estimateUserOperationGas/          # Gas estimation
│   ├── estimateUserOperationGas.ts       # Sponsored gas estimation
│   └── estimateUserOperationGasNative.ts # Native gas estimation
├── eth_getUserOperationByHash/            # Query by hash
│   └── getUserOperationByHash.ts
├── eth_getUserOperationReceipt/           # Get receipts
│   └── getUserOperationReceipt.ts
├── eth_maxPriorityFeePerGas/              # Priority fee info
│   ├── maxPriorityFeePerGasSponsored.ts  # Sponsored mode
│   └── maxPriorityFeePerGasNative.ts     # Native mode
├── eth_supportedEntryPoints/              # Supported entry points
│   └── supportedEntryPoints.ts
├── eth_getUserOperationGasPrice/          # Gas price info
│   ├── getUserOperationGasPriceSponsored.ts # Sponsored mode
│   └── getUserOperationGasPriceNative.ts    # Native mode
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
# Send UserOperation (sponsored by 1Balance)
pnpm run send-userop

# Send UserOperation (native ETH payment)
pnpm run send-userop-native

# Get UserOperation by hash
HASH=0xabc123... pnpm run get-userop

# Get UserOperation receipt
HASH=0xabc123... pnpm run get-receipt
```

### **Gas Estimation Commands**
```bash
# Estimate gas costs (sponsored)
pnpm run estimate-gas

# Estimate gas costs (native ETH)
pnpm run estimate-gas-native
```

### **Gas Price Commands**
```bash
# Get max priority fee (sponsored)
pnpm run max-priority-fee-sponsored

# Get max priority fee (native)
pnpm run max-priority-fee-native

# Get UserOperation gas price (sponsored)
pnpm run userop-gas-price-sponsored

# Get UserOperation gas price (native)
pnpm run userop-gas-price-native
```

### **Comprehensive Testing Commands**
```bash
# Test all payment methods (estimation + sending)
pnpm run test-all-payment-methods
```

## 🔧 Environment Setup

Create a `.env` file in the project root:

```env
# Required for most operations
PRIVATE_KEY=0x...                    # Your private key
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Gelato API keys (for sponsored transactions)
GELATO_API_KEY=your_gelato_api_key

# Optional: Chain configuration
CHAIN_ID=11155111                    # Default: Ethereum Sepolia

# For native fee mode (when not using sponsorship)
PAY_NATIVE=true
```

## 📋 Gas Payment Models

### **1. Sponsored Transactions (1Balance)**
- **Cost**: $0 gas fees for users
- **Requirements**: `GELATO_API_KEY`
- **Use Cases**: User-friendly dApps, quick prototyping
- **Scripts**: `send-userop`, `estimate-gas`, `max-priority-fee-sponsored`, `userop-gas-price-sponsored`

### **2. Native ETH Payment**
- **Cost**: Users pay gas fees in ETH
- **Requirements**: No API key needed
- **Use Cases**: Traditional gas payment, no sponsorship available
- **Scripts**: `send-userop-native`, `estimate-gas-native`, `max-priority-fee-native`, `userop-gas-price-native`

### **3. ERC-20 Token Payment**
- **Cost**: Users pay with ERC-20 tokens
- **Requirements**: Custom paymaster contract
- **Use Cases**: Token-gated services, custom payment logic
- **Scripts**: Custom implementation needed

## 📋 API Endpoints Covered

### **1. **eth_chainId** - Chain Verification**
- **Purpose**: Verify the chain ID that the bundler is serving
- **Script**: `eth_chainId/checkBundlerChainId.ts`
- **Command**: `pnpm run check-chain`

### **2. **eth_sendUserOperation** - Send UserOperations**
- **Purpose**: Submit UserOperations to the bundler for processing
- **Scripts**: 
  - `eth_sendUserOperation/sendUserOp1Balance.ts` (Sponsored)
  - `eth_sendUserOperation/sendUserOpNative.ts` (Native ETH)
- **Commands**: 
  - `pnpm run send-userop` (Sponsored)
  - `pnpm run send-userop-native` (Native ETH)
- **Features**: 
  - Uses Circle smart wallet with @circle-fin/modular-wallets-core
  - Sponsored version: Zero gas fees via 1Balance
  - Native version: Users pay gas fees in ETH
  - Kernel account with ECDSA validator

### **3. **eth_estimateUserOperationGas** - Gas Estimation**
- **Purpose**: Estimate gas costs for UserOperations before sending
- **Scripts**:
  - `eth_estimateUserOperationGas/estimateUserOperationGas.ts` (Sponsored)
  - `eth_estimateUserOperationGas/estimateUserOperationGasNative.ts` (Native)
- **Commands**:
  - `pnpm run estimate-gas` (Sponsored)
  - `pnpm run estimate-gas-native` (Native)
- **Features**:
  - Circle smart wallet integration
  - Handles both deployed and counterfactual accounts
  - Sponsored: Zero gas cost estimation
  - Native: Real gas cost estimation

### **4. **eth_getUserOperationByHash** - Query by Hash**
- **Purpose**: Retrieve UserOperation details by its hash
- **Script**: `eth_getUserOperationByHash/getUserOperationByHash.ts`
- **Command**: `HASH=0xabc123... pnpm run get-userop`

### **5. **eth_getUserOperationReceipt** - Get Receipts**
- **Purpose**: Get transaction receipt for completed UserOperations
- **Script**: `eth_getUserOperationReceipt/getUserOperationReceipt.ts`
- **Command**: `HASH=0xabc123... pnpm run get-receipt`

### **6. **eth_maxPriorityFeePerGas** - Priority Fee Info**
- **Purpose**: Get current max priority fee per gas
- **Scripts**:
  - `eth_maxPriorityFeePerGas/maxPriorityFeePerGasSponsored.ts` (Sponsored)
  - `eth_maxPriorityFeePerGas/maxPriorityFeePerGasNative.ts` (Native)
- **Commands**:
  - `pnpm run max-priority-fee-sponsored` (Sponsored)
  - `pnpm run max-priority-fee-native` (Native)

### **7. **eth_supportedEntryPoints** - Entry Point Support**
- **Purpose**: List supported entry point contracts
- **Script**: `eth_supportedEntryPoints/supportedEntryPoints.ts`
- **Command**: `pnpm run supported-entrypoints`

### **8. **eth_getUserOperationGasPrice** - Gas Price Info**
- **Purpose**: Get recommended gas prices for UserOperations
- **Scripts**:
  - `eth_getUserOperationGasPrice/getUserOperationGasPriceSponsored.ts` (Sponsored)
  - `eth_getUserOperationGasPrice/getUserOperationGasPriceNative.ts` (Native)
- **Commands**:
  - `pnpm run userop-gas-price-sponsored` (Sponsored)
  - `pnpm run userop-gas-price-native` (Native)
- **Features**:
  - Supports both sponsored and native fee modes
  - Returns both maxPriorityFeePerGas and maxFeePerGas

## 🧪 Comprehensive Testing

### **Test All Payment Methods**
Run a comprehensive test that checks all payment methods for both gas estimation and sending user operations:

```bash
# Test all payment methods (estimation + sending)
pnpm run test-all-payment-methods
```

This script will:
- ✅ Test gas estimation for all payment methods
- ✅ Test sending user operations for all payment methods
- ✅ Provide detailed results and statistics
- ✅ Show success/failure status for each test
- ✅ Display transaction hashes for successful sends
- ✅ Give a final summary of all tests

**Payment Methods Tested:**
1. **1Balance Sponsored Gas** - Zero-fee sponsored transactions
2. **Native Gas Payments** - Traditional ETH gas payments
3. **OnChain Paymaster Sponsored Gas** - Sponsored via on-chain paymaster
4. **ERC20 Gas Payments** - Token-based gas payments

**Test Output Includes:**
- Individual test results for each payment method
- Gas estimation details (preVerificationGas, callGasLimit, verificationGasLimit)
- UserOperation hashes for successful sends
- Error details for failed tests
- Final statistics showing pass/fail counts

## 🛡️ Smart Wallet Integration

### Circle Smart Account

The examples use Circle smart wallets created with @circle-fin/modular-wallets-core:

```typescript
import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";

const account = await toCircleSmartAccount({ client: publicClient, owner: signer });


## 🔑 Key Features

- **Multiple Gas Payment Models**: Sponsored, Native ETH, and ERC-20 token payment options
- **TypeScript**: Full type safety and IntelliSense support
- **Error Handling**: Comprehensive error handling and user feedback
- **Gas Optimization**: Automatic gas estimation and optimization
- **Multi-Chain Support**: Configurable for different networks (default: Ethereum Sepolia)
- **Flexible API**: Choose between sponsored and native modes based on your needs

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
   
   # Send a sponsored UserOperation (requires API key)
   pnpm run send-userop
   
   # Send a native ETH UserOperation (no API key needed)
   pnpm run send-userop-native
   ```

## 📚 Dependencies

- **viem**: Ethereum client and utilities
- **Circle**: Account abstraction utilities
- **dotenv**: Environment variable management

## 🔗 Useful Links

- [Gelato Documentation](https://docs.gelato.network/)
- [1Balance Sponsorship](https://docs.gelato.network/developer-services/1balance)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Circle](https://developers.circle.com/w3s/programmable-wallets)