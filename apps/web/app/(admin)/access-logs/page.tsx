'use client';

import { Button, Input, Select, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { ResourceTable } from '@/components/resource-table';

type AccessLog = {
  id: string;
  member?: { name: string };
  direction: string;
  result: string;
  reason?: string;
  happenedAt: string;
};

export default function AccessLogsPage() {
  const [memberId, setMemberId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [direction, setDirection] = useState<string | undefined>();
  const [result, setResult] = useState<string | undefined>();

  const query = new URLSearchParams();
  if (memberId) query.set('memberId', memberId);
  if (keyword) query.set('keyword', keyword);
  if (direction) query.set('direction', direction);
  if (result) query.set('result', result);

  const columns = useMemo<ColumnsType<AccessLog>>(
    () => [
      { title: '会员', dataIndex: ['member', 'name'] },
      { title: '方向', dataIndex: 'direction' },
      { title: '结果', dataIndex: 'result', render: (value) => <Tag color={value === 'ALLOWED' ? 'green' : 'red'}>{value}</Tag> },
      { title: '原因', dataIndex: 'reason' },
      { title: '时间', dataIndex: 'happenedAt', render: (value) => value.slice(0, 16).replace('T', ' ') }
    ],
    []
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">门禁记录</h1>
      </div>
      <ResourceTable<AccessLog>
        endpoint={`/access/logs?${query.toString()}`}
        columns={columns}
        toolbar={
          <Space wrap>
            <Input allowClear placeholder="会员 ID" value={memberId} onChange={(event) => setMemberId(event.target.value)} />
            <Input
              allowClear
              placeholder="姓名/手机号/会员号"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <Select
              allowClear
              placeholder="方向"
              style={{ width: 110 }}
              value={direction}
              onChange={setDirection}
              options={[
                { value: 'IN', label: '入场' },
                { value: 'OUT', label: '离场' }
              ]}
            />
            <Select
              allowClear
              placeholder="结果"
              style={{ width: 120 }}
              value={result}
              onChange={setResult}
              options={[
                { value: 'ALLOWED', label: '放行' },
                { value: 'DENIED', label: '拒绝' },
                { value: 'MANUAL', label: '手动' }
              ]}
            />
            <Button
              onClick={() => {
                setMemberId('');
                setKeyword('');
                setDirection(undefined);
                setResult(undefined);
              }}
            >
              清空
            </Button>
          </Space>
        }
      />
    </>
  );
}
