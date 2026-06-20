import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

interface DeploymentData {
  packageId: string;
  adminCapId: string;
  publisherId: string;
  deployedAt: string;
}

export default function Submission() {
  const { t } = useTranslation();
  const [deployment, setDeployment] = useState<DeploymentData | null>(null);
  const [copied, setCopied] = useState<string>("");

  useEffect(() => {
    fetch("/deployments/testnet.json")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setDeployment(d))
      .catch(() => {});
  }, []);

  const packageId = deployment?.packageId ?? "<deploy-first>";
  const repoUrl = "https://github.com/your-org/predict-mobile-quickbet";

  const sections = [
    {
      title: t("submission.projectName"),
      content: t("submission.projectNameValue"),
    },
    {
      title: t("submission.track"),
      content: t("submission.trackValue"),
    },
    {
      title: t("submission.oneLiner"),
      content: t("submission.oneLinerValue"),
    },
    {
      title: t("submission.description"),
      content: t("submission.descriptionValue"),
    },
    {
      title: t("submission.deployment"),
      content: t("submission.deploymentValue", { packageId }),
    },
    {
      title: t("submission.links"),
      content: t("submission.linksValue", { repoUrl }),
    },
  ];

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  const checklistItems = [
    t("submission.checklistItem1"),
    t("submission.checklistItem2"),
    t("submission.checklistItem3"),
    t("submission.checklistItem4"),
    t("submission.checklistItem5"),
    t("submission.checklistItem6"),
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>{t("submission.title")}</h1>
          <p>{t("submission.subtitle")}</p>
        </div>

        <div className="submission-grid">
          {sections.map((s) => (
            <div key={s.title} className="submission-item">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>{s.title}</h3>
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(s.content, s.title)}
                >
                  {copied === s.title ? t("submission.copied") : t("submission.copy")}
                </button>
              </div>
              <p style={{ whiteSpace: "pre-wrap" }}>{s.content}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
            {t("submission.checklist")}
          </h2>
          <div style={{ fontSize: 13, lineHeight: 2 }}>
            {checklistItems.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "var(--accent)" }}>✓</span>
                <span style={deployment ? {} : { color: "var(--text-dim)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
