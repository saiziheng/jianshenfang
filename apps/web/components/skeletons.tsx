import type { CSSProperties } from 'react';

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

function columnsTemplate(columns: number) {
  const widths = ['1.3fr', '1fr', '1fr', '0.8fr', '0.9fr', '0.7fr', '0.7fr'];
  return Array.from({ length: columns }, (_, index) => widths[index] ?? '1fr').join(' ');
}

export function TableSkeleton({ rows = 6, columns = 5 }: TableSkeletonProps) {
  const style = { '--skeleton-columns': columnsTemplate(columns) } as CSSProperties;

  return (
    <div className="skeleton-stack" aria-label="列表加载中">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="skeleton-row" style={style} key={rowIndex}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <span
              className="skeleton-line"
              style={{ width: `${columnIndex === 0 ? 76 : 52 + ((rowIndex + columnIndex) % 3) * 14}%` }}
              key={columnIndex}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="skeleton-card" aria-label="卡片加载中">
      <span className="skeleton-line" style={{ width: '60%' }} />
      <span className="skeleton-line" style={{ width: '40%', height: 30 }} />
      <span className="skeleton-line" style={{ width: '34%' }} />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="detail-skeleton" aria-label="详情加载中">
      <span className="skeleton-line" style={{ width: '46%', height: 18 }} />
      <span className="skeleton-line" style={{ width: '86%' }} />
      <span className="skeleton-line" style={{ width: '72%' }} />
      <span className="skeleton-line" style={{ width: '94%', height: 44, borderRadius: 12 }} />
      <span className="skeleton-line" style={{ width: '62%' }} />
    </div>
  );
}
