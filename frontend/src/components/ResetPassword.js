import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, message } from 'antd';
import { useHistory, useParams } from 'react-router-dom';
import api from '../axios';

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const history = useHistory();
  const { token } = useParams();

  useEffect(() => {
    // 检查token是否存在
    if (!token) {
      setTokenValid(false);
      setError('无效的重置链接');
    }
  }, [token]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/users/reset-password', { 
        token, 
        password: values.password 
      });
      
      setSuccess(true);
      message.success('密码重置成功');
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        history.push('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || '密码重置失败，请稍后重试');
      message.error('密码重置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <Card title="重置密码" style={{ width: 400 }}>
          <Alert message="无效的重置链接" type="error" />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/forgot-password">重新获取重置链接</a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <Card title="重置密码" style={{ width: 400 }}>
        {error && <Alert message={error} type="error" style={{ marginBottom: '20px' }} />}
        {success && <Alert message="密码重置成功" type="success" style={{ marginBottom: '20px' }} />}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="password"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码长度至少为6位' }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%' }}
              loading={loading}
            >
              重置密码
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

export default ResetPassword;