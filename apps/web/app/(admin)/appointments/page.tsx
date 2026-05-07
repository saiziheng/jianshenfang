'use client';

import { Button, DatePicker, Drawer, Form, Select, Tabs, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { CalendarDays, CheckCircle2, ListChecks, Plus, User, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { confirmDanger } from '@/components/confirm-dialog';
import { FilterBar } from '@/components/filter-bar';
import { ResourceTable, type ResourceTableRef } from '@/components/resource-table';
import { toast } from '@/components/toast';
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

const statusText: Record<string, string> = {
  BOOKED: '已预约',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  ABSENT: '缺席'
};

export default function AppointmentsPage() {
  const tableRef = useRef<ResourceTableRef>(null);
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list');
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
      .catch((error) => toast.error(error.message));
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
      toast.success('预约成功');
      setOpen(false);
      tableRef.current?.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '预约失败');
    }
  }

  async function action(id: string, path: string) {
    try {
      await apiFetch(`/appointments/${id}/${path}`, { method: 'POST', body: JSON.stringify({}) });
      toast.success('操作成功');
      tableRef.current?.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    }
  }

  function cancelAppointment(id: string) {
    confirmDanger({
      title: '确定取消预约？',
      content: '取消后该时间段将重新释放，此操作会记录在预约历史中。',
      okText: '取消预约',
      onOk: () => action(id, 'cancel')
    });
  }

  const columns = useMemo<ColumnsType<Appointment>>(
    () => [
      { title: '会员', dataIndex: ['member', 'name'] },
      { title: '教练', dataIndex: ['trainer', 'name'] },
      { title: '开始', dataIndex: 'startAt', render: (value) => value.slice(0, 16).replace('T', ' ') },
      { title: '结束', dataIndex: 'endAt', render: (value) => value.slice(0, 16).replace('T', ' ') },
      {
        title: '状态',
        dataIndex: 'status',
        render: (value: string) => (
          <span className={`chip ${value === 'COMPLETED' ? 'chip-success' : value === 'CANCELLED' ? 'chip-neutral' : 'chip-blue'}`}>
            {statusText[value] ?? value}
          </span>
        )
      },
      {
        title: '操作',
        render: (_, row) => (
          <span className="table-action-group">
            <Tooltip title="完成消课">
              <Button
                aria-label="完成消课"
                className="icon-button"
                icon={<CheckCircle2 size={16} strokeWidth={1.75} />}
                onClick={() => action(row.id, 'complete')}
              />
            </Tooltip>
            <Tooltip title="取消预约">
              <Button
                aria-label="取消预约"
                className="icon-button"
                icon={<XCircle size={16} strokeWidth={1.75} />}
                onClick={() => cancelAppointment(row.id)}
              />
            </Tooltip>
          </span>
        )
      }
    ],
    []
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">私教预约</h1>
      </div>

      <Tabs
        className="appointment-tabs"
        activeKey={view}
        onChange={setView}
        items={[
          { key: 'list', label: <span className="toolbar"><ListChecks size={16} strokeWidth={1.75} />列表视图</span> },
          { key: 'calendar', label: <span className="toolbar"><CalendarDays size={16} strokeWidth={1.75} />日历视图</span> }
        ]}
      />

      {view === 'calendar' ? (
        <div className="calendar-placeholder">
          <span>日历视图预留</span>
        </div>
      ) : (
        <ResourceTable<Appointment>
          ref={tableRef}
          endpoint={endpoint}
          columns={columns}
          emptyTitle="暂无预约"
          emptyDescription="选择日期或清空筛选后查看预约记录"
          toolbar={
            <FilterBar
              onReset={() => {
                setDate(undefined);
                setTrainerId(undefined);
                setStatus(undefined);
              }}
              actionLabel="新建预约"
              onAction={() => setOpen(true)}
              chips={[
                ...(date ? [{ key: 'date', label: `日期：${date}`, onClose: () => setDate(undefined) }] : []),
                ...(trainerId
                  ? [
                      {
                        key: 'trainer',
                        label: `教练：${trainers.find((trainer) => trainer.id === trainerId)?.name ?? trainerId}`,
                        onClose: () => setTrainerId(undefined)
                      }
                    ]
                  : []),
                ...(status ? [{ key: 'status', label: `状态：${statusText[status] ?? status}`, onClose: () => setStatus(undefined) }] : [])
              ]}
              filters={
                <>
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
                </>
              }
            />
          }
        />
      )}

      <Drawer title="新建预约" open={open} width={520} onClose={() => setOpen(false)} closeIcon={<X size={18} strokeWidth={1.75} />}>
        <Form form={form} className="drawer-form" layout="vertical" onFinish={create}>
          <p className="form-section-label">会员与教练</p>
          <Form.Item name="memberId" label="会员" rules={[{ required: true }]}>
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
          <Form.Item name="trainerId" label="教练" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              optionRender={(option) => (
                <span className="table-primary-cell">
                  <span className="avatar-circle">
                    <User size={15} strokeWidth={1.75} />
                  </span>
                  <span>{option.label}</span>
                </span>
              )}
              placeholder="选择教练"
              options={trainers.map((item) => ({ value: item.id, label: item.name }))}
            />
          </Form.Item>

          <p className="form-section-label">课程时间</p>
          <Form.Item name="memberCardId" label="私教卡" rules={[{ required: true }]}>
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
          <div className="drawer-footer">
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit" icon={<Plus size={16} strokeWidth={1.75} />}>
              保存预约
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
