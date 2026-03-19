import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getQuestions } from '../actions/questionActions';
import { submitAnswer } from '../actions/submissionActions';
import { getCompetitions } from '../actions/competitionActions';
import { Form, Button, Card, Radio, Alert, Spin, Tabs, Descriptions } from 'antd';
import { useHistory } from 'react-router-dom';

const { TabPane } = Tabs;

const Quiz = () => {
  const [form] = Form.useForm();
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [competitionQuestions, setCompetitionQuestions] = useState([]);
  const [currentCompetitionQuestion, setCurrentCompetitionQuestion] = useState(null);
  const dispatch = useDispatch();
  const history = useHistory();
  const { isAuthenticated } = useSelector(state => state.user);
  const { questions, loading: questionsLoading } = useSelector(state => state.question);
  const { competitions, loading: competitionsLoading } = useSelector(state => state.competition);
  const { currentSubmission } = useSelector(state => state.submission);

  // 如果未登录，跳转到登录页面
  useEffect(() => {
    if (!isAuthenticated) {
      history.push('/login');
    }
  }, [isAuthenticated, history]);

  // 加载练习题目
  useEffect(() => {
    dispatch(getQuestions({ limit: 20 }));
  }, [dispatch]);

  // 加载竞赛列表
  useEffect(() => {
    dispatch(getCompetitions({ status: 'active' }));
  }, [dispatch]);

  // 当提交答案后，显示结果
  useEffect(() => {
    if (currentSubmission) {
      setResult({
        isCorrect: currentSubmission.submission.isCorrect,
        correctAnswer: currentSubmission.correctAnswer,
        points: currentSubmission.points
      });
    }
  }, [currentSubmission]);

  // 选择题目
  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setAnswer(null);
    setResult(null);
    form.resetFields();
  };

  // 提交答案
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      dispatch(submitAnswer(selectedQuestion._id, answer));
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // 随机选择题目
  const handleRandomQuestion = () => {
    if (questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      handleQuestionSelect(questions[randomIndex]);
    }
  };

  // 选择竞赛
  const handleCompetitionSelect = (competition) => {
    setSelectedCompetition(competition);
    setCompetitionQuestions(competition.questions || []);
    setCurrentCompetitionQuestion(null);
    setAnswer(null);
    setResult(null);
    form.resetFields();
  };

  // 选择竞赛题目
  const handleCompetitionQuestionSelect = (question) => {
    setCurrentCompetitionQuestion(question);
    setAnswer(null);
    setResult(null);
    form.resetFields();
  };

  // 提交竞赛答案
  const handleCompetitionSubmit = async () => {
    try {
      await form.validateFields();
      dispatch(submitAnswer(currentCompetitionQuestion._id, answer));
    } catch (error) {
      console.error('Error submitting competition answer:', error);
    }
  };

  if (questionsLoading || competitionsLoading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>答题中心</h1>
      
      <Tabs defaultActiveKey="practice" style={{ marginBottom: '20px' }}>
        {/* 练习板块 */}
        <TabPane tab="练习板块" key="practice">
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <Button type="primary" onClick={handleRandomQuestion}>
                随机出题
              </Button>
            </div>
            
            <h3>练习模式</h3>
            <p>点击上方按钮随机获取题目进行练习</p>
          </Card>

          {selectedQuestion && (
            <Card title={selectedQuestion.title}>
              <p>{selectedQuestion.content}</p>
              
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="answer"
                  rules={[{ required: true, message: '请选择答案' }]}
                >
                  <Radio.Group onChange={(e) => setAnswer(e.target.value)}>
                    {selectedQuestion.options.map((option, index) => (
                      <Radio key={index} value={index}>
                        {option}
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    提交答案
                  </Button>
                </Form.Item>
              </Form>

              {result && (
                <Alert
                  message={result.isCorrect ? '回答正确！' : '回答错误！'}
                  description={result.isCorrect ? 
                    `恭喜你获得 ${result.points} 分！` : 
                    `正确答案是：${selectedQuestion.options[result.correctAnswer]}`
                  }
                  type={result.isCorrect ? 'success' : 'error'}
                  showIcon
                />
              )}
            </Card>
          )}
        </TabPane>

        {/* 竞赛板块 */}
        <TabPane tab="竞赛板块" key="competition">
          <Card style={{ marginBottom: '20px' }}>
            <h3>当前竞赛</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {competitions.length > 0 ? (
                competitions.map(competition => (
                  <Card 
                    key={competition._id} 
                    style={{ marginBottom: '10px', cursor: 'pointer' }}
                    onClick={() => handleCompetitionSelect(competition)}
                    bordered={selectedCompetition?._id === competition._id}
                  >
                    <Descriptions size="small">
                      <Descriptions.Item label="竞赛名称">{competition.title}</Descriptions.Item>
                      <Descriptions.Item label="状态">{competition.status}</Descriptions.Item>
                      <Descriptions.Item label="开始时间">{new Date(competition.startDate).toLocaleString()}</Descriptions.Item>
                      <Descriptions.Item label="结束时间">{new Date(competition.endDate).toLocaleString()}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                ))
              ) : (
                <p>当前没有活跃的竞赛</p>
              )}
            </div>
          </Card>

          {selectedCompetition && (
            <div>
              <Card title={`竞赛：${selectedCompetition.title}`}>
                <p>{selectedCompetition.description}</p>
                
                <h4>竞赛题目</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                  {competitionQuestions.map(question => (
                    <Card 
                      key={question._id} 
                      style={{ marginBottom: '10px', cursor: 'pointer' }}
                      onClick={() => handleCompetitionQuestionSelect(question)}
                      bordered={currentCompetitionQuestion?._id === question._id}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{question.title}</span>
                        <span>{question.points} 分</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>

              {currentCompetitionQuestion && (
                <Card title={currentCompetitionQuestion.title}>
                  <p>{currentCompetitionQuestion.content}</p>
                  
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCompetitionSubmit}
                  >
                    <Form.Item
                      name="answer"
                      rules={[{ required: true, message: '请选择答案' }]}
                    >
                      <Radio.Group onChange={(e) => setAnswer(e.target.value)}>
                        {currentCompetitionQuestion.options.map((option, index) => (
                          <Radio key={index} value={index}>
                            {option}
                          </Radio>
                        ))}
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        提交答案
                      </Button>
                    </Form.Item>
                  </Form>

                  {result && (
                    <Alert
                      message={result.isCorrect ? '回答正确！' : '回答错误！'}
                      description={result.isCorrect ? 
                        `恭喜你获得 ${result.points} 分！` : 
                        `正确答案是：${currentCompetitionQuestion.options[result.correctAnswer]}`
                      }
                      type={result.isCorrect ? 'success' : 'error'}
                      showIcon
                    />
                  )}
                </Card>
              )}
            </div>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Quiz;