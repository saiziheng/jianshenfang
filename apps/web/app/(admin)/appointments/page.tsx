'use client';

import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Modal, Space, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { ResourceTable } from '@/components/resource-table';
import { apiFetch } from '@/lib/api';

type Appointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  member: { name: string };
  trainer: { name: string };
};

export default function AppointmentsPage() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | undefined>();

  async function create(values: {
    memberId: string;
    trainerId: string;
    memberCardId: string;
    range: [{ toISOString: () => string }, { toISOString: () => string }];
  }) {
    try {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          memberId: values.memberId,
          trainerId: values.trainerId,
          memberCardId: values.memberCardId,
          startAt: values.range[0].toISOString(),
          endAt: values.range[1].toISOString()
        })
      });
      message.success('预约成功');
      setOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '预约失败');
    }
  }

  async function action(id: string, path: string) {
    try {
      await apiFetch(`/appointments/${id}/${path}`, { method: 'POST', body: JSON.stringify({}) });
      message.success('操作成功');
      setDate(new Date().toISOString().slice(0, 10));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败');
    }
  }

  const columns = useMemo<ColumnsType<Appointment>>(
    () => [
      { title: '会员', dataIndex: ['member', 'name'] },
      { title: '教练', dataIndex: ['trainer', 'name'] },
      { title: '开始', dataIndex: 'startAt', render: (value) => value.slice(0, 16).replace('T', ' ') },
      { title: '结束', dataIndex: 'endAt', render: (value) => value.slice(0, 16).replace('T', ' ') },
      { title: '状态', dataIndex: 'status', render: (value) => <Tag>{value}</Tag> },
      {
        title: '操作',
        render: (_, row) => (
          <Space>
            <Tooltip title="完成消课">
              <Button aria-label="完成消课" icon={<CheckCircleOutlined />} onClick={() => action(row.id, 'complete')} />
            </Tooltip>
            <Tooltip title="取消预约">
              <Button aria-label="取消预约" icon={<CloseCircleOutlined />} onClick={() => action(row.id, 'cancel')} />
            </Tooltip>
          </Space>
        )
      }
    ],
    []
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">私教预约</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          新建预约
        </Button>
      </div>
      <ResourceTable<Appointment>
        endpoint={`/appointments${date ? `?date=${date}` : ''}`}
        columns={columns}
        toolbar={<DatePicker onChange={(_, value) => setDate(Array.isArray(value) ? value[0] : value)} />}
      />
      <Modal title="新建预约" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={create}>
          <Form.Item name="memberId" label="会员 ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="trainerId" label="教练 ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="memberCardId" label="私教卡 ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="range" label="上课时间" rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            保存预约
          </Button>
        </Form>
      </Modal>
    </>
  );
}
