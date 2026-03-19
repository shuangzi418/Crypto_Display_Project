import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Select, message, Card, Input } from 'antd';
import api from '../axios';

const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // 构建查询参数
      const params = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await api.get('/users', { params });
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // 组件挂载时获取用户列表
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 打开编辑角色模态框
  const handleEditRole = (user) => {
    setCurrentUser(user);
    form.setFieldsValue({ role: user.role });
    setIsModalVisible(true);
  };

  // 保存角色修改
  const handleSaveRole = async (values) => {
    try {
      setLoading(true);
      await api.put(`/users/${currentUser._id}/role`, { role: values.role });
      message.success('角色修改成功');
      setIsModalVisible(false);
      fetchUsers(); // 重新获取用户列表
    } catch (error) {
      message.error('角色修改失败');
      console.error('角色修改失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 列配置
  const columns = [
    {
      title: '用户ID',
      dataIndex: '_id',
      key: '_id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (role === 'admin' ? '管理员' : '普通用户'),
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) => new Date(createdAt).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => handleEditRole(record)}
        >
          修改角色
        </Button>
      ),
    },
  ];

  return (
    <Card title="用户管理">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Input.Search
          placeholder="搜索用户（用户名、邮箱）"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={fetchUsers}
          style={{ width: 300 }}
          enterButton
        />
      </div>
      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="修改用户角色"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRole}
        >
          <Form.Item
            label="用户名"
            name="username"
            initialValue={currentUser?.username}
          >
            <input type="text" disabled style={{ width: '100%', padding: '8px' }} />
          </Form.Item>

          <Form.Item
            label="当前角色"
            name="currentRole"
            initialValue={currentUser?.role === 'admin' ? '管理员' : '普通用户'}
          >
            <input type="text" disabled style={{ width: '100%', padding: '8px' }} />
          </Form.Item>

          <Form.Item
            label="新角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="user">普通用户</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ marginRight: 8 }}
            >
              保存
            </Button>
            <Button onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;
