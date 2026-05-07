'use client';

import { Button, Form, Input, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FilterBar } from '@/components/filter-bar';
import { ResourceTable, type ResourceTableRef } from '@/components/resource-table';
import { toast } from '@/components/toast';
import { ApiList, apiFetch } from '@/lib/api';

type AccessLog = {
  id: string;
  member?: { name: string };
  direction: string;
  result: string;
  reason?: string;
  happenedAt: string;
};
type MemberOption = { id: string; name: string; phone: string; memberNo: string };

const directionText: Record<string, string> = {
  IN: '入场',
  OUT: '离场'
};

const resultText: Record<string, string> = {
  ALLOWED: '放行',
  DENIED: '拒绝',
  MANUAL: '手动'
};

export default function AccessLogsPage() {
  const tableRef = useRef<ResourceTableRef>(null);
  const [memberId, setMemberId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [direction, setDirection] = useState<string | undefined>();
  const [result, setResult] = useState<string | undefined>();
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);

  useEffect(() => {
    apiFetch<ApiList<MemberOption>>('/members?pageSize=100')
      .then((payload) => setMemberOptions(payload.items))
      .catch((error) => toast.error(error instanceof Error ? error.message : '会员列表加载失败'));
  }, []);

  async function verify(values: { memberId: string; direction: 'IN' | 'OUT' }) {
    try {
      const result = await apiFetch<{ allowed: boolean; reason: string }>('/access/verify', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      toast[result.allowed ? 'success' : 'warning'](result.reason);
      tableRef.current?.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '门禁模拟失败');
    }
  }

  const query = new URLSearchParams();
  if (memberId) query.set('memberId', memberId);
  if (keyword) query.set('keyword', keyword);
  if (direction) query.set('direction', direction);
  if (result) query.set('result', result);

  const columns = useMemo<ColumnsType<AccessLog>>(
    () => [
      { title: '会员', dataIndex: ['member', 'name'] },
      { title: '方向', dataIndex: 'direction', render: (value: string) => directionText[value] ?? value },
      {
        title: '结果',
        dataIndex: 'result',
        render: (value: string) => (
          <span className={`chip ${value === 'ALLOWED' ? 'chip-success' : value === 'DENIED' ? 'chip-danger' : 'chip-neutral'}`}>
            {resultText[value] ?? value}
          </span>
        )
      },
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
      <section className="content-band" style={{ marginBottom: 18 }}>
        <Form layout="inline" onFinish={verify}>
          <Form.Item name="memberId" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择会员"
              style={{ width: 260 }}
              options={memberOptions.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.phone} · ${item.memberNo}`
              }))}
            />
          </Form.Item>
          <Form.Item name="direction" initialValue="IN" rules={[{ required: true }]}>
            <Select
              style={{ width: 130 }}
              options={[
                { value: 'IN', label: '模拟入场' },
                { value: 'OUT', label: '模拟离场' }
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form>
      </section>
      <ResourceTable<AccessLog>
        ref={tableRef}
        endpoint={`/access/logs?${query.toString()}`}
        columns={columns}
        emptyTitle="暂无门禁记录"
        emptyDescription="清空筛选条件后可查看全部通行记录"
        toolbar={
          <FilterBar
            searchValue={keyword}
            searchPlaceholder="搜索姓名/手机号/会员号"
            onSearchChange={setKeyword}
            onReset={() => {
              setMemberId('');
              setKeyword('');
              setDirection(undefined);
              setResult(undefined);
            }}
            chips={[
              ...(memberId ? [{ key: 'memberId', label: `会员ID：${memberId}`, onClose: () => setMemberId('') }] : []),
              ...(direction ? [{ key: 'direction', label: `方向：${directionText[direction] ?? direction}`, onClose: () => setDirection(undefined) }] : []),
              ...(result ? [{ key: 'result', label: `结果：${resultText[result] ?? result}`, onClose: () => setResult(undefined) }] : [])
            ]}
            filters={
              <>
            <Input
              allowClear
              placeholder="会员 ID"
              style={{ width: 150 }}
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
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
              </>
            }
          />
        }
      />
    </>
  );
}
