import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Link, Redirect, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser, logout, refreshToken } from './actions/userActions';
import Login from './components/Login';
import Register from './components/Register';
import Quiz from './components/Quiz';
import Ranking from './components/Ranking';
import AdminPortalEntry from './components/AdminPortalEntry';
import UserSettings from './components/UserSettings';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Messages from './components/Messages';
import MobileNationalSecurityChallenge from './components/MobileNationalSecurityChallenge';

const { Header, Content, Footer } = Layout;

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

function AppShell() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector(state => state.user);
  const location = useLocation();
  const h5Hosts = (process.env.REACT_APP_H5_HOSTS || '')
    .split(',')
    .map(host => host.trim())
    .filter(Boolean);
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDedicatedH5Host = h5Hosts.includes(currentHost);
  const isH5Route = location.pathname.startsWith('/h5/') || isDedicatedH5Host;

  // 加载用户信息
  useEffect(() => {
    if (isH5Route) {
      return;
    }

    dispatch(loadUser());
  }, [dispatch, isH5Route]);

  // 自动刷新token
  useEffect(() => {
    if (isH5Route || !isAuthenticated) {
      return undefined;
    }

    const refreshInterval = setInterval(() => {
      dispatch(refreshToken());
    }, 12 * 60 * 60 * 1000); // 每12小时刷新一次

    return () => clearInterval(refreshInterval);
  }, [dispatch, isAuthenticated, isH5Route]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const getSelectedMenuKey = () => {
    if (location.pathname.startsWith('/quiz')) return 'quiz';
    if (location.pathname.startsWith('/ranking')) return 'ranking';
    if (location.pathname.startsWith('/settings')) return 'settings';
    if (location.pathname.startsWith('/login')) return 'login';
    if (location.pathname.startsWith('/register')) return 'register';
    return 'home';
  };

  const menuItems = [
    {
      key: 'home',
      label: <Link to="/">首页</Link>
    },
    {
      key: 'quiz',
      label: <Link to="/quiz">答题</Link>
    },
    {
      key: 'ranking',
      label: <Link to="/ranking">排行榜</Link>
    }
  ];

  if (isAuthenticated && user) {
    menuItems.push(
      {
        key: 'settings',
        label: <Link to="/settings">设置</Link>
      },
      {
        key: 'logout',
        label: `登出 (${user.username})`,
        onClick: handleLogout
      }
    );
  } else {
    menuItems.push(
      {
        key: 'login',
        label: <Link to="/login">登录</Link>
      },
      {
        key: 'register',
        label: <Link to="/register">注册</Link>
      }
    );
  }

  const routes = (
    <Switch>
      {isDedicatedH5Host ? (
        <>
          <Route exact path="/">
            <MobileNationalSecurityChallenge />
          </Route>
          <Route path="/h5/national-security-challenge">
            <Redirect to="/" />
          </Route>
        </>
      ) : (
        <>
          <Route path="/h5/national-security-challenge">
            <MobileNationalSecurityChallenge />
          </Route>
          <Route exact path="/">
            <HomePage />
          </Route>
        </>
      )}
      <PrivateRoute path="/quiz" isAuthenticated={isAuthenticated} isLoading={loading}>
        <Quiz />
      </PrivateRoute>
      <Route path="/ranking">
        <Ranking />
      </Route>
      <Route path="/admin-login">
        <AdminPortalEntry />
      </Route>
      <Route path="/admin">
        <Redirect to="/admin-login" />
      </Route>
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
  );

  if (isH5Route) {
    return routes;
  }

  return (
    <Layout className="layout">
      <Header>
        <div className="logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[getSelectedMenuKey()]}
          items={menuItems}
        />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          {routes}
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Cryptography Knowledge Quiz System ©2026
      </Footer>
      {isAuthenticated && <Messages />}
    </Layout>
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

// 首页组件
function HomePage() {
  return (
    <div style={{ padding: '24px', background: '#fff', minHeight: 380 }}>
      <h1>欢迎来到密码知识竞答系统</h1>
      <p>这是一个专注于密码学知识的在线答题平台，旨在普及密码学知识，提高安全意识。</p>
      <p>
        当前站点仅保留参赛用户入口，管理员请使用
        {' '}
        <Link to="/admin-login">独立后台入口</Link>
        。
      </p>
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
