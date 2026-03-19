import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Link, Redirect } from 'react-router-dom';
import { Layout, Menu, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser, logout, refreshToken } from './actions/userActions';
import Login from './components/Login';
import Register from './components/Register';
import Quiz from './components/Quiz';
import Ranking from './components/Ranking';
import Admin from './components/Admin';
import UserSettings from './components/UserSettings';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Messages from './components/Messages';

const { Header, Content, Footer } = Layout;

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector(state => state.user);

  // 加载用户信息
  useEffect(() => {
    dispatch(loadUser());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动刷新token
  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const refreshInterval = setInterval(() => {
      dispatch(refreshToken());
    }, 12 * 60 * 60 * 1000); // 每12小时刷新一次

    return () => clearInterval(refreshInterval);
  }, [dispatch, isAuthenticated]);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Router>
      <Layout className="layout">
        <Header>
          <div className="logo" />
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
            <Menu.Item key="1">
              <Link to="/">首页</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/quiz">答题</Link>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/ranking">排行榜</Link>
            </Menu.Item>
            {isAuthenticated && user && user.role === 'admin' && (
              <Menu.Item key="4">
                <Link to="/admin">管理平台</Link>
              </Menu.Item>
            )}
            {isAuthenticated && user ? (
              <>
                <Menu.Item key={user.role === 'admin' ? "5" : "4"}>
                  <Link to="/settings">设置</Link>
                </Menu.Item>
                <Menu.Item key={user.role === 'admin' ? "6" : "5"} onClick={handleLogout}>
                  登出 ({user.username})
                </Menu.Item>
              </>
            ) : (
              <>
                <Menu.Item key="4">
                  <Link to="/login">登录</Link>
                </Menu.Item>
                <Menu.Item key="5">
                  <Link to="/register">注册</Link>
                </Menu.Item>
              </>
            )}
          </Menu>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <div className="site-layout-content">
            <Switch>
              <Route exact path="/">
                <HomePage />
              </Route>
              <PrivateRoute path="/quiz" isAuthenticated={isAuthenticated} isLoading={loading}>
                <Quiz />
              </PrivateRoute>
              <Route path="/ranking">
                <Ranking />
              </Route>
              <AdminRoute path="/admin" isAuthenticated={isAuthenticated} isLoading={loading} user={user}>
                <Admin />
              </AdminRoute>
              <PublicRoute path="/login" isAuthenticated={isAuthenticated} isLoading={loading}>
                <Login />
              </PublicRoute>
              <PublicRoute path="/register" isAuthenticated={isAuthenticated} isLoading={loading}>
                <Register />
              </PublicRoute>
              <Route path="/forgot-password">
                <ForgotPassword />
              </Route>
              <Route path="/reset-password/:token">
                <ResetPassword />
              </Route>
              <PrivateRoute path="/settings" isAuthenticated={isAuthenticated} isLoading={loading}>
                <UserSettings />
              </PrivateRoute>
            </Switch>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Cryptography Knowledge Quiz System ©2026
        </Footer>
      </Layout>
      {/* 消息通知组件 */}
      {isAuthenticated && <Messages />}
    </Router>
  );
}

function RouteLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
      <Spin size="large" />
    </div>
  );
}

function PrivateRoute({ children, isAuthenticated, isLoading, ...rest }) {
  return (
    <Route
      {...rest}
      render={() => {
        if (isLoading) {
          return <RouteLoading />;
        }

        return isAuthenticated ? children : <Redirect to="/login" />;
      }}
    />
  );
}

function PublicRoute({ children, isAuthenticated, isLoading, ...rest }) {
  return (
    <Route
      {...rest}
      render={() => {
        if (isLoading) {
          return <RouteLoading />;
        }

        return isAuthenticated ? <Redirect to="/" /> : children;
      }}
    />
  );
}

function AdminRoute({ children, isAuthenticated, isLoading, user, ...rest }) {
  return (
    <Route
      {...rest}
      render={() => {
        if (isLoading) {
          return <RouteLoading />;
        }

        if (!isAuthenticated) {
          return <Redirect to="/login" />;
        }

        return user && user.role === 'admin' ? children : <Redirect to="/" />;
      }}
    />
  );
}

// 首页组件
function HomePage() {
  return (
    <div style={{ padding: '24px', background: '#fff', minHeight: 380 }}>
      <h1>欢迎来到密码知识竞答系统</h1>
      <p>这是一个专注于密码学知识的在线答题平台，旨在普及密码学知识，提高安全意识。</p>
      <p>系统特点：</p>
      <ul>
        <li>丰富的密码学题库</li>
        <li>多种难度级别的题目</li>
        <li>实时排行榜</li>
        <li>定期举办竞赛活动</li>
      </ul>
    </div>
  );
}





export default App;
