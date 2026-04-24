'use client';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { ResourceTable } from '@/components/resource-table';
import { apiFetch } from '@/lib/api';

type Trainer = { id: string; name: string; phone: string; specialties?: string; active: boolean };

export default function TrainersPage() {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  async function create(values: { name: string; phone: string; specialties?: string }) {
    try {
      await apiFetch('/trainers', { method: 'POST', body: JSON.stringify(values) });
      message.success('教练已新增');
      setOpen(false);
      setKeyword(values.phone);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '新增失败');
    }
  }

  const columns = useMemo<ColumnsType<Trainer>>(
    () => [
      { title: '姓名', dataIndex: 'name' },
      { title: '手机', dataIndex: 'phone' },
      { title: '专长', dataIndex: 'specialties' },
      { title: '状态', dataIndex: 'active', render: (value) => <Tag color={value ? 'green' : 'red'}>{value ? '启用' : '停用'}</Tag> }
    ],
    []
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">教练管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          新增教练
        </Button>
      </div>
      <ResourceTable<Trainer>
        endpoint={`/trainers?keyword=${encodeURIComponent(keyword)}`}
        columns={columns}
        toolbar={<Input allowClear placeholder="姓名/手机" value={keyword} onChange={(event) => setKeyword(event.target.value)} />}
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
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form>
      </Modal>
    </>
  );
}
