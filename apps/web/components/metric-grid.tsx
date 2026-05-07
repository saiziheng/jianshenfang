import { CardSkeleton } from '@/components/skeletons';

type Metric = {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    trend: 'positive' | 'negative';
  };
};

export function MetricGrid({ metrics, loading = false }: { metrics: Metric[]; loading?: boolean }) {
  return (
    <div className="metric-grid">
      {loading
        ? Array.from({ length: metrics.length || 4 }, (_, index) => (
            <div className="metric-card" key={index}>
              <CardSkeleton />
            </div>
          ))
        : metrics.map((metric) => (
            <div className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.delta ? <em className={`metric-delta ${metric.delta.trend}`}>{metric.delta.value}</em> : null}
            </div>
          ))}
    </div>
  );
}
