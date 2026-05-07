'use client';

import { Button, Form, Input, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useRef, useState } from 'react';
import { FilterBar } from '@/components/filter-bar';
import { ResourceTable, type ResourceTableRef } from '@/components/resource-table';
import { toast } from '@/components/toast';
import { apiFetch } from '@/lib/api';

type Trainer = { id: string; name: string; phone: string; specialties?: string; active: boolean };

export default function TrainersPage() {
  const tableRef = useRef<ResourceTableRef>(null);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  async function create(values: { name: string; phone: string; specialties?: string }) {
    try {
      await apiFetch('/trainers', { method: 'POST', body: JSON.stringify(values) });
      toast.success('教练已新增');
      setOpen(false);
      tableRef.current?.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '新增失败');
    }
  }

  const columns = useMemo<ColumnsType<Trainer>>(
    () => [
      { title: '姓名', dataIndex: 'name' },
      { title: '手机', dataIndex: 'phone' },
      { title: '专长', dataIndex: 'specialties' },
      {
        title: '状态',
        dataIndex: 'active',
        render: (value: boolean) => <span className={`chip ${value ? 'chip-success' : 'chip-danger'}`}>{value ? '启用' : '停用'}</span>
      }
    ],
    []
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">教练管理</h1>
      </div>
      <ResourceTable<Trainer>
        ref={tableRef}
        endpoint={`/trainers?keyword=${encodeURIComponent(keyword)}`}
        columns={columns}
        emptyTitle="暂无教练"
        emptyDescription="点击新增教练，建立可预约的私教团队"
        toolbar={
          <FilterBar
            searchValue={keyword}
            searchPlaceholder="搜索姓名/手机号"
            onSearchChange={setKeyword}
            onReset={() => setKeyword('')}
            actionLabel="新增教练"
            onAction={() => setOpen(true)}
          />
        }
      />
      <Modal title="新增教练" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={create}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="specialties" label="专长">
            <Input />
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
