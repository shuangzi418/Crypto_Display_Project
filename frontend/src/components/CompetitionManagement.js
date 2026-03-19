import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, DatePicker, Input, Select, message, Card, Space, Checkbox, Badge } from 'antd';
import api from '../axios';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CompetitionManagement = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCompetition, setCurrentCompetition] = useState(null);
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [randomCount, setRandomCount] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // 获取竞赛列表
  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      // 构建查询参数
      const params = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await api.get('/competitions', { params });
      setCompetitions(response.data);
    } catch (error) {
      message.error('获取竞赛列表失败');
      console.error('获取竞赛列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // 获取题目列表
  const fetchQuestions = useCallback(async () => {
    try {
      const response = await api.get('/questions');
      setQuestions(response.data);
    } catch (error) {
      message.error('获取题目列表失败');
      console.error('获取题目列表失败:', error);
    }
  }, []);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchCompetitions();
    fetchQuestions();
  }, [fetchCompetitions, fetchQuestions]);

  // 计算总分
  useEffect(() => {
    if (selectedQuestions.length > 0) {
      const total = selectedQuestions.reduce((sum, questionId) => {
        const question = questions.find(q => q._id === questionId);
        return sum + (question ? question.points : 0);
      }, 0);
      setTotalPoints(total);
    } else {
      setTotalPoints(0);
    }
  }, [selectedQuestions, questions]);

  // 确保选中的题目数量不超过题库总数
  useEffect(() => {
    if (questions.length > 0 && selectedQuestions.length > questions.length) {
      const validQuestions = selectedQuestions.slice(0, questions.length);
      setSelectedQuestions(validQuestions);
      form.setFieldsValue({ questions: validQuestions });
    }
  }, [questions, selectedQuestions, form]);

  // 打开添加竞赛模态框
  const handleAddCompetition = () => {
    setIsEditMode(false);
    setCurrentCompetition(null);
    setSelectedQuestions([]);
    setRandomCount(10);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑竞赛模态框
  const handleEditCompetition = (competition) => {
    try {
      setIsEditMode(true);
      setCurrentCompetition(competition);
      // 处理questions可能是对象数组或字符串ID数组的情况
      let questionIds = [];
      if (competition.questions && Array.isArray(competition.questions)) {
        if (competition.questions.length > 0) {
          // 检查第一个元素的类型
          if (typeof competition.questions[0] === 'object' && competition.questions[0] !== null) {
            // 如果是对象数组，提取_id
            questionIds = competition.questions.map(q => q._id || q);
          } else {
            // 如果已经是ID数组，直接使用
            questionIds = competition.questions;
          }
        }
      }
      setSelectedQuestions(questionIds);
      setRandomCount(10);
      
      const startDate = competition.startDate ? moment(competition.startDate) : null;
      const endDate = competition.endDate ? moment(competition.endDate) : null;
      
      form.setFieldsValue({
        title: competition.title || '',
        description: competition.description || '',
        startDate: startDate && endDate ? [startDate, endDate] : [],
        questions: questionIds,
        status: competition.status || 'upcoming'
      });
      setIsModalVisible(true);
    } catch (error) {
      console.error('编辑竞赛失败:', error);
      message.error('编辑竞赛失败，请重试');
    }
  };



  // 保存竞赛
  const handleSaveCompetition = async (values) => {
    try {
      setLoading(true);
      const { title, description, startDate, questions, status } = values;
      
      if (questions.length === 0) {
        message.error('请至少选择一道题目');
        return;
      }
      
      const competitionData = {
        title,
        description,
        startDate: startDate[0].toISOString(),
        endDate: startDate[1].toISOString(),
        questions,
        status,
        totalPoints: totalPoints
      };

      if (isEditMode && currentCompetition) {
        await api.put(`/competitions/${currentCompetition._id}`, competitionData);
        message.success('竞赛更新成功');
      } else {
        await api.post('/competitions', competitionData);
        message.success('竞赛添加成功');
      }
      
      setIsModalVisible(false);
      fetchCompetitions();
    } catch (error) {
      message.error('保存竞赛失败');
      console.error('保存竞赛失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除竞赛
  const handleDeleteCompetition = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/competitions/${id}`);
      message.success('竞赛删除成功');
      fetchCompetitions();
    } catch (error) {
      message.error('删除竞赛失败');
      console.error('删除竞赛失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 列配置
  const columns = [
    {
      title: '竞赛ID',
      dataIndex: '_id',
      key: '_id',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '开始时间',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (startDate) => new Date(startDate).toLocaleString(),
    },
    {
      title: '结束时间',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (endDate) => new Date(endDate).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        switch (status) {
          case 'upcoming':
            return '即将开始';
          case 'active':
            return '进行中';
          case 'ended':
            return '已结束';
          default:
            return status;
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => handleEditCompetition(record)}>
            编辑
          </Button>
          <Button danger size="small" onClick={() => handleDeleteCompetition(record._id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="竞赛管理" extra={<Button type="primary" onClick={handleAddCompetition}>添加竞赛</Button>}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Input.Search
          placeholder="搜索竞赛（标题、描述）"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={fetchCompetitions}
          style={{ width: 300 }}
          enterButton
        />
      </div>
      <Table 
        columns={columns} 
        dataSource={competitions} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={isEditMode ? "编辑竞赛" : "添加竞赛"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveCompetition}
        >
          <Form.Item
            label="竞赛标题"
            name="title"
            rules={[{ required: true, message: '请输入竞赛标题' }]}
          >
            <Input placeholder="请输入竞赛标题" />
          </Form.Item>

          <Form.Item
            label="竞赛描述"
            name="description"
            rules={[{ required: true, message: '请输入竞赛描述' }]}
          >
            <TextArea rows={4} placeholder="请输入竞赛描述" />
          </Form.Item>

          <Form.Item
            label="时间范围"
            name="startDate"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label={`题目 (已选择 ${selectedQuestions.length} 道，总分 ${totalPoints} 分)`}
            name="questions"
            rules={[{ required: true, message: '请选择题目' }]}
          >
            <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Input 
                type="number" 
                min="1" 
                max={questions.length > 0 ? questions.length : 1} 
                value={randomCount} 
                onChange={(e) => setRandomCount(parseInt(e.target.value) || 0)}
                style={{ width: '100px' }}
              />
              <Button 
                type="dashed" 
                onClick={() => {
                  let count = randomCount || 10;
                  
                  if (questions.length === 0) {
                    message.error('题库中没有题目');
                    return;
                  }
                  
                  // 确保数量不超过题库总数
                  if (count > questions.length) {
                    message.error(`题目数量不能超过题库总数 ${questions.length} 道`);
                    count = questions.length;
                    setRandomCount(count);
                  }
                  
                  if (count <= 0) {
                    message.error('请输入有效的题目数量');
                    return;
                  }
                  
                  const shuffled = [...questions].sort(() => 0.5 - Math.random());
                  const randomQuestions = shuffled.slice(0, count).map(q => q._id);
                  setSelectedQuestions(randomQuestions);
                  form.setFieldsValue({ questions: randomQuestions });
                }}
              >
                随机抽题
              </Button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '10px' }}>
              {questions.map(question => (
                <div key={question._id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <Checkbox 
                      checked={selectedQuestions.includes(question._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions([...selectedQuestions, question._id]);
                          form.setFieldsValue({ questions: [...selectedQuestions, question._id] });
                        } else {
                          const newSelected = selectedQuestions.filter(id => id !== question._id);
                          setSelectedQuestions(newSelected);
                          form.setFieldsValue({ questions: newSelected });
                        }
                      }}
                    />
                    <Badge count={question.points} style={{ backgroundColor: '#52c41a' }} />
                  </div>
                  <div style={{ marginLeft: '24px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{question.title}</div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{question.content}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      <div>选项: {question.options.join(' | ')}</div>
                      <div>正确答案: {question.options[question.correctAnswer]}</div>
                      <div>难度: {question.difficulty === 'easy' ? '简单' : question.difficulty === 'medium' ? '中等' : '困难'}</div>
                      <div>类别: {question.category}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            initialValue="upcoming"
          >
            <Select placeholder="请选择状态">
              <Option value="upcoming">即将开始</Option>
              <Option value="active">进行中</Option>
              <Option value="ended">已结束</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
              >
                保存
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CompetitionManagement;
