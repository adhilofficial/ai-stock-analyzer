import { NavLink } from "react-router-dom";
import { Home, Search, BarChart3, Briefcase, Activity, GraduationCap, Bell, ChevronDown } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/analyze", label: "Analyze", icon: Search },
  { to: "/screener", label: "Screener", icon: BarChart3 },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/market-pulse", label: "Market Pulse", icon: Activity },
  { to: "/learn", label: "Learn", icon: GraduationCap },
];

export default function Navbar() {
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 24px", background: "#0f172a", borderBottom: "1px solid #1e293b",
      flexWrap: "wrap", gap: 12
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "linear-gradient(135deg,#6366f1,#a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "#fff", fontSize: 16
        }}>X</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Litses</div>
          <div style={{ color: "#64748b", fontSize: 11 }}>AI-powered market intelligence for Indian markets</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, fontSize: 14,
              textDecoration: "none",
              color: isActive ? "#fff" : "#94a3b8",
              background: isActive ? "#1d4ed8" : "transparent"
            })}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Search size={18} color="#94a3b8" style={{ cursor: "pointer" }} />
        <div style={{ position: "relative" }}>
          <Bell size={18} color="#94a3b8" style={{ cursor: "pointer" }} />
          <span style={{
            position: "absolute", top: -6, right: -6, background: "#2563eb", color: "#fff",
            fontSize: 10, borderRadius: "50%", width: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>3</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "#334155", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600
          }}>AP</div>
          <ChevronDown size={14} color="#94a3b8" />
        </div>
      </div>
    </nav>
  );
}
