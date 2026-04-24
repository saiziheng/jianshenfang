export function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="metric-grid">
      {metrics.map((metric) => (
        <div className="metric-card" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}
