import { Button } from 'antd';
import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <p className="empty-state-title">{title}</p>
      {description ? <p className="empty-state-description">{description}</p> : null}
      {action ?? (actionLabel && onAction ? <Button type="primary" className="empty-state-action" onClick={onAction}>{actionLabel}</Button> : null)}
    </div>
  );
}
