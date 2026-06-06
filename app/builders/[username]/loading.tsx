import SkeletonLoader from "@/components/SkeletonLoader";

export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 80 }}>
        <div className="skeleton-row" style={{ height: 14, width: 140, marginBottom: 24 }} />
        <div style={{ padding: 32, borderRadius: 20, border: "1px solid var(--border)", background: "var(--surface)", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div className="skeleton-row" style={{ width: 80, height: 80, borderRadius: 20, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-row" style={{ height: 28, width: "50%", marginBottom: 10 }} />
              <div className="skeleton-row" style={{ height: 14, width: "30%" }} />
            </div>
          </div>
        </div>
        <SkeletonLoader count={2} columns="1.4fr 1fr" />
      </div>
    </main>
  );
}
