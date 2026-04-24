'use client';

import {
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  IdcardOutlined,
  LoginOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Layout, Menu, Typography, Button } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const navItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: <Link href="/dashboard">工作台</Link> },
  { key: '/members', icon: <UserOutlined />, label: <Link href="/members">会员管理</Link> },
  { key: '/trainers', icon: <TeamOutlined />, label: <Link href="/trainers">教练管理</Link> },
  { key: '/packages', icon: <IdcardOutlined />, label: <Link href="/packages">套餐管理</Link> },
  { key: '/cards/open', icon: <DollarOutlined />, label: <Link href="/cards/open">开卡收银</Link> },
  { key: '/appointments', icon: <CalendarOutlined />, label: <Link href="/appointments">私教预约</Link> },
  { key: '/access-logs', icon: <LoginOutlined />, label: <Link href="/access-logs">门禁记录</Link> },
  { key: '/presence', icon: <DashboardOutlined />, label: <Link href="/presence">实时人数</Link> }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const selectedKey = navItems.find((item) => pathname.startsWith(item.key))?.key ?? '/dashboard';

  useEffect(() => {
    if (!localStorage.getItem('ylf_token')) {
      router.push('/login');
    }
  }, [router]);

  function logout() {
    localStorage.removeItem('ylf_token');
    router.push('/login');
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider width={232} theme="light" style={{ borderRight: '1px solid #e5e9f2' }}>
        <div style={{ padding: 20 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            漾立方
          </Typography.Title>
          <Typography.Text type="secondary">健身房管理系统</Typography.Text>
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={navItems} />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            background: '#fff',
            borderBottom: '1px solid #e5e9f2',
            paddingInline: 24
          }}
        >
          <Button icon={<LogoutOutlined />} onClick={logout}>
            退出
          </Button>
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
