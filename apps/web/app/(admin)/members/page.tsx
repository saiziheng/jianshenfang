'use client';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, Space, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ResourceTable } from '@/components/resource-table';
import { apiFetch } from '@/lib/api';

type Member = {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  status: string;
};

export default function MembersPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const endpoint = `/members?keyword=${encodeURIComponent(keyword)}${status ? `&status=${status}` : ''}`;

  async function create(values: { name: string; phone: string; gender?: string; note?: string }) {
    try {
      await apiFetch('/members', { method: 'POST', body: JSON.stringify(values) });
      message.success('会员已新增');
      setOpen(false);
      setKeyword(values.phone);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '新增失败');
    }
  }

  const columns = useMemo<ColumnsType<Member>>(
    () => [
      { title: '会员号', dataIndex: 'memberNo' },
      { title: '姓名', dataIndex: 'name' },
      { title: '手机', dataIndex: 'phone' },
      { title: '状态', dataIndex: 'status', render: (value) => <Tag color={value === 'ACTIVE' ? 'green' : 'red'}>{value}</Tag> },
      { title: '操作', render: (_, row) => <Link href={`/members/${row.id}`}>详情</Link> }
    ],
    []
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">会员管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          新增会员
        </Button>
      </div>
      <ResourceTable<Member>
        endpoint={endpoint}
        columns={columns}
        toolbar={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="姓名/手机/会员号"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <Select
              allowClear
              placeholder="会员状态"
              style={{ width: 140 }}
              value={status}
              onChange={setStatus}
              options={[
                { value: 'ACTIVE', label: '正常' },
                { value: 'FROZEN', label: '冻结' },
                { value: 'EXPIRED', label: '过期' },
                { value: 'BLACKLISTED', label: '黑名单' }
              ]}
            />
          </Space>
        }
      />
      <Modal title="新增会员" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={create}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select options={[{ value: '男' }, { value: '女' }]} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form>
      </Modal>
    </>
  );
}
