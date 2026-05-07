'use client';

import { Button, message } from 'antd';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type ToastPayload =
  | string
  | {
      message: string;
      actionLabel?: string;
      onAction?: () => void;
    };

function getContent(payload: ToastPayload): ReactNode {
  if (typeof payload === 'string') return payload;

  return (
    <>
      <span>{payload.message}</span>
      {payload.actionLabel && payload.onAction ? (
        <Button type="link" size="small" onClick={payload.onAction}>
          {payload.actionLabel}
        </Button>
      ) : null}
    </>
  );
}

export const toast = {
  success(payload: ToastPayload) {
    return message.open({
      type: 'success',
      className: 'app-toast app-toast-success',
      icon: <CheckCircle2 className="toast-icon" size={17} strokeWidth={1.75} color="var(--color-success)" />,
      content: getContent(payload),
      duration: 1.5
    });
  },
  warning(payload: ToastPayload) {
    return message.open({
      type: 'warning',
      className: 'app-toast app-toast-warning',
      icon: <AlertTriangle className="toast-icon" size={17} strokeWidth={1.75} color="var(--color-warning)" />,
      content: getContent(payload),
      duration: 2
    });
  },
  error(payload: ToastPayload) {
    const hasAction = typeof payload !== 'string' && payload.actionLabel && payload.onAction;

    return message.open({
      type: 'error',
      className: 'app-toast app-toast-error',
      icon: <XCircle className="toast-icon" size={17} strokeWidth={1.75} color="var(--color-danger)" />,
      content: getContent(payload),
      duration: hasAction ? 0 : 3
    });
  }
};
