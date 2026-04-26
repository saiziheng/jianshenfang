'use client';

import { ReloadOutlined } from '@ant-design/icons';
import { Button, Table, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
};

function ResourceTableInner<T extends object>(
  { endpoint, columns, rowKey = 'id', toolbar }: Props<T>,
  ref: Ref<ResourceTableRef>
) {
  const [loading, setLoading] = useState(false);
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
      message.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [buildEndpoint]);

  useImperativeHandle(ref, () => ({ refresh: () => void load() }), [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="content-band">
      <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="toolbar">{toolbar}</div>
        <Tooltip title="刷新">
          <Button aria-label="刷新" icon={<ReloadOutlined />} onClick={() => void load()} />
        </Tooltip>
      </div>
      <Table<T>
        rowKey={rowKey}
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }
        }}
      />
    </section>
  );
}

export const ResourceTable = forwardRef(ResourceTableInner) as <T extends object>(
  props: Props<T> & { ref?: Ref<ResourceTableRef> }
) => ReactElement;
