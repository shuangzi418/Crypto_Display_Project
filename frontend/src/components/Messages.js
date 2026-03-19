import React, { useState, useEffect } from 'react';
import { List, Badge, Button, Empty, Modal } from 'antd';
import api from '../axios';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // 加载消息列表
  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages');
      setMessages(res.data);
      // 计算未读消息数量
      const count = res.data.filter(msg => !msg.isRead).length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记消息为已读
  const markAsRead = async (messageId) => {
    try {
      await api.put(`/messages/${messageId}/read`);
      // 更新本地消息状态
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // 删除消息
  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      // 从本地消息列表中移除
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== messageId)
      );
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // 初始加载
  useEffect(() => {
    loadMessages();
  }, []);

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 处理清理所有消息
  const handleCleanAll = async () => {
    try {
      await api.delete('/messages');
      setMessages([]);
      setUnreadCount(0);
      setConfirmModalVisible(false);
    } catch (error) {
      console.error('Error deleting all messages:', error);
    }
  };

  // 消息列表内容
  const messageContent = (
    <div style={{ width: 400, maxHeight: 400, overflowY: 'auto' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
      ) : messages.length === 0 ? (
        <Empty description="暂无消息" style={{ padding: '20px 0' }} />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={messages}
          renderItem={message => (
            <List.Item
              key={message._id}
              extra={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => markAsRead(message._id)}
                    disabled={message.isRead}
                  >
                    {message.isRead ? '已读' : '标记已读'}
                  </Button>
                  <Button 
                    type="link" 
                    size="small"
                    danger 
                    onClick={() => deleteMessage(message._id)}
                  >
                    删除
                  </Button>
                </div>
              }
              style={{ borderBottom: '1px solid #f0f0f0', padding: '12px 0' }}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: message.isRead ? 'normal' : 'bold', fontSize: '14px' }}>
                      {message.title}
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                }
                description={
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    {message.content}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 9999 }}>
      {!isVisible ? (
        <Badge count={unreadCount > 0 ? unreadCount : 0} showZero={false}>
          <Button 
            type="primary" 
            shape="circle" 
            size="large"
            onClick={() => setIsVisible(true)}
            style={{ 
              width: '60px', 
              height: '60px', 
              fontSize: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            💬
          </Button>
        </Badge>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            right: '70px', 
            bottom: '0',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '16px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>系统消息</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {messages.length > 0 && (
                  <Button 
                    type="link" 
                    size="small" 
                    danger
                    onClick={() => setConfirmModalVisible(true)}
                  >
                    清理所有
                  </Button>
                )}
                <Button 
                  type="text" 
                  size="small" 
                  onClick={() => setIsVisible(false)}
                  style={{ color: '#999' }}
                >
                  关闭
                </Button>
              </div>
            </div>
            {messageContent}
          </div>
        </div>
      )}
      
      {/* 清理所有消息确认弹窗 */}
      <Modal
        title="确认清理"
        open={confirmModalVisible}
        onOk={handleCleanAll}
        onCancel={() => setConfirmModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <p>确定要清理所有消息吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default Messages;
