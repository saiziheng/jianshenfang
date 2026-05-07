'use client';

import { Avatar, Button, Dropdown, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  CalendarClock,
  ChevronDown,
  CreditCard,
  DoorOpen,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  User,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

const iconProps = { size: 20, strokeWidth: 1.75 };

const navItems = [
  { key: '/dashboard', icon: <LayoutDashboard {...iconProps} className="nav-icon" />, title: '工作台', label: <Link href="/dashboard">工作台</Link> },
  { key: '/members', icon: <User {...iconProps} className="nav-icon" />, title: '会员管理', label: <Link href="/members">会员管理</Link> },
  { key: '/trainers', icon: <Users {...iconProps} className="nav-icon" />, title: '教练管理', label: <Link href="/trainers">教练管理</Link> },
  { key: '/packages', icon: <Package {...iconProps} className="nav-icon" />, title: '套餐管理', label: <Link href="/packages">套餐管理</Link> },
  { key: '/cards/open', icon: <CreditCard {...iconProps} className="nav-icon" />, title: '开卡收银', label: <Link href="/cards/open">开卡收银</Link> },
  { key: '/appointments', icon: <CalendarClock {...iconProps} className="nav-icon" />, title: '私教预约', label: <Link href="/appointments">私教预约</Link> },
  { key: '/access-logs', icon: <DoorOpen {...iconProps} className="nav-icon" />, title: '门禁记录', label: <Link href="/access-logs">门禁记录</Link> },
  { key: '/presence', icon: <ReceiptText {...iconProps} className="nav-icon" />, title: '实时人数', label: <Link href="/presence">实时人数</Link> }
];

type AdminUser = {
  name?: string;
  role?: string;
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser>({});
  const selectedKey = navItems.find((item) => pathname.startsWith(item.key))?.key ?? '/dashboard';
  const currentItem = navItems.find((item) => item.key === selectedKey) ?? navItems[0];

  useEffect(() => {
    if (!localStorage.getItem('ylf_token')) {
      router.push('/login');
      return;
    }

    const rawAdmin = localStorage.getItem('ylf_admin');
    if (rawAdmin) {
      setAdmin(JSON.parse(rawAdmin) as AdminUser);
    }
  }, [router]);

  function logout() {
    localStorage.removeItem('ylf_token');
    localStorage.removeItem('ylf_admin');
    router.push('/login');
  }

  const userMenu = useMemo<MenuProps['items']>(
    () => [
      {
        key: 'logout',
        icon: <LogOut size={16} strokeWidth={1.75} />,
        label: '退出登录',
        onClick: logout
      }
    ],
    []
  );

  return (
    <Layout className="admin-shell">
      <Layout.Sider width={220} theme="light" className="admin-sidebar">
        <Link href="/dashboard" className="admin-logo" aria-label="漾立方工作台">
          <span className="admin-logo-mark">
            <Dumbbell size={17} strokeWidth={1.75} />
          </span>
          <span>
            <span className="admin-logo-title">漾立方</span>
            <span className="admin-logo-subtitle">健身房后台</span>
          </span>
        </Link>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={navItems} className="admin-nav" />
      </Layout.Sider>
      <Layout className="admin-main">
        <Layout.Header className="admin-topbar">
          <div>
            <div className="topbar-breadcrumb">漾立方 / {currentItem.title}</div>
            <div className="topbar-title">{currentItem.title}</div>
          </div>
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <Button>
              <Avatar size={24} style={{ background: 'var(--color-accent)' }}>
                {(admin.name ?? '管').slice(0, 1)}
              </Avatar>
              {admin.name ?? '管理员'}
              <ChevronDown size={15} strokeWidth={1.75} />
            </Button>
          </Dropdown>
        </Layout.Header>
        <Layout.Content className="admin-content">{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
