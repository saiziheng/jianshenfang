'use client';

import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React, { useEffect } from 'react';

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Inter, "PingFang SC", "Microsoft YaHei", sans-serif';

export function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    message.config({
      top: 24,
      duration: 2,
      maxCount: 4
    });
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#007AFF',
          colorSuccess: '#34C759',
          colorWarning: '#FF9500',
          colorError: '#FF3B30',
          borderRadius: 8,
          borderRadiusLG: 14,
          fontSize: 14,
          fontFamily,
          colorBgLayout: '#F5F5F7',
          colorBgContainer: '#FFFFFF',
          colorBorder: '#E5E5EA',
          colorText: '#1D1D1F',
          colorTextSecondary: '#3C3C43',
          colorTextTertiary: '#8E8E93'
        },
        components: {
          Button: {
            controlHeight: 36,
            controlHeightLG: 44,
            fontWeight: 500,
            borderRadius: 8
          },
          Input: {
            controlHeight: 36,
            borderRadius: 8
          },
          InputNumber: {
            controlHeight: 36,
            borderRadius: 8
          },
          Select: {
            controlHeight: 36,
            borderRadius: 8
          },
          DatePicker: {
            controlHeight: 36,
            borderRadius: 8
          },
          Table: {
            rowHoverBg: '#FBFBFD',
            headerBg: 'transparent',
            headerColor: '#8E8E93',
            cellPaddingBlock: 10,
            cellPaddingInline: 16
          },
          Menu: {
            itemHeight: 36,
            itemBorderRadius: 8,
            itemSelectedBg: 'rgba(0,122,255,0.10)',
            itemSelectedColor: '#007AFF',
            itemHoverBg: 'rgba(0,0,0,0.04)'
          },
          Modal: {
            borderRadiusLG: 14
          },
          Drawer: {
            paddingLG: 24
          },
          Tag: {
            borderRadiusSM: 6
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
}
