#!/usr/bin/env bun
/**
 * Deploy QuickBetReceipt Move package to Sui Testnet.
 * Usage: bun run scripts/deploy.ts
 *
 * Requirements:
 *   - sui CLI installed and configured for testnet
 *   - An active testnet wallet with gas (sui client switch --env testnet)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const CONTRACTS_DIR = path.join(PROJECT_ROOT, "contracts");
const DEPLOYMENTS_DIR = path.join(PROJECT_ROOT, "deployments");
const OUTPUT_PATH = path.join(DEPLOYMENTS_DIR, "testnet.json");

interface DeployResult {
  packageId: string;
  adminCapId: string;
  publisherId: string;
  deployedAt: string;
}

function run(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    encoding: "utf-8",
    cwd: cwd ?? PROJECT_ROOT,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function parsePackageId(output: string): string | null {
  // Look for "Published Packages:"
  const publishMatch = output.match(/Published Packages:\s*\[([^\]]+)\]/);
  if (publishMatch) {
    return publishMatch[1].trim();
  }

  // Alternative: look for "package" in JSON output
  const lines = output.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();

    // Match package ID in various output formats
    const pkgMatch = trimmed.match(/0x[0-9a-fA-F]{64}/);
    if (pkgMatch && !trimmed.includes("Immutable") && !trimmed.includes("PackageID")) {
      // First 0x... hex string after "Published" context
      const idx = lines.indexOf(line);
      const context = lines.slice(Math.max(0, idx - 5), idx + 2).join(" ");
      if (context.toLowerCase().includes("publish")) {
        return pkgMatch[0];
      }
    }
  }

  return null;
}

function parseObjectIds(output: string): Record<string, string> {
  const ids: Record<string, string> = {};

  // Parse "Created Objects:" section
  const createdSection = output.match(/Created Objects:\s*([\s\S]*?)(?=\n\w|$)/);
  if (createdSection) {
    const lines = createdSection[1].split("\n");
    for (const line of lines) {
      const idMatch = line.match(/0x[0-9a-fA-F]{64}/);
      const typeMatch = line.match(/::\w+::(\w+)/);
      if (idMatch && typeMatch) {
        ids[typeMatch[1]] = idMatch[0];
      }
    }
  }

  return ids;
}

async function main() {
  console.log("=== QuickBetReceipt Deploy to Testnet ===\n");

  // Check sui CLI
  try {
    const version = run("sui --version");
    console.log(`Sui CLI: ${version.trim()}`);
  } catch {
    console.error("Error: sui CLI not found. Install from https://docs.sui.io/");
    process.exit(1);
  }

  // Check active env
  const activeEnv = run("sui client active-env");
  if (!activeEnv.trim().includes("testnet")) {
    console.error(`Error: Active env is "${activeEnv.trim()}". Switch to testnet:`);
    console.error("  sui client switch --env testnet");
    process.exit(1);
  }

  // Check active address
  const activeAddr = run("sui client active-address").trim();
  console.log(`Active address: ${activeAddr}`);

  // Check gas
  try {
    const gasOutput = run(`sui client gas --json 2>&1 | head -5`);
    console.log(`Gas objects: available\n`);
  } catch {
    console.warn("Warning: Could not check gas. Continuing...\n");
  }

  // Build the package
  console.log("Building Move package...");
  try {
    run("sui move build", CONTRACTS_DIR);
    console.log("Build successful.\n");
  } catch (e: any) {
    console.error(`Build failed: ${e.message}`);
    process.exit(1);
  }

  // Publish
  console.log("Publishing to testnet...");
  let output: string;
  try {
    output = run("sui client publish --gas-budget 50000000 --json", CONTRACTS_DIR);
  } catch (e: any) {
    // Try without --json
    try {
      output = run("sui client publish --gas-budget 50000000", CONTRACTS_DIR);
    } catch (e2: any) {
      console.error(`Publish failed: ${e2.message}`);
      console.error("Make sure you have gas tokens on testnet.");
      console.error("Get them from: https://faucet.sui.io/");
      process.exit(1);
    }
  }

  // Parse output
  console.log("\nParsing publish output...");

  let parsed: Record<string, any>;
  let packageId: string | null = null;
  let adminCapId: string | null = null;
  let publisherId: string | null = null;

  // Try JSON first
  try {
    parsed = JSON.parse(output);
    // Explore the JSON structure
    const objectChanges = parsed.objectChanges ?? parsed.effects?.objectChanges ?? [];

    for (const change of objectChanges) {
      if (change.type === "published") {
        packageId = change.packageId;
      }
      if (change.type === "created" || change.type === "mutated") {
        const type = change.objectType ?? "";
        if (type.includes("AdminCap")) adminCapId = change.objectId;
        if (type.includes("Publisher")) publisherId = change.objectId;
      }
    }
  } catch {
    // Fallback: parse text output
    const ids = parseObjectIds(output);
    packageId = parsePackageId(output);
    adminCapId = ids["AdminCap"] ?? null;
    publisherId = ids["Publisher"] ?? null;
  }

  if (!packageId) {
    console.error("Could not determine Package ID from output.");
    console.error("Raw output:");
    console.error(output.slice(0, 2000));
    process.exit(1);
  }

  const result: DeployResult = {
    packageId,
    adminCapId: adminCapId ?? "",
    publisherId: publisherId ?? "",
    deployedAt: new Date().toISOString(),
  };

  // Write output
  fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));

  console.log(`\n✅ Deployed successfully!`);
  console.log(`   Package ID: ${packageId}`);
  if (adminCapId) console.log(`   AdminCap ID: ${adminCapId}`);
  if (publisherId) console.log(`   Publisher ID: ${publisherId}`);
  console.log(`\nOutput written to: ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error("Deploy failed:", e.message);
  process.exit(1);
});
