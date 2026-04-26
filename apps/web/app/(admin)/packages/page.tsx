'use client';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Modal, Select, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useRef, useState } from 'react';
import { ResourceTable, type ResourceTableRef } from '@/components/resource-table';
import { apiFetch } from '@/lib/api';

type PackagePlan = {
  id: string;
  name: string;
  type: string;
  price: string;
  durationDays?: number;
  totalVisits?: number;
  totalLessons?: number;
  active: boolean;
};

export default function PackagesPage() {
  const tableRef = useRef<ResourceTableRef>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string | undefined>();

  async function create(values: PackagePlan) {
    try {
      await apiFetch('/packages', { method: 'POST', body: JSON.stringify(values) });
      message.success('套餐已新增');
      setOpen(false);
      tableRef.current?.refresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '新增失败');
    }
  }

  const columns = useMemo<ColumnsType<PackagePlan>>(
    () => [
      { title: '名称', dataIndex: 'name' },
      { title: '类型', dataIndex: 'type' },
      { title: '价格', dataIndex: 'price' },
      { title: '有效天数', dataIndex: 'durationDays' },
      { title: '总次数', dataIndex: 'totalVisits' },
      { title: '课时数', dataIndex: 'totalLessons' },
      { title: '状态', dataIndex: 'active', render: (value) => <Tag color={value ? 'green' : 'red'}>{value ? '启用' : '停用'}</Tag> }
    ],
    []
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">套餐管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          新增套餐
        </Button>
      </div>
      <ResourceTable<PackagePlan>
        ref={tableRef}
        endpoint={`/packages${type ? `?type=${type}` : ''}`}
        columns={columns}
        toolbar={
          <Select
            allowClear
            placeholder="套餐类型"
            style={{ width: 150 }}
            value={type}
            onChange={setType}
            options={[
              { value: 'TIME_CARD', label: '时间卡' },
              { value: 'VISIT_CARD', label: '次卡' },
              { value: 'PT_CARD', label: '私教卡' }
            ]}
          />
        }
      />
      <Modal title="新增套餐" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={create}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'TIME_CARD', label: '时间卡' },
                { value: 'VISIT_CARD', label: '次卡' },
                { value: 'PT_CARD', label: '私教卡' }
              ]}
            />
          </Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="durationDays" label="有效天数">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalVisits" label="总次数">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalLessons" label="课时数">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form>
      </Modal>
    </>
  );
}
