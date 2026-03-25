import React from 'react';
import { Alert, Button, Card, Space, Typography } from 'antd';

const { Paragraph, Text, Title } = Typography;

const getAdminPortalBaseUrl = () => {
  const baseUrl = process.env.REACT_APP_ADMIN_PORTAL_URL || 'http://localhost:8081';
  return baseUrl.replace(/\/$/, '');
};

const AdminPortalEntry = () => {
  const adminPortalBaseUrl = getAdminPortalBaseUrl();
  const adminPortalLoginUrl = `${adminPortalBaseUrl}/login`;

  const handleOpenAdminPortal = () => {
    window.location.assign(adminPortalLoginUrl);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <Card style={{ width: 560 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 8 }}>管理员入口已分离</Title>
            <Paragraph style={{ marginBottom: 0 }}>
              普通前端仅保留参赛用户登录、答题、排行榜和个人设置。后台管理已迁移到独立的 RuoYi 管理门户。
            </Paragraph>
          </div>

          <Alert
            type="info"
            showIcon
            message="请使用独立后台登录"
            description={`当前管理员登录地址：${adminPortalLoginUrl}`}
          />

          <div>
            <Paragraph>
              <Text strong>适用范围：</Text>
              {' '}题目管理、竞赛创建、业务用户管理、昵称审核、头像审核。
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              <Text strong>环境变量：</Text>
              {' '}如需变更地址，可设置 `REACT_APP_ADMIN_PORTAL_URL`。
            </Paragraph>
          </div>

          <Space>
            <Button type="primary" onClick={handleOpenAdminPortal}>前往管理员登录</Button>
            <Button href="/login">返回用户登录</Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default AdminPortalEntry;
