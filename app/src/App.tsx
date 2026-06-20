import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDemoMode } from "./DemoMode";
import Landing from "./pages/Landing";
import Console from "./pages/Console";
import Evidence from "./pages/Evidence";
import Submission from "./pages/Submission";
import LangSwitch from "./components/LangSwitch";
import "./App.css";

function Nav() {
  const { t } = useTranslation();
  const demo = useDemoMode();
  return (
    <nav className="nav-tabs">
      <a href="/" className="nav-tab">{t("nav.landing")}</a>
      <a href="/console" className="nav-tab">{t("nav.console")}</a>
      <a href="/evidence" className="nav-tab">{t("nav.evidence")}</a>
      <a href="/submission" className="nav-tab">{t("nav.submission")}</a>
      {demo ? <span className="demo-badge">🧪 Demo</span> : <LangSwitch />}
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/console" element={<Console />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="/submission" element={<Submission />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
