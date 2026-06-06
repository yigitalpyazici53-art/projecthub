export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", padding: "100px 24px 80px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="skeleton-row" style={{ height: 14, width: 140, marginBottom: 24 }} />
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 24, padding: 32, marginBottom: 28,
        }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div className="skeleton-row" style={{ height: 28, width: 80, borderRadius: 999 }} />
            <div className="skeleton-row" style={{ height: 28, width: 100, borderRadius: 999 }} />
          </div>
          <div className="skeleton-row" style={{ height: 48, width: "60%", marginBottom: 14 }} />
          <div className="skeleton-row" style={{ height: 20, width: "80%" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
            {[100, 90, 85, 70].map((w, i) => (
              <div key={i} className="skeleton-row" style={{ height: 16, width: `${w}%`, marginBottom: 12 }} />
            ))}
          </div>
          <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 22 }}>
                <div className="skeleton-row" style={{ height: 12, width: 80, marginBottom: 14 }} />
                <div className="skeleton-row" style={{ height: 16 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
