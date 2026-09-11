"use client";

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
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
  );
}
