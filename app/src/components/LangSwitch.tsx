import { useTranslation } from "react-i18next";

export default function LangSwitch() {
  const { t, i18n } = useTranslation();

  function toggle() {
    const next = i18n.language.startsWith("zh") ? "en" : "zh";
    i18n.changeLanguage(next);
  }

  return (
    <button
      onClick={toggle}
      style={{
        background: "none",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-dim)",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 10px",
        marginLeft: "auto",
      }}
    >
      {i18n.language.startsWith("zh") ? t("lang.en") : t("lang.zh")}
    </button>
  );
}
