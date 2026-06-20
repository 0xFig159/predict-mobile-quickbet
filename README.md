# Predict Mobile QuickBet

**Track:** DeepBook | **Sui Overflow 2026**

Mobile-first quick betting on DeepBook Predict markets. Place UP / DOWN / RANGE bets in seconds — no terminal required.

## Architecture

```
predict-mobile-quickbet/
├── app/                    # React frontend (vp + Bun)
│   ├── src/
│   │   ├── pages/          # Landing, Console, Evidence, Submission
│   │   ├── App.tsx         # Routes & layout
│   │   ├── main.tsx        # Entry (dApp Kit, WalletProvider, React Query)
│   │   └── index.css       # Neon Sportsbook theme
│   └── public/logo.png     # Project logo
├── contracts/              # Move smart contract
│   └── sources/
│       └── quickbet_receipt.move
├── scripts/
│   ├── deploy.ts           # Publish to Sui Testnet
│   └── seed-demo.ts        # Create demo transactions
├── deployments/
│   └── testnet.json        # Deploy output (Package ID)
└── README.md
```

## Quick Start

```bash
# Install dependencies
cd app && bun install

# Start dev server (port 31720)
bun run dev
```

## Deploy to Testnet

```bash
# Ensure sui CLI is configured for testnet
sui client switch --env testnet

# Deploy the Move package
bun run testnet:deploy

# Seed demo data (requires SUI_PRIVATE_KEY or interactive wallet)
bun run testnet:seed
```

## Smart Contract

`contracts/sources/quickbet_receipt.move` — QuickBetReceipt object:

| Field | Type | Description |
|-------|------|-------------|
| `owner` | `address` | User who placed the bet |
| `market_key` | `String` | Market identifier (e.g. `SUI_USDC_15m`) |
| `side` | `u8` | 0=UP, 1=DOWN, 2=RANGE |
| `size` | `u64` | Bet amount in dUSDC |
| `tx_digest` | `String` | Predict mint transaction hash |
| `status` | `u8` | 0=Pending, 1=Redeemed, 2=Expired |

### Functions

- `create_receipt(...)` — Creates a new receipt (requires AdminCap)
- `update_status(...)` — Updates receipt status (AdminCap only)
- `transfer_receipt(...)` — Transfers receipt to the user

## Demo Flow

1. Open the app and connect your Sui wallet (testnet)
2. View live market prices on the Console page
3. Select UP / DOWN / RANGE and place a bet
4. Your receipt is stored on-chain
5. View the Evidence page for Package ID, Object IDs, and transaction digests
6. Use the Submission page for hackathon submission materials

## Tech Stack

- **Frontend:** React + TypeScript + Vite+ (vp) + Bun
- **Wallet:** Sui dApp Kit
- **Chain:** Sui Testnet
- **Theme:** Neon Sportsbook (deep blue, electric cyan accent)

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (port 31720) |
| `bun run build` | Production build |
| `bun run testnet:deploy` | Deploy contract to testnet |
| `bun run testnet:seed` | Create demo transactions |

## Verification

- [x] `bun install` — dependencies installed
- [x] `bun run build` — build passes
- [ ] `bun run testnet:deploy` — outputs Package ID
- [ ] `bun run testnet:seed` — outputs tx digest
- [ ] `bun run dev` — app runs on port 31720
