export default function ComingSoon({ title }) {
  return (
    <div style={{
      minHeight: "55vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", color: "#94a3b8", padding: "40px 24px"
    }}>
      <h2 style={{ color: "#fff", fontWeight: 500, fontSize: 22, marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 14, textAlign: "center", maxWidth: 360 }}>
        This page is part of the EXA NEXUS roadmap and is under active development.
      </p>
    </div>
  );
}