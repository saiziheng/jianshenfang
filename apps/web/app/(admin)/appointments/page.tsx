'use client';

import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Modal, Select, Space, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ResourceTable, type ResourceTableRef } from '@/components/resource-table';
import { ApiList, apiFetch } from '@/lib/api';

type Appointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  member: { name: string };
  trainer: { name: string };
};
type MemberOption = {
  id: string;
  name: string;
  phone: string;
  cards: Array<{ id: string; cardNo: string; type: string; remainingLessons?: number }>;
};
type TrainerOption = { id: string; name: string; active: boolean };

export default function AppointmentsPage() {
  const tableRef = useRef<ResourceTableRef>(null);
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | undefined>();
  const [trainerId, setTrainerId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const selectedMemberId = Form.useWatch('memberId', form);

  useEffect(() => {
    Promise.all([apiFetch<ApiList<MemberOption>>('/members?pageSize=100'), apiFetch<TrainerOption[]>('/trainers')])
      .then(([memberPayload, trainerPayload]) => {
        setMembers(memberPayload.items);
        setTrainers(trainerPayload.filter((item) => item.active));
      })
      .catch((error) => message.error(error.message));
  }, []);

  const endpoint = useMemo(() => {
    const query = new URLSearchParams();
    if (date) query.set('date', date);
    if (trainerId) query.set('trainerId', trainerId);
    if (status) query.set('status', status);
    const suffix = query.toString();
    return `/appointments${suffix ? `?${suffix}` : ''}`;
  }, [date, trainerId, status]);

  async function create(values: {
    memberId: string;
    trainerId: string;
    memberCardId: string;
    range: [Dayjs, Dayjs];
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
      tableRef.current?.refresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '预约失败');
    }
  }

  async function action(id: string, path: string) {
    try {
      await apiFetch(`/appointments/${id}/${path}`, { method: 'POST', body: JSON.stringify({}) });
      message.success('操作成功');
      tableRef.current?.refresh();
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
        ref={tableRef}
        endpoint={endpoint}
        columns={columns}
        toolbar={
          <Space wrap>
            <DatePicker onChange={(_, value) => setDate(Array.isArray(value) ? value[0] : value)} />
            <Select
              allowClear
              placeholder="教练"
              style={{ width: 160 }}
              value={trainerId}
              onChange={setTrainerId}
              options={trainers.map((item) => ({ value: item.id, label: item.name }))}
            />
            <Select
              allowClear
              placeholder="状态"
              style={{ width: 140 }}
              value={status}
              onChange={setStatus}
              options={[
                { value: 'BOOKED', label: '已预约' },
                { value: 'COMPLETED', label: '已完成' },
                { value: 'CANCELLED', label: '已取消' },
                { value: 'ABSENT', label: '缺席' }
              ]}
            />
          </Space>
        }
      />
      <Modal title="新建预约" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="memberId" label="会员 ID" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择会员"
              onChange={() => form.setFieldValue('memberCardId', undefined)}
              options={members.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.phone}`
              }))}
            />
          </Form.Item>
          <Form.Item name="trainerId" label="教练 ID" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择教练"
              options={trainers.map((item) => ({ value: item.id, label: item.name }))}
            />
          </Form.Item>
          <Form.Item name="memberCardId" label="私教卡 ID" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择私教卡"
              disabled={!selectedMemberId}
              options={(members.find((member) => member.id === selectedMemberId)?.cards ?? [])
                .filter((card) => card.type === 'PT_CARD')
                .map((card) => ({
                  value: card.id,
                  label: `${card.cardNo} · 剩余 ${card.remainingLessons ?? 0} 课时`
                }))}
            />
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
