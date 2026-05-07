'use client';

import { Button, DatePicker, Drawer, Form, Input, InputNumber, Select, Steps } from 'antd';
import { CreditCard, ReceiptText, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/toast';
import { ApiList, apiFetch } from '@/lib/api';

type MemberOption = { id: string; name: string; phone: string; memberNo: string };
type PackageOption = { id: string; name: string; type: string; price: string; active: boolean };

const stepFields = [['memberId'], ['packageId', 'amount'], ['method']];

export default function OpenCardPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState(0);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const selectedPackageId = Form.useWatch('packageId', form);
  const amount = Form.useWatch('amount', form);
  const selectedPackage = useMemo(() => packages.find((item) => item.id === selectedPackageId), [packages, selectedPackageId]);
  const packagePrice = selectedPackage ? Number(selectedPackage.price) : 0;
  const actualAmount = Number(amount ?? 0);
  const discount = Math.max(0, packagePrice - actualAmount);

  useEffect(() => {
    Promise.all([apiFetch<ApiList<MemberOption>>('/members?pageSize=100'), apiFetch<PackageOption[]>('/packages')])
      .then(([memberPayload, packagePayload]) => {
        setMembers(memberPayload.items);
        setPackages(packagePayload.filter((item) => item.active));

        const memberId = new URLSearchParams(window.location.search).get('memberId');
        if (memberId) form.setFieldValue('memberId', memberId);
      })
      .catch((error) => toast.error(error.message));
  }, [form]);

  async function nextStep() {
    await form.validateFields(stepFields[current]);
    setCurrent((value) => Math.min(value + 1, 2));
  }

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
      toast.success('开卡成功');
      setOpen(false);
      router.push(`/members/${values.memberId}`);
    } catch (error) {
      toast.error({
        message: error instanceof Error ? error.message : '开卡失败',
        actionLabel: '重试',
        onAction: () => form.submit()
      });
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">开卡收银</h1>
          <p className="page-subtitle">按步骤完成会员、套餐、支付确认</p>
        </div>
      </div>

      <section className="app-card app-card-body open-card-launch">
        <div>
          <h2 className="section-title">开卡流程</h2>
          <p className="muted">选择会员后配置套餐和支付方式，完成后自动进入会员详情。</p>
        </div>
        <Button type="primary" size="large" icon={<CreditCard size={18} strokeWidth={1.75} />} onClick={() => setOpen(true)}>
          开始开卡
        </Button>
      </section>

      <Drawer
        title="开卡收银"
        open={open}
        width={640}
        onClose={() => setOpen(false)}
        closeIcon={<X size={18} strokeWidth={1.75} />}
      >
        <Form form={form} className="drawer-form" layout="vertical" onFinish={submit} initialValues={{ method: 'WECHAT' }}>
          <Steps
            className="open-card-steps"
            current={current}
            items={[
              { title: '选会员', icon: <User size={18} strokeWidth={1.75} /> },
              { title: '选套餐', icon: <CreditCard size={18} strokeWidth={1.75} /> },
              { title: '确认支付', icon: <ReceiptText size={18} strokeWidth={1.75} /> }
            ]}
          />

          <div className="open-card-step-body">
            {current === 0 ? (
              <>
                <p className="form-section-label">会员</p>
                <Form.Item name="memberId" label="会员" rules={[{ required: true, message: '请选择会员' }]}>
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
              </>
            ) : null}

            {current === 1 ? (
              <>
                <p className="form-section-label">套餐配置</p>
                <Form.Item name="packageId" label="套餐" rules={[{ required: true, message: '请选择套餐' }]}>
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
                <Form.Item name="amount" label="实收金额" rules={[{ required: true, message: '请输入实收金额' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="remark" label="备注">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <div className="payment-summary">
                  <div className="payment-summary-line">
                    <span>套餐原价</span>
                    <strong>¥{packagePrice.toFixed(2)}</strong>
                  </div>
                  <div className="payment-summary-line">
                    <span>折扣</span>
                    <strong>- ¥{discount.toFixed(2)}</strong>
                  </div>
                  <div className="payment-summary-total">
                    <span>实付</span>
                    <strong>¥{actualAmount.toFixed(2)}</strong>
                  </div>
                </div>
              </>
            ) : null}

            {current === 2 ? (
              <>
                <p className="form-section-label">支付方式</p>
                <Form.Item name="method" label="支付方式" rules={[{ required: true, message: '请选择支付方式' }]}>
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
                <div className="payment-summary">
                  <div className="payment-summary-line">
                    <span>会员</span>
                    <strong>{members.find((member) => member.id === form.getFieldValue('memberId'))?.name ?? '-'}</strong>
                  </div>
                  <div className="payment-summary-line">
                    <span>套餐</span>
                    <strong>{selectedPackage?.name ?? '-'}</strong>
                  </div>
                  <div className="payment-summary-total">
                    <span>本次收款</span>
                    <strong>¥{actualAmount.toFixed(2)}</strong>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="drawer-footer">
            {current > 0 ? <Button onClick={() => setCurrent((value) => Math.max(value - 1, 0))}>上一步</Button> : null}
            {current < 2 ? (
              <Button type="primary" onClick={() => void nextStep()}>
                下一步
              </Button>
            ) : (
              <Button type="primary" htmlType="submit">
                确认开卡
              </Button>
            )}
          </div>
        </Form>
      </Drawer>
    </>
  );
}
