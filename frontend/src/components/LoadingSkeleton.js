export function SkeletonLine({ width = "100%" }) {
  return (
    <div className="skeleton-line" style={{ width }} aria-hidden="true" />
  );
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <SkeletonLine width="40%" />
      <SkeletonLine width="60%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="50%" />
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <SkeletonLine width="50%" />
      <SkeletonLine width="100%" />
      <SkeletonLine width="30%" />
      <div style={{ height: 8 }} />
      <SkeletonLine width="70%" />
      <SkeletonLine width="85%" />
      <SkeletonLine width="60%" />
    </div>
  );
}

export default function LoadingSpinner({ label = "Loading…" }) {
  return (
    <div className="loading-spinner" role="status" aria-label={label}>
      <div className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
