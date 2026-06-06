export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", paddingTop: 60 }}>
        <div className="skeleton-row" style={{ height: 32, width: 180, marginBottom: 32 }} />
        {[1,2,3].map(i => (
          <div key={i} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 28, marginBottom: 24,
          }}>
            <div className="skeleton-row" style={{ height: 18, width: 120, marginBottom: 20 }} />
            {[1,2,3].map(j => (
              <div key={j} style={{ marginBottom: 20 }}>
                <div className="skeleton-row" style={{ height: 13, width: 80, marginBottom: 10 }} />
                <div className="skeleton-row" style={{ height: 44, borderRadius: 10 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
