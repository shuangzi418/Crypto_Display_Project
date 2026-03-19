import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Card, Space, InputNumber } from 'antd';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../axios';

const { TextArea } = Input;
const { Option } = Select;

const QuestionManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [form] = Form.useForm();
  const history = useHistory();
  const { isAuthenticated, user } = useSelector(state => state.user);

  // 检查用户是否是管理员
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      history.push('/');
    }
  }, [isAuthenticated, user, history]);

  // 获取题目列表
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/questions');
      setQuestions(response.data);
    } catch (error) {
      message.error('获取题目列表失败');
      console.error('获取题目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchQuestions();
  }, []);

  // 打开添加题目模态框
  const handleAddQuestion = () => {
    setIsEditMode(false);
    setCurrentQuestion(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑题目模态框
  const handleEditQuestion = (question) => {
    setIsEditMode(true);
    setCurrentQuestion(question);
    form.setFieldsValue({
      title: question.title,
      content: question.content,
      options: question.options,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      category: question.category,
      points: question.points
    });
    setIsModalVisible(true);
  };

  // 保存题目
  const handleSaveQuestion = async (values) => {
    try {
      setLoading(true);
      const { title, content, options, correctAnswer, difficulty, category, points } = values;
      
      const questionData = {
        title,
        content,
        options: options.split('\n').filter(opt => opt.trim() !== ''),
        correctAnswer: parseInt(correctAnswer),
        difficulty,
        category,
        points
      };

      if (isEditMode && currentQuestion) {
        await api.put(`/questions/${currentQuestion._id}`, questionData);
        message.success('题目更新成功');
      } else {
        await api.post('/questions', questionData);
        message.success('题目添加成功');
      }
      
      setIsModalVisible(false);
      fetchQuestions();
    } catch (error) {
      message.error('保存题目失败');
      console.error('保存题目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除题目
  const handleDeleteQuestion = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/questions/${id}`);
      message.success('题目删除成功');
      fetchQuestions();
    } catch (error) {
      message.error('删除题目失败');
      console.error('删除题目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 列配置
  const columns = [
    {
      title: '题目ID',
      dataIndex: '_id',
      key: '_id',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => {
        switch (difficulty) {
          case 'easy':
            return '简单';
          case 'medium':
            return '中等';
          case 'hard':
            return '困难';
          default:
            return difficulty;
        }
      },
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '分数',
      dataIndex: 'points',
      key: 'points',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => handleEditQuestion(record)}>
            编辑
          </Button>
          <Button danger size="small" onClick={() => handleDeleteQuestion(record._id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="题目管理" extra={<Button type="primary" onClick={handleAddQuestion}>添加题目</Button>}>
      <Table 
        columns={columns} 
        dataSource={questions} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={isEditMode ? "编辑题目" : "添加题目"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveQuestion}
        >
          <Form.Item
            label="题目标题"
            name="title"
            rules={[{ required: true, message: '请输入题目标题' }]}
          >
            <Input placeholder="请输入题目标题" />
          </Form.Item>

          <Form.Item
            label="题目内容"
            name="content"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea rows={4} placeholder="请输入题目内容" />
          </Form.Item>

          <Form.Item
            label="选项（每行一个选项）"
            name="options"
            rules={[{ required: true, message: '请输入选项' }]}
          >
            <TextArea rows={6} placeholder="请输入选项，每行一个选项" />
          </Form.Item>

          <Form.Item
            label="正确答案（选项索引，从0开始）"
            name="correctAnswer"
            rules={[{ required: true, message: '请输入正确答案的索引' }]}
          >
            <InputNumber placeholder="请输入正确答案的索引" />
          </Form.Item>

          <Form.Item
            label="难度"
            name="difficulty"
            rules={[{ required: true, message: '请选择难度' }]}
          >
            <Select placeholder="请选择难度">
              <Option value="easy">简单</Option>
              <Option value="medium">中等</Option>
              <Option value="hard">困难</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="类别"
            name="category"
            rules={[{ required: true, message: '请输入类别' }]}
          >
            <Input placeholder="请输入题目类别" />
          </Form.Item>

          <Form.Item
            label="分数"
            name="points"
            rules={[{ required: true, message: '请输入分数' }]}
          >
            <InputNumber placeholder="请输入分数" />
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

export default QuestionManagement;