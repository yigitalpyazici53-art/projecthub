import SkeletonLoader from "@/components/SkeletonLoader";

export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "flex-end" }}>
          <div className="skeleton-row" style={{ height: 36, width: 180 }} />
          <div className="skeleton-row" style={{ height: 40, width: 140 }} />
        </div>
        <div className="skeleton-row" style={{ height: 16, width: 320, marginBottom: 36 }} />
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <div className="skeleton-row" style={{ height: 44, flex: 1 }} />
          <div className="skeleton-row" style={{ height: 44, width: 140 }} />
        </div>
        <SkeletonLoader count={8} columns="repeat(auto-fill, minmax(320px, 1fr))" />
      </div>
    </main>
  );
}
