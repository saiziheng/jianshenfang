'use client';

import { Button, Form, Input, List, Select, message } from 'antd';
import { useEffect, useState } from 'react';
import { MetricGrid } from '@/components/metric-grid';
import { ApiList, apiFetch } from '@/lib/api';

type Summary = { current: number; todayIn: number; todayOut: number; abnormalOut: number };
type PresenceMember = { id: string; lastInAt?: string; member: { name: string; phone: string } };
type MemberOption = { id: string; name: string; phone: string; memberNo: string };

export default function PresencePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);

  async function load() {
    const [nextSummary, nextMembers] = await Promise.all([
      apiFetch<Summary>('/presence/summary'),
      apiFetch<PresenceMember[]>('/presence/current-members')
    ]);
    setSummary(nextSummary);
    setMembers(nextMembers);
  }

  async function correct(values: { memberId: string; inGym: boolean; reason: string }) {
    try {
      await apiFetch('/presence/corrections', { method: 'POST', body: JSON.stringify(values) });
      message.success('纠偏已记录');
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '纠偏失败');
    }
  }

  useEffect(() => {
    load().catch((error) => message.error(error.message));
    apiFetch<ApiList<MemberOption>>('/members?pageSize=100')
      .then((payload) => setMemberOptions(payload.items))
      .catch((error) => message.error(error.message));
  }, []);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">实时人数看板</h1>
      </div>
      <MetricGrid
        metrics={[
          { label: '当前在馆', value: summary?.current ?? 0 },
          { label: '今日入场', value: summary?.todayIn ?? 0 },
          { label: '今日离场', value: summary?.todayOut ?? 0 },
          { label: '异常离场', value: summary?.abnormalOut ?? 0 }
        ]}
      />
      <section className="content-band" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>在馆会员</h2>
        <List
          dataSource={members}
          renderItem={(item) => (
            <List.Item>
              {item.member.name} · {item.member.phone} · {item.lastInAt?.slice(0, 16).replace('T', ' ')}
            </List.Item>
          )}
        />
      </section>
      <section className="content-band">
        <h2 style={{ marginTop: 0 }}>手动纠偏</h2>
        <Form layout="inline" onFinish={correct}>
          <Form.Item name="memberId" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择会员"
              style={{ width: 240 }}
              options={memberOptions.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.phone} · ${item.memberNo}`
              }))}
            />
          </Form.Item>
          <Form.Item name="inGym" rules={[{ required: true }]}>
            <Select
              placeholder="状态"
              style={{ width: 130 }}
              options={[
                { value: true, label: '设为在馆' },
                { value: false, label: '设为离馆' }
              ]}
            />
          </Form.Item>
          <Form.Item name="reason" rules={[{ required: true }]}>
            <Input placeholder="纠偏原因" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form>
      </section>
    </>
  );
}
