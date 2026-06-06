import SkeletonLoader from "@/components/SkeletonLoader";

export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 80 }}>
        <div className="skeleton-row" style={{ height: 36, width: 240, marginBottom: 12 }} />
        <div className="skeleton-row" style={{ height: 16, width: 360, marginBottom: 36 }} />
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <div className="skeleton-row" style={{ height: 44, flex: 1 }} />
          <div className="skeleton-row" style={{ height: 44, width: 140 }} />
        </div>
        <SkeletonLoader count={6} />
      </div>
    </main>
  );
}
