'use client';

import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertCircle, DoorOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { MetricGrid } from '@/components/metric-grid';
import { TableSkeleton } from '@/components/skeletons';
import { toast } from '@/components/toast';
import { apiFetch } from '@/lib/api';

type CardWarning = { id: string; member: { name: string }; package: { name: string }; endDate?: string };

type Dashboard = {
  metrics: {
    currentPresence: number;
    todayIn: number;
    todayOut: number;
    activeMembers: number;
    todayAppointments: number;
  };
  cardWarnings: CardWarning[];
  warningGroups: {
    expiringCards: CardWarning[];
    lowVisitCards: Array<CardWarning & { remainingVisits?: number }>;
    lowLessonCards: Array<CardWarning & { remainingLessons?: number }>;
  };
  latestAccessLogs: Array<{ id: string; member?: { name: string }; direction: string; result: string; reason?: string }>;
};

type WarningRow = {
  id: string;
  name: string;
  packageName: string;
  chip: string;
  tone: 'chip-warning' | 'chip-danger';
};

function daysLeft(endDate?: string) {
  if (!endDate) return '-';
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return `${Math.max(0, days)} 天`;
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    apiFetch<Dashboard>('/dashboard')
      .then(setData)
      .catch((error) => toast.error(error.message));
  }, []);

  const warnings = useMemo<WarningRow[]>(() => {
    if (!data) return [];

    return [
      ...data.warningGroups.expiringCards.map((item) => ({
        id: `expiring-${item.id}`,
        name: item.member.name,
        packageName: item.package.name,
        chip: daysLeft(item.endDate),
        tone: 'chip-warning' as const
      })),
      ...data.warningGroups.lowVisitCards.map((item) => ({
        id: `visit-${item.id}`,
        name: item.member.name,
        packageName: item.package.name,
        chip: `${item.remainingVisits ?? 0} 次`,
        tone: 'chip-danger' as const
      })),
      ...data.warningGroups.lowLessonCards.map((item) => ({
        id: `lesson-${item.id}`,
        name: item.member.name,
        packageName: item.package.name,
        chip: `${item.remainingLessons ?? 0} 课时`,
        tone: 'chip-danger' as const
      }))
    ];
  }, [data]);

  const accessColumns = useMemo<ColumnsType<Dashboard['latestAccessLogs'][number]>>(
    () => [
      { title: '会员', dataIndex: ['member', 'name'], render: (value) => value ?? '未知会员' },
      { title: '方向', dataIndex: 'direction', render: (value) => (value === 'IN' ? '入场' : value === 'OUT' ? '离场' : value) },
      {
        title: '结果',
        dataIndex: 'result',
        render: (value) => <span className={`chip ${value === 'ALLOWED' ? 'chip-success' : 'chip-danger'}`}>{value}</span>
      },
      { title: '原因', dataIndex: 'reason', render: (value) => value || <span className="muted">-</span> }
    ],
    []
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">工作台</h1>
          <p className="page-subtitle">会员、预约、门禁与场馆实时状态概览</p>
        </div>
      </div>
      <MetricGrid
        loading={!data}
        metrics={[
          { label: '当前在馆', value: data?.metrics.currentPresence ?? 0, delta: { value: '↑ 实时', trend: 'positive' } },
          { label: '今日入场', value: data?.metrics.todayIn ?? 0, delta: { value: '↑ 今日', trend: 'positive' } },
          { label: '有效会员', value: data?.metrics.activeMembers ?? 0, delta: { value: '↑ 运营', trend: 'positive' } },
          { label: '今日预约', value: data?.metrics.todayAppointments ?? 0, delta: { value: '↑ 课程', trend: 'positive' } }
        ]}
      />

      <div className="two-column-layout">
        <section className="app-card">
          <div className="app-card-header">
            <h2 className="app-card-title">即将到期卡片 / 余次不足</h2>
          </div>
          <div className="app-card-body">
            {!data ? (
              <TableSkeleton columns={3} />
            ) : warnings.length ? (
              <div className="warning-list">
                {warnings.map((item) => (
                  <div className="warning-row" key={item.id}>
                    <div className="table-primary-text">
                      <strong>{item.name}</strong>
                      <span>{item.packageName}</span>
                    </div>
                    <div className="toolbar">
                      <span className={`chip ${item.tone}`}>{item.chip}</span>
                      <Button type="text" className="text-link-button" href="/cards/open">
                        续费
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={AlertCircle} title="暂无预警" description="所有会员卡状态都在安全范围内" />
            )}
          </div>
        </section>

        <section className="app-card">
          <div className="app-card-header">
            <h2 className="app-card-title">实时在场人数</h2>
          </div>
          <div className="app-card-body">
            <p className="big-number">{data?.metrics.currentPresence ?? 0}</p>
            <p className="muted">今日入场 {data?.metrics.todayIn ?? 0} 人，离场 {data?.metrics.todayOut ?? 0} 人</p>
          </div>
        </section>
      </div>

      <section className="app-card">
        <div className="app-card-header">
          <h2 className="app-card-title">最近通行记录</h2>
        </div>
        {!data ? (
          <TableSkeleton columns={4} />
        ) : (
          <Table
            rowKey="id"
            columns={accessColumns}
            dataSource={data.latestAccessLogs}
            pagination={false}
            locale={{
              emptyText: <EmptyState icon={DoorOpen} title="暂无通行记录" description="有会员进出后会在这里出现" />
            }}
          />
        )}
      </section>
    </>
  );
}
