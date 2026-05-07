'use client';

import { Button, Form, Input, Modal, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { FilterBar } from '@/components/filter-bar';
import { ResourceTable, type ResourceTableRef } from '@/components/resource-table';
import { toast } from '@/components/toast';
import { apiFetch } from '@/lib/api';

type Member = {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  status: string;
  cards?: Array<{ id: string }>;
};

const statusText: Record<string, string> = {
  ACTIVE: '在卡',
  FROZEN: '冻结',
  EXPIRED: '过期',
  BLACKLISTED: '黑名单'
};

const statusClass: Record<string, string> = {
  ACTIVE: 'chip-success',
  FROZEN: 'chip-warning',
  EXPIRED: 'chip-neutral',
  BLACKLISTED: 'chip-danger'
};

export default function MembersPage() {
  const router = useRouter();
  const tableRef = useRef<ResourceTableRef>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const endpoint = `/members?keyword=${encodeURIComponent(keyword)}${status ? `&status=${status}` : ''}`;

  async function create(values: { name: string; phone: string; gender?: string; note?: string }) {
    try {
      await apiFetch('/members', { method: 'POST', body: JSON.stringify(values) });
      toast.success('会员已新增');
      setOpen(false);
      tableRef.current?.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '新增失败');
    }
  }

  const columns = useMemo<ColumnsType<Member>>(
    () => [
      {
        title: '姓名',
        dataIndex: 'name',
        render: (_, row) => (
          <div className="table-primary-cell">
            <span className="avatar-circle">{row.name.slice(0, 1)}</span>
            <span className="table-primary-text">
              <strong>{row.name}</strong>
              <span>{row.memberNo}</span>
            </span>
          </div>
        )
      },
      { title: '手机', dataIndex: 'phone' },
      {
        title: '状态',
        dataIndex: 'status',
        render: (value: string) => <span className={`chip ${statusClass[value] ?? 'chip-neutral'}`}>{statusText[value] ?? value}</span>
      },
      { title: '剩余卡', dataIndex: 'cards', render: (value: Member['cards']) => value?.length ?? 0 },
      { title: '最近到访', render: () => <span className="muted">-</span> },
      {
        title: '操作',
        render: (_, row) => (
          <Button
            type="text"
            className="text-link-button"
            icon={<CreditCard size={16} strokeWidth={1.75} />}
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/cards/open?memberId=${row.id}`);
            }}
          >
            续费
          </Button>
        )
      }
    ],
    [router]
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">会员管理</h1>
      </div>
      <ResourceTable<Member>
        ref={tableRef}
        endpoint={endpoint}
        columns={columns}
        onRow={(row) => ({
          style: { cursor: 'pointer' },
          onClick: () => router.push(`/members/${row.id}`)
        })}
        emptyTitle="暂无会员"
        emptyDescription="调整筛选条件，或新增第一位会员"
        toolbar={
          <FilterBar
            searchValue={keyword}
            searchPlaceholder="搜索姓名/手机号/会员号"
            onSearchChange={setKeyword}
            actionLabel="新增会员"
            onAction={() => setOpen(true)}
            onReset={() => {
              setKeyword('');
              setStatus(undefined);
            }}
            chips={[
              ...(status
                ? [
                    {
                      key: 'status',
                      label: `状态：${statusText[status] ?? status}`,
                      onClose: () => setStatus(undefined)
                    }
                  ]
                : [])
            ]}
            filters={
            <Select
              allowClear
              placeholder="会员状态"
              style={{ width: 140 }}
              value={status}
              onChange={setStatus}
              options={[
                { value: 'ACTIVE', label: '正常' },
                { value: 'FROZEN', label: '冻结' },
                { value: 'EXPIRED', label: '过期' },
                { value: 'BLACKLISTED', label: '黑名单' }
              ]}
            />
            }
          />
        }
      />
      <Modal title="新增会员" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={create}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select options={[{ value: '男' }, { value: '女' }]} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
