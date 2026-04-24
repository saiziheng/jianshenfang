'use client';

import { Button, DatePicker, Form, Input, InputNumber, Select, message } from 'antd';
import { apiFetch } from '@/lib/api';

export default function OpenCardPage() {
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
        <Form layout="vertical" onFinish={submit} style={{ maxWidth: 620 }}>
          <Form.Item name="memberId" label="会员 ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="packageId" label="套餐 ID" rules={[{ required: true }]}>
            <Input />
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
