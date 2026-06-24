import {
BrowserRouter,
Navigate,
Route,
Routes,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import ComingSoon from "./pages/ComingSoon";

const appStyles = {
minHeight: "100vh",
display: "flex",
flexDirection: "column",
background: "#0a0f1c",
};

const contentStyles = {
flex: 1,
minWidth: 0,
};

const footerStyles = {
padding: "16px 24px",
borderTop: "1px solid #1e293b",
color: "#64748b",
background: "#070d18",
fontSize: "12px",
lineHeight: 1.7,
textAlign: "center",
};

export default function App() {
return ( <BrowserRouter> <div style={appStyles}> <Navbar />

    <div style={contentStyles}>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/analyze"
          element={<Analyze />}
        />

        <Route
          path="/screener"
          element={
            <ComingSoon title="Smart Stock Screener" />
          }
        />

        <Route
          path="/portfolio"
          element={
            <ComingSoon title="My Portfolio" />
          }
        />

        <Route
          path="/market-pulse"
          element={
            <ComingSoon title="Market Pulse" />
          }
        />

        <Route
          path="/learn"
          element={
            <ComingSoon title="Learn Investing with EXA" />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </div>

    <footer style={footerStyles}>
      EXA NEXUS provides AI-assisted market research and
      insights for educational purposes only. It does not
      constitute financial advice or a recommendation to
      buy, sell or hold any securities. Please consult a
      SEBI-registered advisor before making investment
      decisions.
    </footer>
  </div>
</BrowserRouter>

);
}
