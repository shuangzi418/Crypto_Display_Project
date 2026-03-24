import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../actions/userActions';
import { Form, Input, Button, Card, Alert } from 'antd';
import { Link, useHistory } from 'react-router-dom';

const Register = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const history = useHistory();
  const { isAuthenticated } = useSelector(state => state.user);

  useEffect(() => {
    if (isAuthenticated) {
      history.replace('/');
    }
  }, [history, isAuthenticated]);

  const onFinish = async (values) => {
    try {
      setError(null);
      await dispatch(register({ username: values.username, email: values.email, password: values.password }));
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <Card title="注册" style={{ width: 400 }}>
        {error && <Alert message={error} type="error" style={{ marginBottom: '20px' }} />}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="on"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" autoComplete="username" />
          </Form.Item>

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
            <Input.Password placeholder="请输入密码" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('两次输入的密码不一致');
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认密码" autoComplete="new-password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            已有账号？ <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
