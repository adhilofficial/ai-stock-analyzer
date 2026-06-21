import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Analyze from "./pages/Analyze";
import ComingSoon from "./pages/ComingSoon";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#0a0f1c" }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/analyze" replace />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/dashboard" element={<ComingSoon title="Dashboard" />} />
          <Route path="/screener" element={<ComingSoon title="Smart Stock Screener" />} />
          <Route path="/portfolio" element={<ComingSoon title="My Portfolio" />} />
          <Route path="/market-pulse" element={<ComingSoon title="Market Pulse" />} />
          <Route path="/learn" element={<ComingSoon title="Learn Investing with EXA" />} />
        </Routes>
        <footer style={{
          padding: "16px 24px", borderTop: "1px solid #1e293b",
          color: "#64748b", fontSize: 12, textAlign: "center"
        }}>
          EXA NEXUS provides AI-assisted market research and insights for educational purposes only.
          It does not constitute financial advice or a recommendation to buy, sell or hold any securities.
          Please consult a SEBI-registered advisor before making investment decisions.
        </footer>
      </div>
    </BrowserRouter>
  );
}