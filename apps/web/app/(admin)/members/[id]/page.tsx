'use client';

import { Descriptions, List, Tag, message } from 'antd';
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
    cardNo: string;
    type: string;
    endDate?: string;
    remainingVisits?: number;
    remainingLessons?: number;
  };
  summary?: {
    remainingVisits?: number;
    remainingLessons?: number;
    remainingDays?: number;
  };
  appointments: Array<{ id: string; startAt: string; status: string; trainer: { name: string } }>;
  accessLogs: Array<{ id: string; happenedAt: string; direction: string; result: string; reason?: string }>;
};

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const [member, setMember] = useState<MemberDetail | null>(null);

  useEffect(() => {
    apiFetch<MemberDetail>(`/members/${params.id}`)
      .then(setMember)
      .catch((error) => message.error(error.message));
  }, [params.id]);

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
              {item.startAt.slice(0, 16).replace('T', ' ')} · {item.trainer.name} · {item.status}
            </List.Item>
          )}
        />
      </section>
      <section className="content-band">
        <h2 style={{ marginTop: 0 }}>门禁/到店记录</h2>
        <List
          dataSource={member?.accessLogs ?? []}
          renderItem={(item) => (
            <List.Item>
              {item.happenedAt.slice(0, 16).replace('T', ' ')} · {item.direction} · {item.result} · {item.reason}
            </List.Item>
          )}
        />
      </section>
    </>
  );
}
