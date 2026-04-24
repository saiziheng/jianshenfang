'use client';

import { Alert, List, message } from 'antd';
import { useEffect, useState } from 'react';
import { MetricGrid } from '@/components/metric-grid';
import { apiFetch } from '@/lib/api';

type Dashboard = {
  metrics: {
    currentPresence: number;
    todayIn: number;
    todayOut: number;
    activeMembers: number;
    todayAppointments: number;
  };
  cardWarnings: Array<{ id: string; member: { name: string }; package: { name: string }; endDate?: string }>;
  latestAccessLogs: Array<{ id: string; member?: { name: string }; direction: string; result: string; reason?: string }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    apiFetch<Dashboard>('/dashboard')
      .then(setData)
      .catch((error) => message.error(error.message));
  }, []);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
      </div>
      <MetricGrid
        metrics={[
          { label: '当前在馆', value: data?.metrics.currentPresence ?? 0 },
          { label: '今日入场', value: data?.metrics.todayIn ?? 0 },
          { label: '今日离场', value: data?.metrics.todayOut ?? 0 },
          { label: '有效会员', value: data?.metrics.activeMembers ?? 0 },
          { label: '今日预约', value: data?.metrics.todayAppointments ?? 0 }
        ]}
      />
      <section className="content-band" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>到期/次数预警</h2>
        {data?.cardWarnings.length ? (
          <List
            dataSource={data.cardWarnings}
            renderItem={(item) => (
              <List.Item>
                {item.member.name} · {item.package.name} · {item.endDate ? item.endDate.slice(0, 10) : '次数/课时预警'}
              </List.Item>
            )}
          />
        ) : (
          <Alert type="success" message="暂无预警" showIcon />
        )}
      </section>
      <section className="content-band">
        <h2 style={{ marginTop: 0 }}>最新门禁</h2>
        <List
          dataSource={data?.latestAccessLogs ?? []}
          renderItem={(item) => (
            <List.Item>
              {item.member?.name ?? '未知会员'} · {item.direction} · {item.result} · {item.reason}
            </List.Item>
          )}
        />
      </section>
    </>
  );
}
