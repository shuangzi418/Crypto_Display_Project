import React, { useEffect } from 'react';
import { Card, Layout, Menu } from 'antd';
import { Link, useRouteMatch, Switch, Route, useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import UserManagement from './UserManagement';
import CompetitionManagement from './CompetitionManagement';
import QuestionManagement from './QuestionManagement';
import NicknameApproval from './NicknameApproval';
import AvatarApproval from './AvatarApproval';

const { Content, Sider } = Layout;

const Admin = () => {
  const { path, url } = useRouteMatch();
  const history = useHistory();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector(state => state.user);

  // 检查用户是否登录和是否是管理员
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      history.push('/');
    }
  }, [isAuthenticated, user, history]);

  const getSelectedMenuKey = () => {
    if (location.pathname.includes('/competitions')) return 'competitions';
    if (location.pathname.includes('/users')) return 'users';
    if (location.pathname.includes('/nicknames')) return 'nicknames';
    if (location.pathname.includes('/avatars')) return 'avatars';
    return 'questions';
  };

  const menuItems = [
    {
      key: 'questions',
      label: <Link to={`${url}/questions`}>题目管理</Link>
    },
    {
      key: 'competitions',
      label: <Link to={`${url}/competitions`}>竞赛管理</Link>
    },
    {
      key: 'users',
      label: <Link to={`${url}/users`}>用户管理</Link>
    },
    {
      key: 'nicknames',
      label: <Link to={`${url}/nicknames`}>昵称审核</Link>
    },
    {
      key: 'avatars',
      label: <Link to={`${url}/avatars`}>头像审核</Link>
    }
  ];

  return (
    <Layout style={{ minHeight: 600 }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedMenuKey()]}
          items={menuItems}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ padding: '0 24px 24px' }}>
        <Content
          style={{
            background: '#fff',
            padding: 24,
            margin: 0,
            minHeight: 600,
          }}
        >
          <h1>管理员管理平台</h1>
          <p>欢迎使用密码知识竞答系统管理员管理平台</p>
          
          <Switch>
            <Route path={`${path}/questions`}>
              <QuestionManagement />
            </Route>
            <Route path={`${path}/users`}>
              <UserManagement />
            </Route>
            <Route path={`${path}/competitions`}>
              <CompetitionManagement />
            </Route>
            <Route path={`${path}/nicknames`}>
              <NicknameApproval />
            </Route>
            <Route path={`${path}/avatars`}>
              <AvatarApproval />
            </Route>
            <Route exact path={path}>
              <Card title="管理平台首页">
                <p>欢迎使用密码知识竞答系统管理员管理平台</p>
                <p>从左侧菜单选择您需要的管理功能</p>
              </Card>
            </Route>
          </Switch>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Admin;
