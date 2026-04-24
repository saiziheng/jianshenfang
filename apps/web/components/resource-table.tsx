'use client';

import { ReloadOutlined } from '@ant-design/icons';
import { Button, Table, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { apiFetch, toArrayPayload } from '@/lib/api';

type Props<T extends object> = {
  endpoint: string;
  columns: ColumnsType<T>;
  rowKey?: string | ((record: T) => string);
  toolbar?: ReactNode;
};

export function ResourceTable<T extends object>({ endpoint, columns, rowKey = 'id', toolbar }: Props<T>) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<T[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiFetch<T[] | { items: T[] }>(endpoint);
      setRows(toArrayPayload(payload));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="content-band">
      <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="toolbar">{toolbar}</div>
        <Tooltip title="刷新">
          <Button aria-label="刷新" icon={<ReloadOutlined />} onClick={load} />
        </Tooltip>
      </div>
      <Table<T> rowKey={rowKey} columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} />
    </section>
  );
}
