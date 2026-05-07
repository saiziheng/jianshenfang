import 'antd/dist/reset.css';
import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import { AntdReact19Patch } from '@/components/antd-react19-patch';
import { AppProvider } from '@/components/app-provider';

export const metadata: Metadata = {
  title: '漾立方健身房管理系统',
  description: '会员、私教、门禁、实时人数一体化管理后台'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdReact19Patch />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
