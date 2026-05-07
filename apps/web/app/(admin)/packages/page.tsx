'use client';

import { Button, Drawer, Form, Input, InputNumber, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { FilterBar } from '@/components/filter-bar';
import { ResourceTable, type ResourceTableRef } from '@/components/resource-table';
import { toast } from '@/components/toast';
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
      toast.success('套餐已新增');
      setOpen(false);
      tableRef.current?.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '新增失败');
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
        <h1 className="page-title">套餐管理</h1>
      </div>
      <ResourceTable<PackagePlan>
        ref={tableRef}
        endpoint={`/packages${type ? `?type=${type}` : ''}`}
        columns={columns}
        emptyTitle="暂无套餐"
        emptyDescription="点击新增套餐，配置时间卡、次卡或私教卡"
        toolbar={
          <FilterBar
            onReset={() => setType(undefined)}
            actionLabel="新增套餐"
            onAction={() => setOpen(true)}
            chips={[
              ...(type
                ? [
                    {
                      key: 'type',
                      label: `类型：${type}`,
                      onClose: () => setType(undefined)
                    }
                  ]
                : [])
            ]}
            filters={
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
        }
      />
      <Drawer
        title="新增套餐"
        open={open}
        width={520}
        onClose={() => setOpen(false)}
        closeIcon={<X size={18} strokeWidth={1.75} />}
      >
        <Form className="drawer-form" layout="vertical" onFinish={create}>
          <p className="form-section-label">基本信息</p>
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
          <p className="form-section-label">卡信息</p>
          <Form.Item name="durationDays" label="有效天数">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalVisits" label="总次数">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalLessons" label="课时数">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <div className="drawer-footer">
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
