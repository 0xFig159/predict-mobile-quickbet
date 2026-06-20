import { useTranslation } from "react-i18next";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useSuiClient } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { useDemoMode } from "../DemoMode";

function NetworkGuard() {
  const { t } = useTranslation();
  const [networkInfo, setNetworkInfo] = useState<string>(t("network.checking"));
  const suiClient = useSuiClient();

  useEffect(() => {
    suiClient.getChainIdentifier().then((id) => {
      setNetworkInfo(id.toLowerCase().startsWith("4c") ? t("network.testnet") : id);
    }).catch(() => {
      setNetworkInfo(t("network.unknown"));
    });
  }, [suiClient, t]);

  const isTestnet = networkInfo === t("network.testnet");

  return (
    <div className="card" style={{ textAlign: "center", marginBottom: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <span className={`network-badge ${isTestnet ? "testnet" : "mainnet"}`}>
          {isTestnet ? t("network.testnet") : networkInfo === t("network.checking") ? t("network.checking") : t("network.mainnet")}
        </span>
      </div>
      {!isTestnet && networkInfo !== t("network.checking") && (
        <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>
          {t("network.switchToTestnet")}
        </p>
      )}
    </div>
  );
}

function WalletSection() {
  const { t } = useTranslation();
  const account = useCurrentAccount();
  const demo = useDemoMode();

  return (
    <div style={{ textAlign: "center" }}>
      {demo ? (
        <div style={{ fontSize: 13, color: "var(--accent)" }}>
          <span className="demo-badge" style={{ fontSize: 14, padding: "6px 16px" }}>🧪 Demo Mode - Exploring</span>
        </div>
      ) : !account ? (
        <ConnectButton />
      ) : (
        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
          <p>{t("wallet.connected")}: <span className="wallet-address">{account.address.slice(0, 6)}...{account.address.slice(-4)}</span></p>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const { t } = useTranslation();
  return (
    <div className="page">
      <div className="container">
        <img src="/logo.png" alt={t("landing.logoAlt")} className="hero-logo" />
        <h1 className="hero-title">{t("landing.title")}</h1>
        <p className="hero-subtitle">
          {t("landing.subtitle")}
        </p>

        <NetworkGuard />
        <WalletSection />

        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
            {t("landing.deepbookTrack")}
          </h2>
          <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>
              {t("landing.deepbookDesc")}
            </p>
            <p>
              {t("landing.overflowTag")}
            </p>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
            {t("landing.quickStart")}
          </h2>
          <ol style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 2, paddingLeft: 20 }}>
            <li>{t("landing.step1")}</li>
            <li>{t("landing.step2")}</li>
            <li>{t("landing.step3")}</li>
            <li>{t("landing.step4")}</li>
            <li>{t("landing.step5")}</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
