'use client';

import { Modal } from 'antd';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

type ConfirmDangerOptions = {
  title: string;
  content: ReactNode;
  okText?: string;
  onOk: () => void | Promise<void>;
};

export function confirmDanger({ title, content, okText = '确认', onOk }: ConfirmDangerOptions) {
  Modal.confirm({
    title,
    content,
    width: 400,
    centered: true,
    className: 'danger-confirm',
    icon: <AlertTriangle size={20} strokeWidth={1.75} color="var(--color-danger)" />,
    okText,
    cancelText: '取消',
    okButtonProps: {
      danger: true,
      type: 'primary'
    },
    cancelButtonProps: {
      type: 'default'
    },
    onOk
  });
}
