'use client';

import { unstableSetRender } from 'antd';
import { createRoot, type Root } from 'react-dom/client';

type AntdContainer = Element & {
  __antdRoot?: Root;
};

// Official Ant Design fallback for React 19 when staying on antd v5.
unstableSetRender((node, container) => {
  const target = container as AntdContainer;
  target.__antdRoot ??= createRoot(target);

  target.__antdRoot.render(node);

  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    target.__antdRoot?.unmount();
    target.__antdRoot = undefined;
  };
});

export function AntdReact19Patch() {
  return null;
}
