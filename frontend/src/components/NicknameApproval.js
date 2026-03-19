import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, message, Spin, Input } from 'antd';
import api from '../axios';

function NicknameApproval() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPendingNicknames = useCallback(async () => {
    try {
      setLoading(true);
      // 构建查询参数
      const params = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await api.get('/users/nickname/pending', { params });
      setUsers(response.data);
    } catch (error) {
      console.error('获取待审核昵称失败:', error);
      message.error('获取待审核昵称失败');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  async function handleApprove(userId, status) {
    try {
      await api.post('/users/nickname/approve', {
        userId: userId,
        status: status
      });
      message.success('审核成功');
      loadPendingNicknames();
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
    }
  }

  useEffect(() => {
    loadPendingNicknames();
  }, [loadPendingNicknames]);

  const columns = [
    {
      title: '用户ID',
      dataIndex: '_id',
      key: '_id'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '申请的昵称',
      dataIndex: 'nickname',
      key: 'nickname'
    },
    {
      title: '状态',
      dataIndex: 'nicknameStatus',
      key: 'nicknameStatus',
      render: function(status) {
        if (status === 'pending') return '审核中';
        if (status === 'approved') return '已通过';
        if (status === 'rejected') return '已拒绝';
        return status;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: function(_, record) {
        return (
          <div>
            <Button 
              type="primary" 
              style={{ marginRight: 8 }} 
              onClick={function() { handleApprove(record._id, 'approved'); }}
            >
              通过
            </Button>
            <Button 
              danger 
              onClick={function() { handleApprove(record._id, 'rejected'); }}
            >
              拒绝
            </Button>
          </div>
        );
      }
    }
  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }} />;
  }

  return (
    <div>
      <h2>昵称审核管理</h2>
      <p>以下是待审核的用户昵称列表</p>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Input.Search
          placeholder="搜索用户（用户名、昵称）"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={loadPendingNicknames}
          style={{ width: 300 }}
          enterButton
        />
      </div>
      
      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

export default NicknameApproval;
