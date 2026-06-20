import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useDemoMode } from "../DemoMode";
import type { ReceiptData } from "../types";

const RECEIPTS_STORAGE_KEY = "quickbet_receipts";

interface DeploymentData {
  packageId: string;
  adminCapId: string;
  publisherId: string;
  deployedAt: string;
}

function ExplorerLink({ label, url }: { label: string; url: string }) {
  const { t } = useTranslation();
  return (
    <div className="diagnostic-item">
      <span className="diagnostic-label">{label}</span>
      <a href={url} target="_blank" rel="noopener noreferrer" className="diagnostic-value explorer-link">
        {t("evidence.viewOnSuiVision")}
      </a>
    </div>
  );
}

function hexToAddress(hex: string): string {
  if (hex.startsWith("0x")) return hex;
  return "0x" + hex;
}

export default function Evidence() {
  const { t } = useTranslation();
  const demo = useDemoMode();
  const [deployment, setDeployment] = useState<DeploymentData | null>(null);
  const [deployError, setDeployError] = useState<string>("");
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);

  useEffect(() => {
    if (demo) {
      setDeployment({
        packageId: "0x7d1f37caafdc4d272b0f8330ce784f889488ae1cc8ac85fd8d74add549e4d6fa",
        adminCapId: "0xDEMO_ADMIN_CAP_ID",
        publisherId: "0xDEMO_PUBLISHER_ID",
        deployedAt: "2025-06-20T00:00:00Z",
      });
      setReceipts([
        {
          id: "demo-ev-1",
          owner: "0xDEMO",
          marketKey: "SUI/USD",
          side: 0,
          size: 100,
          txDigest: "DpMfr8sZ1K",
          status: 0,
          createdAt: Date.now() - 86400000,
        },
        {
          id: "demo-ev-2",
          owner: "0xDEMO",
          marketKey: "BTC/USD",
          side: 1,
          size: 50,
          txDigest: "GtH7nL2p",
          status: 1,
          createdAt: Date.now() - 43200000,
        },
      ]);
      return;
    }

    // Load deployment
    fetch("/deployments/testnet.json")
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d: DeploymentData) => {
        setDeployment(d);
      })
      .catch((e: Error) => {
        setDeployError(e.message);
      });

    // Load receipts
    try {
      const stored = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (stored) setReceipts(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [demo]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>{t("evidence.title")}</h1>
          <p>{t("evidence.subtitle")}</p>
        </div>

        {/* Package Info */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
            {t("evidence.deployment")}
          </h2>
          {deployError ? (
            <div className="empty-state">
              <p>{t("evidence.notDeployed")}</p>
              <p style={{ fontSize: 12 }}>
                {t("evidence.runDeploy")}
              </p>
              {deployError !== "Not found" && (
                <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>
                  {t("evidence.error")}: {deployError}
                </p>
              )}
            </div>
          ) : deployment ? (
            <div>
              <ExplorerLink
                label={t("evidence.packageId")}
                url={`https://testnet.suivision.xyz/package/${hexToAddress(deployment.packageId)}`}
              />
              <div className="diagnostic-item">
                <span className="diagnostic-label">{t("evidence.packageId")}</span>
                <span className="diagnostic-value">{deployment.packageId.slice(0, 10)}...{deployment.packageId.slice(-6)}</span>
              </div>
              {deployment.adminCapId && (
                <>
                  <ExplorerLink
                    label={t("evidence.adminCap")}
                    url={`https://testnet.suivision.xyz/object/${hexToAddress(deployment.adminCapId)}`}
                  />
                  <div className="diagnostic-item">
                    <span className="diagnostic-label">{t("evidence.adminCapId")}</span>
                    <span className="diagnostic-value">{deployment.adminCapId.slice(0, 10)}...</span>
                  </div>
                </>
              )}
              <div className="diagnostic-item" style={{ borderBottom: "none" }}>
                <span className="diagnostic-label">{t("evidence.deployedAt")}</span>
                <span className="diagnostic-value">{deployment.deployedAt}</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>{t("evidence.loading")}</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
            {t("evidence.transactions")}
          </h2>
          {receipts.length === 0 ? (
            <div className="empty-state">
              <p>{t("evidence.noTx")}</p>
              <p style={{ fontSize: 12 }}>
                {t("evidence.createBet")}
              </p>
            </div>
          ) : (
            receipts.map((r, i) => (
              <div key={i} className="diagnostic-item">
                <span className="diagnostic-label">
                  {t("evidence.betLabel", { number: i + 1, market: r.marketKey })}
                </span>
                <a
                  href={`https://testnet.suivision.xyz/tx/${r.txDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="diagnostic-value explorer-link"
                >
                  {r.txDigest.slice(0, 10)}...↗
                </a>
              </div>
            ))
          )}
        </div>

        {/* Status Badge Info */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
            {t("evidence.receiptStatus")}
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge badge-pending">{t("evidence.pending")}</span>
            <span className="badge badge-redeemed">{t("evidence.redeemed")}</span>
            <span className="badge badge-expired">{t("evidence.expired")}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12 }}>
            {t("evidence.statusInfo")}
            {" "}
            {t("evidence.refresh")}
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
            {t("evidence.objectTitle")}
          </h2>
          <pre style={{
            fontSize: 11,
            color: "var(--text-dim)",
            background: "var(--bg-secondary)",
            padding: 12,
            borderRadius: "var(--radius-sm)",
            overflow: "auto",
            lineHeight: 1.6,
          }}>
{`struct QuickBetReceipt {
  owner: address
  market_key: String
  side: u8 (0=UP, 1=DOWN, 2=RANGE)
  size: u64
  tx_digest: String
  status: u8 (0=Pending, 1=Redeemed, 2=Expired)
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
