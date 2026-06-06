"use client";

const shimmerCSS = `
@keyframes skeleton-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.skeleton-row {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.09) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.6s infinite;
  border-radius: 8px;
}
`;

function SkeletonCard() {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0d1117 0%, #111820 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 4 }}>
        <div className="skeleton-row" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton-row" style={{ height: 16, width: "60%" }} />
          <div className="skeleton-row" style={{ height: 12, width: "40%" }} />
        </div>
      </div>
      <div className="skeleton-row" style={{ height: 12 }} />
      <div className="skeleton-row" style={{ height: 12 }} />
      <div className="skeleton-row" style={{ height: 12, width: "75%" }} />
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        {[60, 50, 70].map((w, i) => (
          <div key={i} className="skeleton-row" style={{ height: 24, width: w, borderRadius: 6 }} />
        ))}
      </div>
    </div>
  );
}

export default function SkeletonLoader({
  count = 6,
  columns = "repeat(auto-fill, minmax(300px, 1fr))",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <>
      <style>{shimmerCSS}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: columns,
          gap: 20,
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </>
  );
}
