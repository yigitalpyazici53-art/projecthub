export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", padding: "40px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 680 }}>
        <div className="skeleton-row" style={{ height: 32, width: 200, marginBottom: 8 }} />
        <div className="skeleton-row" style={{ height: 14, width: 280, marginBottom: 40 }} />
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ marginBottom: 24 }}>
            <div className="skeleton-row" style={{ height: 13, width: 100, marginBottom: 10 }} />
            <div className="skeleton-row" style={{ height: 48, borderRadius: 10 }} />
          </div>
        ))}
        <div className="skeleton-row" style={{ height: 48, borderRadius: 10, marginTop: 8 }} />
      </div>
    </main>
  );
}
