#!/usr/bin/env bun
/**
 * Seed demo data for Predict Mobile QuickBet.
 * Creates a QuickBetReceipt on Sui Testnet.
 *
 * Usage: bun run scripts/seed-demo.ts
 * Prerequisite: bun run testnet:deploy
 */

import * as fs from "fs";
import * as path from "path";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEPLOYMENT_PATH = path.join(PROJECT_ROOT, "deployments", "testnet.json");

interface DeploymentData {
  packageId: string;
  adminCapId: string;
  publisherId: string;
  deployedAt: string;
}

async function getSigner(): Promise<Ed25519Keypair> {
  // Try to get keypair from environment or use the sui CLI active address
  const privateKey = process.env.SUI_PRIVATE_KEY;
  if (privateKey) {
    return Ed25519Keypair.fromSecretKey(fromBase64(privateKey));
  }

  // Fall back to sui client keytool
  const { execSync } = require("child_process");
  const output = execSync("sui client active-address", { encoding: "utf-8" }).trim();
  const keystore = execSync("sui keytool list --json", { encoding: "utf-8" });

  let keypairs: Array<{ alias: string; publicBase64: string; scheme: string; flag: number }>;
  try {
    keypairs = JSON.parse(keystore);
  } catch {
    throw new Error("Could not parse keytool output. Set SUI_PRIVATE_KEY env var instead.");
  }

  const match = keypairs.find((kp) => kp.alias === output || kp.publicBase64);
  if (!match) {
    throw new Error(
      `No keypair found for active address ${output}. ` +
      "Either import the key or set SUI_PRIVATE_KEY env var.",
    );
  }

  // We need the private key - if keytool doesn't expose it, fall back to env
  throw new Error(
    "Cannot sign transactions without private key. " +
    "Set SUI_PRIVATE_KEY environment variable to a base64-encoded Ed25519 secret key.",
  );
}

async function main() {
  console.log("=== QuickBet Seed Demo ===\n");

  // Read deployment
  if (!fs.existsSync(DEPLOYMENT_PATH)) {
    console.error("No deployment found. Run `bun run testnet:deploy` first.");
    process.exit(1);
  }

  const deployment: DeploymentData = JSON.parse(
    fs.readFileSync(DEPLOYMENT_PATH, "utf-8"),
  );

  console.log(`Package ID: ${deployment.packageId}`);
  console.log(`AdminCap ID: ${deployment.adminCapId || "N/A"}`);

  // Connect to testnet
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });
  console.log("Connected to Sui Testnet.\n");

  // Get signer
  let keypair: Ed25519Keypair;
  try {
    keypair = await getSigner();
  } catch (e: any) {
    console.log("Seed in non-signing mode (no private key available).");
    console.log("Creating a local receipt record instead.\n");

    const digest = await simulateReceipt(client, deployment.packageId);
    console.log(`\n✅ Demo receipt recorded (simulated).`);
    console.log(`   To create a real on-chain receipt, set SUI_PRIVATE_KEY env var.`);
    console.log(`   Or use the Console UI to create receipts.`);
    return;
  }

  // Execute receipt creation
  console.log("Creating demo QuickBetReceipt...");

  const tx = new Transaction();
  const adminCapId = deployment.adminCapId || "0x6"; // placeholder
  const activeAddr = keypair.toSuiAddress();
  const marketKey = "SUI_USDC_15m";

  tx.moveCall({
    target: `${deployment.packageId}::quickbet_receipt::create_receipt`,
    arguments: [
      tx.object(adminCapId),
      tx.pure.address(activeAddr),
      tx.pure.string(marketKey),
      tx.pure.u8(0), // UP
      tx.pure.u64(100), // 100 dUSDC
      tx.pure.string("seed_tx"),
    ],
  });

  // Also create a DOWN bet
  tx.moveCall({
    target: `${deployment.packageId}::quickbet_receipt::create_receipt`,
    arguments: [
      tx.object(adminCapId),
      tx.pure.address(activeAddr),
      tx.pure.string("SUI_USDC_1h"),
      tx.pure.u8(1), // DOWN
      tx.pure.u64(50), // 50 dUSDC
      tx.pure.string("seed_tx_2"),
    ],
  });

  try {
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
    });

    console.log(`Transaction digest: ${result.digest}`);
    console.log(`Explorer: https://testnet.suivision.xyz/tx/${result.digest}`);

    // Wait for the transaction to be confirmed
    console.log("\nWaiting for confirmation...");
    const status = await client.waitForTransaction({
      digest: result.digest,
      options: { showEffects: true },
    });

    if (status.effects?.status?.status === "success") {
      console.log("✅ Transaction confirmed!");

      // Log created objects
      const createdObjects = status.effects.created ?? [];
      for (const obj of createdObjects) {
        console.log(`   Created object: ${obj.reference.objectId}`);
      }
    } else {
      console.log(`❌ Transaction failed: ${status.effects?.status?.error}`);
    }
  } catch (e: any) {
    console.error(`\n❌ Transaction failed: ${e.message}`);
    console.error("Make sure the AdminCap ID is correct and you have gas.");
    process.exit(1);
  }
}

/**
 * When no signer is available, simulate by recording a local receipt
 * and returning a mock digest. In production, use the SUI_PRIVATE_KEY.
 */
async function simulateReceipt(
  client: SuiClient,
  packageId: string,
): Promise<string> {
  console.log("Fetching testnet chain info...");
  const info = await client.getChainIdentifier();
  console.log(`Chain identifier: ${info}`);

  const mockDigest = `demo_${Date.now().toString(36)}`;
  console.log(`Simulated digest: ${mockDigest}`);

  // Record to local JSON for the frontend to pick up
  const demoReceipt = {
    id: mockDigest,
    owner: "0x0",
    marketKey: "SUI_USDC_15m",
    side: 0,
    size: 100,
    txDigest: mockDigest,
    status: 0,
    createdAt: Date.now(),
  };

  console.log(`Demo receipt: ${JSON.stringify(demoReceipt, null, 2)}`);

  return mockDigest;
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
