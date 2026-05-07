'use client';

import { Button, Drawer, Form, Input, List, Select, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Ban, CreditCard, Pencil, ShieldAlert, Snowflake, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { confirmDanger } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { DetailSkeleton } from '@/components/skeletons';
import { toast } from '@/components/toast';
import { apiFetch } from '@/lib/api';

type MemberDetail = {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  gender?: string;
  note?: string;
  status: string;
  currentCard?: {
    id: string;
    cardNo: string;
    type: string;
    status: string;
    endDate?: string;
    remainingVisits?: number;
    remainingLessons?: number;
  };
  summary?: {
    remainingVisits?: number;
    remainingLessons?: number;
    remainingDays?: number;
  };
  cards: Array<{
    id: string;
    cardNo: string;
    type: string;
    status: string;
    startDate: string;
    endDate?: string;
    remainingVisits?: number;
    remainingLessons?: number;
    package: { name: string };
  }>;
  appointments: Array<{ id: string; startAt: string; endAt: string; status: string; trainer: { name: string } }>;
  accessLogs: Array<{ id: string; happenedAt: string; direction: string; result: string; reason?: string }>;
  payments: Array<{ id: string; amount: string; method: string; bizType: string; paidAt: string; remark?: string }>;
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

function formatDate(value?: string) {
  return value ? value.slice(0, 16).replace('T', ' ') : '-';
}

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form] = Form.useForm();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    const nextMember = await apiFetch<MemberDetail>(`/members/${params.id}`);
    setMember(nextMember);
  }, [params.id]);

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, [load]);

  function openEdit() {
    if (!member) return;
    form.setFieldsValue({
      name: member.name,
      phone: member.phone,
      gender: member.gender,
      note: member.note,
      status: member.status
    });
    setEditOpen(true);
  }

  async function update(values: { name?: string; phone?: string; gender?: string; note?: string; status?: string }) {
    try {
      await apiFetch(`/members/${params.id}`, { method: 'PATCH', body: JSON.stringify(values) });
      toast.success('会员信息已更新');
      setEditOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
    }
  }

  function updateStatus(status: string, title: string, content: string, okText: string) {
    confirmDanger({
      title,
      content,
      okText,
      onOk: async () => {
        await apiFetch(`/members/${params.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        toast.success('会员状态已更新');
        await load();
      }
    });
  }

  const cardColumns: ColumnsType<MemberDetail['cards'][number]> = [
    { title: '卡号', dataIndex: 'cardNo' },
    { title: '套餐', dataIndex: ['package', 'name'] },
    { title: '类型', dataIndex: 'type' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: string) => <span className={`chip ${value === 'ACTIVE' ? 'chip-success' : 'chip-neutral'}`}>{value}</span>
    },
    { title: '有效期', dataIndex: 'endDate', render: formatDate },
    { title: '剩余次', dataIndex: 'remainingVisits', render: (value) => value ?? '-' },
    { title: '剩余课时', dataIndex: 'remainingLessons', render: (value) => value ?? '-' }
  ];

  const paymentColumns: ColumnsType<MemberDetail['payments'][number]> = [
    { title: '业务', dataIndex: 'bizType' },
    { title: '金额', dataIndex: 'amount' },
    { title: '支付方式', dataIndex: 'method' },
    { title: '时间', dataIndex: 'paidAt', render: formatDate },
    { title: '备注', dataIndex: 'remark', render: (value) => value || '-' }
  ];

  if (!member) {
    return (
      <section className="app-card">
        <DetailSkeleton />
      </section>
    );
  }

  return (
    <>
      <section className="app-card member-hero">
        <div className="member-identity">
          <span className="member-avatar-large">{member.name.slice(0, 1)}</span>
          <div>
            <h1>{member.name}</h1>
            <p className="page-subtitle">
              {member.memberNo} · {member.phone}
            </p>
            <span className={`chip ${statusClass[member.status] ?? 'chip-neutral'}`}>{statusText[member.status] ?? member.status}</span>
          </div>
        </div>
        <div className="member-actions">
          <Button icon={<Pencil size={16} strokeWidth={1.75} />} onClick={openEdit}>
            编辑
          </Button>
          <Button
            icon={member.status === 'FROZEN' ? <ShieldAlert size={16} strokeWidth={1.75} /> : <Snowflake size={16} strokeWidth={1.75} />}
            onClick={() =>
              updateStatus(
                member.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN',
                member.status === 'FROZEN' ? '确定解冻会员？' : '确定冻结会员？',
                member.status === 'FROZEN' ? '解冻后该会员可恢复正常业务操作。' : '冻结后该会员将暂时不可进行高风险业务操作。',
                member.status === 'FROZEN' ? '解冻' : '冻结'
              )
            }
          >
            {member.status === 'FROZEN' ? '解冻' : '冻结'}
          </Button>
          <Button icon={<CreditCard size={16} strokeWidth={1.75} />} type="primary" onClick={() => router.push(`/cards/open?memberId=${member.id}`)}>
            续费
          </Button>
          <Button
            danger
            icon={<Ban size={16} strokeWidth={1.75} />}
            onClick={() =>
              updateStatus('BLACKLISTED', '确定加入黑名单？', '加入黑名单后，该会员将无法正常办理预约、通行等业务。', '加入黑名单')
            }
          >
            加入黑名单
          </Button>
        </div>
      </section>

      <div className="member-detail-layout">
        <section className="app-card">
          <Tabs
            items={[
              {
                key: 'cards',
                label: '卡片',
                children: (
                  <div className="app-card-body">
                    <Table
                      rowKey="id"
                      columns={cardColumns}
                      dataSource={member.cards}
                      pagination={false}
                      locale={{ emptyText: <EmptyState icon={CreditCard} title="暂无持卡记录" description="开卡后会显示在这里" /> }}
                    />
                    <h2 className="section-title" style={{ marginTop: 24 }}>
                      支付流水
                    </h2>
                    <Table rowKey="id" columns={paymentColumns} dataSource={member.payments} pagination={false} />
                  </div>
                )
              },
              {
                key: 'appointments',
                label: '预约',
                children: (
                  <div className="app-card-body">
                    {member.appointments.length ? (
                      <List
                        dataSource={member.appointments}
                        renderItem={(item) => (
                          <List.Item>
                            {formatDate(item.startAt)} · {item.trainer.name} · {item.status}
                          </List.Item>
                        )}
                      />
                    ) : (
                      <EmptyState title="暂无预约记录" description="预约私教课程后会显示在这里" />
                    )}
                  </div>
                )
              },
              {
                key: 'access',
                label: '通行记录',
                children: (
                  <div className="app-card-body">
                    {member.accessLogs.length ? (
                      <List
                        dataSource={member.accessLogs}
                        renderItem={(item) => (
                          <List.Item>
                            {formatDate(item.happenedAt)} · {item.direction} · {item.result} · {item.reason ?? '-'}
                          </List.Item>
                        )}
                      />
                    ) : (
                      <EmptyState title="暂无通行记录" description="会员进出门禁后会显示在这里" />
                    )}
                  </div>
                )
              }
            ]}
          />
        </section>

        <aside className="app-card inspector-card">
          <div className="app-card-header">
            <h2 className="app-card-title">基本信息</h2>
          </div>
          <div className="app-card-body inspector-list">
            <div className="inspector-row">
              <span className="muted">会员号</span>
              <strong>{member.memberNo}</strong>
            </div>
            <div className="inspector-row">
              <span className="muted">手机号</span>
              <strong>{member.phone}</strong>
            </div>
            <div className="inspector-row">
              <span className="muted">当前卡</span>
              <strong>{member.currentCard?.cardNo ?? '无'}</strong>
            </div>
            <div className="inspector-row">
              <span className="muted">剩余</span>
              <strong>
                {member.summary
                  ? `${member.summary.remainingDays ?? '-'} 天 / ${member.summary.remainingVisits ?? '-'} 次 / ${
                      member.summary.remainingLessons ?? '-'
                    } 课时`
                  : '无'}
              </strong>
            </div>
            <div className="inspector-row">
              <span className="muted">备注</span>
              <strong>{member.note || '-'}</strong>
            </div>
          </div>
        </aside>
      </div>

      <Drawer title="编辑会员" open={editOpen} width={520} onClose={() => setEditOpen(false)} closeIcon={<X size={18} strokeWidth={1.75} />}>
        <Form form={form} className="drawer-form" layout="vertical" onFinish={update}>
          <p className="form-section-label">基本信息</p>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select options={[{ value: '男' }, { value: '女' }]} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { value: 'ACTIVE', label: '在卡' },
                { value: 'FROZEN', label: '冻结' },
                { value: 'EXPIRED', label: '过期' },
                { value: 'BLACKLISTED', label: '黑名单' }
              ]}
            />
          </Form.Item>
          <p className="form-section-label">备注</p>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={4} />
          </Form.Item>
          <div className="drawer-footer">
            <Button onClick={() => setEditOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
