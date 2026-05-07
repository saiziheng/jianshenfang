'use client';

import { Button, Form, Input } from 'antd';
import { Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/toast';
import { apiFetch } from '@/lib/api';

type LoginResponse = {
  accessToken: string;
  admin: { name: string; role: string };
};

export default function LoginPage() {
  const router = useRouter();

  async function submit(values: { username: string; password: string }) {
    try {
      const result = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      localStorage.setItem('ylf_token', result.accessToken);
      localStorage.setItem('ylf_admin', JSON.stringify(result.admin));
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '登录失败');
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <h1>漾立方健身房管理系统</h1>
        <p className="login-panel-subtitle">前台收银、会员运营和场馆在场管理</p>
        <Form layout="vertical" onFinish={submit}>
          <Form.Item name="username" label="账号" rules={[{ required: true }]}>
            <Input prefix={<User size={16} strokeWidth={1.75} />} placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<Lock size={16} strokeWidth={1.75} />} placeholder="至少 6 位" />
          </Form.Item>
          <Button block type="primary" htmlType="submit">
            登录
          </Button>
        </Form>
      </section>
    </main>
  );
}
