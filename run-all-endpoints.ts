import "dotenv/config";

console.log(
  "🚀 Starting sequential execution of all bundler API endpoints...\n"
);

// Simple endpoints
const simpleEndpoints = [
  { name: "Chain ID Check", file: "./eth_chainId/checkBundlerChainId.ts" },
  {
    name: "Supported Entry Points",
    file: "./eth_supportedEntryPoints/supportedEntryPoints.ts",
  },
  {
    name: "Get User Operation By Hash",
    file: "./eth_getUserOperationByHash/getUserOperationByHash.ts",
  },
  {
    name: "Get User Operation Receipt",
    file: "./eth_getUserOperationReceipt/getUserOperationReceipt.ts",
  },
  {
    name: "Max Priority Fee Per Gas",
    file: "./eth_maxPriorityFeePerGas/maxPriorityFeePerGas.ts",
  },
  {
    name: "Get User Operation Gas Price",
    file: "./eth_getUserOperationGasPrice/getUserOperationGasPrice.ts",
  },
];

// Estimation endpoints
const estimationEndpoints = [
  {
    name: "Estimate Gas - 1Balance Sponsored",
    file: "./eth_estimateUserOperationGas/1Balance/SponsoredGas.ts",
  },
  {
    name: "Estimate Gas - Native Payments",
    file: "./eth_estimateUserOperationGas/Native-Payments/NativeGasPayments.ts",
  },
  {
    name: "Estimate Gas - OnChain Sponsored",
    file: "./eth_estimateUserOperationGas/OnChain-Paymasters/SponsoredGas.ts",
  },
  {
    name: "Estimate Gas - ERC20 Payments",
    file: "./eth_estimateUserOperationGas/OnChain-Paymasters/Erc20GasPayments.ts",
  },
  {
    name: "Estimate Gas - State Overrides",
    file: "./eth_estimateUserOperationGas/State-Overrides/stateOverrideExample.ts",
  },
];

// Send user operation endpoints
const sendUserOperationEndpoints = [
  {
    name: "Send User Operation - 1Balance Sponsored",
    file: "./eth_sendUserOperation/1Balance/SponsoredGas.ts",
  },
  {
    name: "Send User Operation - Native Payments",
    file: "./eth_sendUserOperation/Native-Payments/NativeGasPayments.ts",
  },
  {
    name: "Send User Operation - OnChain Sponsored",
    file: "./eth_sendUserOperation/OnChain-Paymasters/SponsoredGas.ts",
  },
  {
    name: "Send User Operation - ERC20 Payments",
    file: "./eth_sendUserOperation/OnChain-Paymasters/Erc20GasPayments.ts",
  },
];

async function runEndpoint(name: string, file: string) {
  console.log(`\n📋 Running: ${name}`);
  console.log(`📍 File: ${file}`);
  console.log("─".repeat(50));

  try {
    // Import and execute the module
    await import(file);
    console.log(`✅ ${name} completed successfully`);
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
  }

  console.log("─".repeat(50));
}

async function runAllEndpoints() {
  console.log("🔹 STEP 1: Running Simple Endpoints");
  console.log("=".repeat(60));

  for (const endpoint of simpleEndpoints) {
    await runEndpoint(endpoint.name, endpoint.file);
    // Add a small delay between executions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n🔹 STEP 2: Running Estimation Endpoints");
  console.log("=".repeat(60));

  for (const endpoint of estimationEndpoints) {
    await runEndpoint(endpoint.name, endpoint.file);
    // Add a small delay between executions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n🔹 STEP 3: Running Send User Operation Endpoints");
  console.log("=".repeat(60));

  for (const endpoint of sendUserOperationEndpoints) {
    await runEndpoint(endpoint.name, endpoint.file);
    // Add a small delay between executions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n🎉 All endpoints have been executed sequentially!");
}

// Run the script
runAllEndpoints().catch((error) => {
  console.error("❌ Script execution failed:", error);
  process.exit(1);
});
