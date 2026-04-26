'use client';

import { Descriptions, List, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type MemberDetail = {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
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

function formatDate(value?: string) {
  return value ? value.slice(0, 16).replace('T', ' ') : '-';
}

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const [member, setMember] = useState<MemberDetail | null>(null);

  useEffect(() => {
    apiFetch<MemberDetail>(`/members/${params.id}`)
      .then(setMember)
      .catch((error) => message.error(error.message));
  }, [params.id]);

  const cardColumns: ColumnsType<MemberDetail['cards'][number]> = [
    { title: '卡号', dataIndex: 'cardNo' },
    { title: '套餐', dataIndex: ['package', 'name'] },
    { title: '类型', dataIndex: 'type' },
    { title: '状态', dataIndex: 'status', render: (value) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{value}</Tag> },
    { title: '有效期', dataIndex: 'endDate', render: formatDate },
    { title: '剩余次', dataIndex: 'remainingVisits', render: (value) => value ?? '-' },
    { title: '剩余课时', dataIndex: 'remainingLessons', render: (value) => value ?? '-' }
  ];

  const paymentColumns: ColumnsType<MemberDetail['payments'][number]> = [
    { title: '业务', dataIndex: 'bizType' },
    { title: '金额', dataIndex: 'amount' },
    { title: '支付方式', dataIndex: 'method' },
    { title: '时间', dataIndex: 'paidAt', render: formatDate },
    { title: '备注', dataIndex: 'remark' }
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">会员详情</h1>
      </div>
      <section className="content-band" style={{ marginBottom: 18 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="姓名">{member?.name}</Descriptions.Item>
          <Descriptions.Item label="会员号">{member?.memberNo}</Descriptions.Item>
          <Descriptions.Item label="手机">{member?.phone}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={member?.status === 'ACTIVE' ? 'green' : 'red'}>{member?.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前卡">{member?.currentCard?.cardNo ?? '无'}</Descriptions.Item>
          <Descriptions.Item label="剩余">
            {member?.summary
              ? `${member.summary.remainingDays ?? '-'} 天 / ${member.summary.remainingVisits ?? '-'} 次 / ${
                  member.summary.remainingLessons ?? '-'
                } 课时`
              : '无'}
          </Descriptions.Item>
        </Descriptions>
      </section>
      <section className="content-band" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>私教记录</h2>
        <List
          dataSource={member?.appointments ?? []}
          renderItem={(item) => (
            <List.Item>
              {formatDate(item.startAt)} · {item.trainer.name} · {item.status}
            </List.Item>
          )}
        />
      </section>
      <section className="content-band" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>持卡记录</h2>
        <Table rowKey="id" columns={cardColumns} dataSource={member?.cards ?? []} pagination={false} />
      </section>
      <section className="content-band" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>支付流水</h2>
        <Table rowKey="id" columns={paymentColumns} dataSource={member?.payments ?? []} pagination={false} />
      </section>
      <section className="content-band">
        <h2 style={{ marginTop: 0 }}>门禁/到店记录</h2>
        <List
          dataSource={member?.accessLogs ?? []}
          renderItem={(item) => (
            <List.Item>
              {formatDate(item.happenedAt)} · {item.direction} · {item.result} · {item.reason}
            </List.Item>
          )}
        />
      </section>
    </>
  );
}
