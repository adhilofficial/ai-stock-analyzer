export default function ComingSoon({ title = "Coming soon" }) {
  return (
    <div style={{
      minHeight: "55vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", color: "var(--exa-text-secondary)", padding: "40px 24px"
    }}>
      <h2 style={{ color: "var(--exa-text-primary)", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 14, textAlign: "center", maxWidth: 360 }}>
        This page is part of the Litses roadmap and is under active development.
      </p>
    </div>
  );
}
