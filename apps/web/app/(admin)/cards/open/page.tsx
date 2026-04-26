'use client';

import { Button, DatePicker, Form, Input, InputNumber, Select, message } from 'antd';
import { useEffect, useState } from 'react';
import { ApiList, apiFetch } from '@/lib/api';

type MemberOption = { id: string; name: string; phone: string; memberNo: string };
type PackageOption = { id: string; name: string; type: string; price: string; active: boolean };

export default function OpenCardPage() {
  const [form] = Form.useForm();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);

  useEffect(() => {
    Promise.all([apiFetch<ApiList<MemberOption>>('/members?pageSize=100'), apiFetch<PackageOption[]>('/packages')])
      .then(([memberPayload, packagePayload]) => {
        setMembers(memberPayload.items);
        setPackages(packagePayload.filter((item) => item.active));
      })
      .catch((error) => message.error(error.message));
  }, []);

  async function submit(values: {
    memberId: string;
    packageId: string;
    startDate?: { format: (pattern: string) => string };
    amount: number;
    method: string;
    remark?: string;
  }) {
    try {
      await apiFetch('/member-cards/open', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          startDate: values.startDate?.format('YYYY-MM-DD')
        })
      });
      message.success('开卡成功');
      form.resetFields(['startDate', 'amount', 'remark']);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '开卡失败');
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">开卡收银</h1>
      </div>
      <section className="content-band">
        <Form form={form} layout="vertical" onFinish={submit} style={{ maxWidth: 620 }}>
          <Form.Item name="memberId" label="会员 ID" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择会员"
              options={members.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.phone} · ${item.memberNo}`
              }))}
            />
          </Form.Item>
          <Form.Item name="packageId" label="套餐 ID" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择套餐"
              onChange={(value) => {
                const plan = packages.find((item) => item.id === value);
                if (plan) form.setFieldValue('amount', Number(plan.price));
              }}
              options={packages.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.type} · ${item.price}`
              }))}
            />
          </Form.Item>
          <Form.Item name="startDate" label="开卡日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="amount" label="实收金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="method" label="支付方式" rules={[{ required: true }]} initialValue="WECHAT">
            <Select
              options={[
                { value: 'CASH', label: '现金' },
                { value: 'WECHAT', label: '微信' },
                { value: 'ALIPAY', label: '支付宝' },
                { value: 'BANK_CARD', label: '银行卡' },
                { value: 'OTHER', label: '其他' }
              ]}
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            确认开卡
          </Button>
        </Form>
      </section>
    </>
  );
}
