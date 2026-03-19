import React, { useState } from 'react';
import { Form, Input, Button, Card, Alert, message } from 'antd';
import { useHistory } from 'react-router-dom';
import api from '../axios';

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const history = useHistory();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/users/forgot-password', { email: values.email });
      
      setSuccess(true);
      message.success('密码重置邮件已发送，请查收邮箱');
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        history.push('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || '发送邮件失败，请稍后重试');
      message.error('发送邮件失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <Card title="忘记密码" style={{ width: 400 }}>
        {error && <Alert message={error} type="error" style={{ marginBottom: '20px' }} />}
        {success && <Alert message="密码重置邮件已发送，请查收邮箱" type="success" style={{ marginBottom: '20px' }} />}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入注册时使用的邮箱" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%' }}
              loading={loading}
            >
              发送重置邮件
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <a href="/login">返回登录</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPassword;