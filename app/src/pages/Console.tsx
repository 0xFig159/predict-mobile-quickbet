import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, ConnectButton } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useDemoMode } from "../DemoMode";
import type { ReceiptData } from "../types";

const PACKAGE_ID_KEY = "quickbet_package_id";
const RECEIPTS_STORAGE_KEY = "quickbet_receipts";
const MARKET_KEYS = ["SUI_USDC_15m", "SUI_USDC_1h", "BTC_USDC_15m"];

const SIDES = [
  { value: 0, label: "UP", emoji: "↑", cls: "up", odds: "1.95" },
  { value: 1, label: "DOWN", emoji: "↓", cls: "down", odds: "1.95" },
  { value: 2, label: "RANGE", emoji: "↔", cls: "range", odds: "3.50" },
] as const;

const SIDE_NAMES = ["UP", "DOWN", "RANGE"];
const STATUS_NAMES = ["Pending", "Redeemed", "Expired"];

interface PriceData {
  price: string;
  change24h: string;
  positive: boolean;
  error?: string;
}

function getMarketPriceUrl(marketKey: string): string {
  const base = marketKey.split("_")[0].toLowerCase();
  return `https://api.binance.com/api/v3/ticker/24hr?symbol=${base}usdt`;
}

function fetchPrice(marketKey: string): Promise<PriceData> {
  const url = getMarketPriceUrl(marketKey);
  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((d) => ({
      price: parseFloat(d.lastPrice).toFixed(4),
      change24h: parseFloat(d.priceChangePercent).toFixed(2),
      positive: parseFloat(d.priceChangePercent) >= 0,
    }))
    .catch((e: Error) => ({
      price: "—",
      change24h: "—",
      positive: true,
      error: e.message,
    }));
}

export default function Console() {
  const { t } = useTranslation();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const demo = useDemoMode();

  const DEMO_RECEIPTS: ReceiptData[] = [
    {
      id: "demo-1",
      owner: "0xDEMO",
      marketKey: "SUI/USD",
      side: 0,
      size: 100,
      txDigest: "DpMfr8sZ1K",
      status: 0,
      createdAt: Date.now() - 86400000,
    },
    {
      id: "demo-2",
      owner: "0xDEMO",
      marketKey: "BTC/USD",
      side: 1,
      size: 50,
      txDigest: "GtH7nL2p",
      status: 1,
      createdAt: Date.now() - 43200000,
    },
  ];

  const DEMO_PRICES: Record<string, PriceData> = {
    "SUI_USDC_15m": { price: "3.4521", change24h: "+2.34", positive: true },
    "SUI_USDC_1h": { price: "3.4508", change24h: "+2.31", positive: true },
    "BTC_USDC_15m": { price: "67842.31", change24h: "-0.87", positive: false },
  };

  const [selectedSide, setSelectedSide] = useState<number>(0);
  const [betSize, setBetSize] = useState<string>("10");
  const [selectedMarket, setSelectedMarket] = useState<string>(MARKET_KEYS[0]);
  const [prices, setPrices] = useState<Record<string, PriceData>>(demo ? DEMO_PRICES : {});
  const [myReceipts, setMyReceipts] = useState<ReceiptData[]>(demo ? DEMO_RECEIPTS : []);
  const [txStatus, setTxStatus] = useState<string>("");
  const [txError, setTxError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load prices
  useEffect(() => {
    if (demo) return;
    const load = async () => {
      const results: Record<string, PriceData> = {};
      for (const key of MARKET_KEYS) {
        results[key] = await fetchPrice(key);
      }
      setPrices(results);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [demo]);

  // Load my receipts from local storage
  useEffect(() => {
    if (demo) return;
    if (!account) return;
    try {
      const stored = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ReceiptData[];
        setMyReceipts(parsed.filter((r) => r.owner === account.address));
      }
    } catch { /* ignore */ }
  }, [account, demo]);

  function saveReceipt(receipt: ReceiptData) {
    const updated = [...myReceipts, receipt];
    setMyReceipts(updated);
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(updated));
  }

  function handlePlaceBet() {
    if (!account) return;
    if (demo) {
      setTxStatus(t("console.demoMode"));
      return;
    }
    setTxStatus(t("console.submitting"));
    setTxError("");
    setLoading(true);

    const packageId = localStorage.getItem(PACKAGE_ID_KEY);
    if (!packageId) {
      setTxError(t("console.noContract"));
      setLoading(false);
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::quickbet_receipt::create_receipt`,
      arguments: [
        tx.object("0x6"), // placeholder: shared AdminCap object ID
        tx.pure.address(account.address),
        tx.pure.string(selectedMarket),
        tx.pure.u8(selectedSide),
        tx.pure.u64(parseInt(betSize, 10) || 10),
        tx.pure.string("pending_tx"),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          const digest = result.digest;
          setTxStatus(t("console.receiptCreated", { digest: `${digest.slice(0, 10)}...` }));

          // Create receipt data from tx result
          const receipt: ReceiptData = {
            id: digest,
            owner: account!.address,
            marketKey: selectedMarket,
            side: selectedSide,
            size: parseInt(betSize, 10) || 10,
            txDigest: digest,
            status: 0,
            createdAt: Date.now(),
          };
          saveReceipt(receipt);
          setLoading(false);
        },
        onError: (error) => {
          setTxError(error.message || t("console.txFailed"));
          setTxStatus("");
          setLoading(false);
        },
      },
    );
  }

  const currentPrice = prices[selectedMarket];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>{t("console.title")}</h1>
          <p>{t("console.subtitle")}</p>
        </div>

        {!account && !demo ? (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <p style={{ marginBottom: 16, color: "var(--text-dim)", fontSize: 14 }}>
              {t("console.connectWallet")}
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {/* Market Selector */}
            <div className="card" style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 8, display: "block" }}>
                {t("console.market")}
              </label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {MARKET_KEYS.map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            {/* Price Card */}
            <div className="market-card">
              <div className="market-card-title">{selectedMarket}</div>
              <div className="market-card-price">
                {currentPrice?.price ?? "..."}
              </div>
              {currentPrice?.error ? (
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {t("console.referencePrice", { error: currentPrice.error })}
                </div>
              ) : (
                <div className={`market-card-change ${currentPrice?.positive ? "positive" : "negative"}`}>
                  {currentPrice?.change24h ?? "..."}% (24h)
                </div>
              )}
            </div>

            {/* Side Selector */}
            <div className="card" style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "var(--text-dim)", display: "block" }}>
                {t("console.direction")}
              </label>
              <div className="side-selector">
                {SIDES.map((s) => (
                  <button
                    key={s.value}
                    className={`side-btn ${selectedSide === s.value ? `selected-${s.cls}` : ""}`}
                    onClick={() => setSelectedSide(s.value)}
                  >
                    <span className="side-label">{s.emoji} {s.label}</span>
                    <span className="side-odds">{s.odds}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Size */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="size-input-group">
                <label>{t("console.amount")}</label>
                <input
                  type="number"
                  value={betSize}
                  onChange={(e) => setBetSize(e.target.value)}
                  min="1"
                  step="1"
                />
                <span className="unit">{t("console.unit")}</span>
              </div>
            </div>

            {/* Status */}
            {txStatus && (
              <div className="card" style={{ marginBottom: 12, borderColor: "var(--accent)" }}>
                <p style={{ fontSize: 13, color: "var(--accent)" }}>{txStatus}</p>
              </div>
            )}
            {txError && (
              <div className="card" style={{ marginBottom: 12, borderColor: "var(--danger)" }}>
                <p style={{ fontSize: 13, color: "var(--danger)" }}>{txError}</p>
              </div>
            )}

            {/* Bottom bar */}
            <div className="bottom-bar">
              <div className="container">
                <button
                  className="btn btn-primary"
                  onClick={handlePlaceBet}
                  disabled={loading || !account}
                >
                  {loading ? t("console.processing") : demo ? `🧪 ${t("console.demoMode")}` : `Bet ${SIDES[selectedSide].emoji} ${betSize} dUSDC`}
                </button>
              </div>
            </div>

            {/* My Receipts */}
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
                {t("console.myReceipts")}
              </h2>
              {myReceipts.length === 0 ? (
                <div className="empty-state">
                  <p>{t("console.noReceipts")}</p>
                  <p>{t("console.placeFirstBet")}</p>
                </div>
              ) : (
                myReceipts.map((r, i) => (
                  <div key={`${r.txDigest}-${i}`} className="receipt-card">
                    <div className="receipt-card-header">
                      <span className="receipt-card-market">{r.marketKey}</span>
                      <span className={`badge badge-${STATUS_NAMES[r.status].toLowerCase()}`}>
                        {STATUS_NAMES[r.status]}
                      </span>
                    </div>
                    <div className="receipt-card-detail">
                      <span>{t("console.side")}</span>
                      <strong>{SIDE_NAMES[r.side]}</strong>
                    </div>
                    <div className="receipt-card-detail">
                      <span>{t("console.size")}</span>
                      <strong>{r.size} dUSDC</strong>
                    </div>
                    <div className="receipt-card-detail">
                      <span>{t("console.tx")}</span>
                      <a
                        href={`https://testnet.suivision.xyz/tx/${r.txDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="explorer-link"
                      >
                        {r.txDigest.slice(0, 10)}...
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
