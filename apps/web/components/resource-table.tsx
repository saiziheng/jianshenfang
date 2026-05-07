'use client';

import { Button, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableProps } from 'antd';
import { RefreshCw } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref
} from 'react';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/skeletons';
import { toast } from '@/components/toast';
import { apiFetch } from '@/lib/api';

export type ResourceTableRef = {
  refresh: () => void;
};

type ListPayload<T> =
  | T[]
  | {
      items: T[];
      total: number;
      page: number;
      pageSize: number;
    };

type Props<T extends object> = {
  endpoint: string;
  columns: ColumnsType<T>;
  rowKey?: string | ((record: T) => string);
  toolbar?: ReactNode;
  onRow?: TableProps<T>['onRow'];
  emptyTitle?: string;
  emptyDescription?: string;
};

function ResourceTableInner<T extends object>(
  { endpoint, columns, rowKey = 'id', toolbar, onRow, emptyTitle = '暂无数据', emptyDescription = '调整筛选条件后再试试' }: Props<T>,
  ref: Ref<ResourceTableRef>
) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const buildEndpoint = useCallback(() => {
    const url = new URL(endpoint, 'http://local.resource-table');
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize));
    return `${url.pathname}${url.search}`;
  }, [endpoint, page, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiFetch<ListPayload<T>>(buildEndpoint());
      if (Array.isArray(payload)) {
        setRows(payload);
        setTotal(payload.length);
      } else {
        setRows(payload.items);
        setTotal(payload.total);
        setPage(payload.page);
        setPageSize(payload.pageSize);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [buildEndpoint]);

  useImperativeHandle(ref, () => ({ refresh: () => void load() }), [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      {toolbar}
      <section className="app-card resource-table-card">
        <div className="table-card-header">
          <Tooltip title="刷新">
            <Button
              aria-label="刷新"
              className="icon-button"
              icon={<RefreshCw size={16} strokeWidth={1.75} />}
              onClick={() => void load()}
            />
          </Tooltip>
        </div>
        {loading ? (
          <TableSkeleton columns={columns.length} />
        ) : (
          <Table<T>
            rowKey={rowKey}
            columns={columns}
            dataSource={rows}
            onRow={onRow}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: <EmptyState title={emptyTitle} description={emptyDescription} />
            }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (nextTotal) => `共 ${nextTotal} 条`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              }
            }}
          />
        )}
      </section>
    </>
  );
}

export const ResourceTable = forwardRef(ResourceTableInner) as <T extends object>(
  props: Props<T> & { ref?: Ref<ResourceTableRef> }
) => ReactElement;
