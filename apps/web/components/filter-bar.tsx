'use client';

import { Button, Input } from 'antd';
import { Plus, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

type FilterChip = {
  key: string;
  label: string;
  onClose?: () => void;
};

type FilterBarProps = {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  chips?: FilterChip[];
  resetLabel?: string;
  onReset?: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

export function FilterBar({
  searchValue,
  searchPlaceholder = '搜索',
  onSearchChange,
  filters,
  chips = [],
  resetLabel = '重置',
  onReset,
  actionLabel,
  onAction
}: FilterBarProps) {
  return (
    <section className="filter-bar" aria-label="筛选工具栏">
      <div className="filter-bar-main">
        {onSearchChange ? (
          <Input
            allowClear
            className="filter-search"
            prefix={<Search size={16} strokeWidth={1.75} />}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        ) : null}
        <div className="filter-controls">{filters}</div>
        <div className="filter-actions">
          {onReset ? (
            <Button type="text" className="text-link-button" onClick={onReset}>
              {resetLabel}
            </Button>
          ) : null}
          {actionLabel && onAction ? (
            <Button type="primary" icon={<Plus size={16} strokeWidth={1.75} />} onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
      {chips.length ? (
        <div className="filter-chips">
          {chips.map((chip) => (
            <span className="chip chip-blue" key={chip.key}>
              {chip.label}
              {chip.onClose ? (
                <button className="filter-chip-remove" type="button" aria-label={`移除${chip.label}`} onClick={chip.onClose}>
                  <X size={13} strokeWidth={1.75} />
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
