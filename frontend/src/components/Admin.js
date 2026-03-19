import React, { useEffect } from 'react';
import { Card, Layout, Menu } from 'antd';
import { Link, useRouteMatch, Switch, Route, useHistory } from 'react-router-dom';
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
  const { isAuthenticated, user } = useSelector(state => state.user);

  // 检查用户是否登录和是否是管理员
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      history.push('/');
    }
  }, [isAuthenticated, user, history]);

  return (
    <Layout style={{ minHeight: 600 }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <Menu
          mode="inline"
          defaultSelectedKeys={['1']}
          style={{ height: '100%', borderRight: 0 }}
        >
          <Menu.Item key="1">
            <Link to={`${url}/questions`}>题目管理</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to={`${url}/competitions`}>竞赛管理</Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to={`${url}/users`}>用户管理</Link>
          </Menu.Item>
          <Menu.Item key="4">
            <Link to={`${url}/nicknames`}>昵称审核</Link>
          </Menu.Item>
          <Menu.Item key="5">
            <Link to={`${url}/avatars`}>头像审核</Link>
          </Menu.Item>
        </Menu>
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