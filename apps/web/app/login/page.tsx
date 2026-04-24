'use client';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { useRouter } from 'next/navigation';
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
      message.error(error instanceof Error ? error.message : '登录失败');
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <h1>漾立方健身房管理系统</h1>
        <Form layout="vertical" onFinish={submit}>
          <Form.Item name="username" label="账号" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="至少 6 位" />
          </Form.Item>
          <Button block type="primary" htmlType="submit">
            登录
          </Button>
        </Form>
      </section>
    </main>
  );
}
