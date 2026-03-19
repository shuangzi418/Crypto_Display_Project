import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, Select, Tabs } from 'antd';
import api from '../axios';

const { Option } = Select;
const { TabPane } = Tabs;

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [competitionRanking, setCompetitionRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载总排行榜
  const loadRanking = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/ranking');
      setRanking(res.data);
    } catch (error) {
      console.error('Error loading ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载竞赛列表
  const loadCompetitions = async () => {
    try {
      const res = await api.get('/competitions');
      setCompetitions(res.data);
    } catch (error) {
      console.error('Error loading competitions:', error);
    }
  };

  // 加载竞赛排行榜
  const loadCompetitionRanking = async (competitionId) => {
    try {
      setLoading(true);
      const res = await api.get(`/submissions/competition/${competitionId}/ranking`);
      setCompetitionRanking(res.data);
    } catch (error) {
      console.error('Error loading competition ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadRanking();
    loadCompetitions();
  }, []);

  // 当选择竞赛时，加载竞赛排行榜
  useEffect(() => {
    if (selectedCompetition) {
      loadCompetitionRanking(selectedCompetition);
    }
  }, [selectedCompetition]);

  // 总排行榜列
  const rankingColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
    },
    {
      title: '名称',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => {
        // 如果有昵称且已通过审核，显示昵称，否则显示用户名
        const displayName = record.nickname && record.nicknameStatus === 'approved' ? record.nickname : text;
        
        // 如果有头像且已通过审核，显示头像
        if (record.avatar && record.avatarStatus === 'approved') {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src={record.avatar} 
                alt={displayName} 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  marginRight: '8px' 
                }} 
              />
              {displayName}
            </div>
          );
        }
        return displayName;
      },
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
    },
  ];

  // 竞赛排行榜列
  const competitionRankingColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
    },
    {
      title: '名称',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => {
        // 如果有昵称且已通过审核，显示昵称，否则显示用户名
        const displayName = record.nickname && record.nicknameStatus === 'approved' ? record.nickname : text;
        
        // 如果有头像且已通过审核，显示头像
        if (record.avatar && record.avatarStatus === 'approved') {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src={record.avatar} 
                alt={displayName} 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  marginRight: '8px' 
                }} 
              />
              {displayName}
            </div>
          );
        }
        return displayName;
      },
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
    },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>排行榜</h1>
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="总排行榜" key="1">
          <Card>
            <Table 
              columns={rankingColumns} 
              dataSource={ranking} 
              rowKey="userId"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="竞赛排行榜" key="2">
          <Card>
            <div style={{ marginBottom: '20px' }}>
              <Select
                placeholder="选择竞赛"
                style={{ width: 300 }}
                onChange={setSelectedCompetition}
                value={selectedCompetition}
              >
                {competitions.map(competition => (
                  <Option key={competition._id} value={competition._id}>
                    {competition.title}
                  </Option>
                ))}
              </Select>
            </div>
            
            {selectedCompetition && (
              <Table 
                columns={competitionRankingColumns} 
                dataSource={competitionRanking} 
                rowKey="userId"
                pagination={{ pageSize: 10 }}
              />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Ranking;