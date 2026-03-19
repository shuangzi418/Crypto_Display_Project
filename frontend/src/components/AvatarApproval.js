import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, message, Spin, Modal, Input } from 'antd';
import api from '../axios';

function AvatarApproval() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadPendingAvatars = useCallback(async () => {
    try {
      setLoading(true);
      // 构建查询参数
      const params = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await api.get('/users/avatar/pending', { params });
      setUsers(response.data);
    } catch (error) {
      console.error('获取待审核头像失败:', error);
      message.error('获取待审核头像失败');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  async function handleApprove(userId, status) {
    try {
      await api.post('/users/avatar/approve', {
        userId: userId,
        status: status
      });
      message.success('审核成功');
      loadPendingAvatars();
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
    }
  }

  useEffect(() => {
    loadPendingAvatars();
  }, [loadPendingAvatars]);

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
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      render: function(avatar) {
        if (avatar) {
          return (
            <div>
              <img 
                src={avatar} 
                alt="用户头像" 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setPreviewAvatar(avatar);
                  setPreviewVisible(true);
                }}
              />
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                点击查看大图
              </div>
            </div>
          );
        }
        return '无头像';
      }
    },
    {
      title: '状态',
      dataIndex: 'avatarStatus',
      key: 'avatarStatus',
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
      <h2>头像审核管理</h2>
      <p>以下是待审核的用户头像列表</p>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Input.Search
          placeholder="搜索用户（用户名）"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={loadPendingAvatars}
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
      
      {/* 头像预览模态框 */}
      <Modal
        title="头像大图预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <img 
            src={previewAvatar} 
            alt="头像大图" 
            style={{ maxWidth: '100%', maxHeight: '500px' }}
          />
        </div>
      </Modal>
    </div>
  );
}

export default AvatarApproval;
