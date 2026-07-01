import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import "./index.css";
import "./styles/legal.css";
import "./styles/about.css";
import "./styles/data-status.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);