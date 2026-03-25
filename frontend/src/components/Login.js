import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../actions/userActions';
import { Form, Input, Button, Card, Alert } from 'antd';
import { Link, useHistory } from 'react-router-dom';

const Login = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const history = useHistory();
  const { isAuthenticated, user } = useSelector(state => state.user);

  // 如果已经登录，统一回到用户侧首页
  useEffect(() => {
    if (isAuthenticated && user) {
      history.replace('/');
    }
  }, [isAuthenticated, user, history]);

  const onFinish = async (values) => {
    try {
      setError(null);
      await dispatch(login({ email: values.email, password: values.password }));
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <Card title="用户登录" style={{ width: 400 }}>
        {error && <Alert message={error} type="error" style={{ marginBottom: '20px' }} />}
        <Alert
          message="管理员请使用独立后台"
          description={<Link to="/admin-login">前往管理员登录入口</Link>}
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="on"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度至少为6位' }]}
          >
            <Input.Password placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            还没有账号？ <Link to="/register">立即注册</Link>
            <br />
            <Link to="/forgot-password">忘记密码？</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
