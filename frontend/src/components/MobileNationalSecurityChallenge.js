import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Progress,
  Result,
  Row,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography
} from 'antd';
import h5Api from '../h5Api';
import { generateCertificatePreview } from '../utils/certificateGenerator';
import './MobileNationalSecurityChallenge.css';

const { Title, Paragraph, Text } = Typography;
const OPTION_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DEFAULT_TITLE = '密码安全知识挑战';
const DEFAULT_FOOTER = '筑牢密码安全防线，你我皆是主角 | 学习密码知识，赢取荣誉勋章';
const AUTH_HERO_CHIPS = ['密码安全', '密码防护', '数据保密', '身份验证'];
const AWARDED_MEDAL_TIERS = ['bronze', 'silver', 'gold', 'special'];
const MEDAL_CLASS_MAP = {
  bronze: 'mobile-h5-medal--bronze',
  silver: 'mobile-h5-medal--silver',
  gold: 'mobile-h5-medal--gold',
  special: 'mobile-h5-medal--special',
  encourage: 'mobile-h5-medal--encourage'
};
const MEDAL_TAG_COLOR_MAP = {
  bronze: 'gold',
  silver: 'default',
  gold: 'gold',
  special: 'blue',
  encourage: 'cyan'
};

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

const formatAwardTime = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

function MobileNationalSecurityChallenge() {
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authUser, setAuthUser] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [queryError, setQueryError] = useState('');
  const [awardLookup, setAwardLookup] = useState(null);
  const [awardLookupAttempted, setAwardLookupAttempted] = useState(false);
  const [certificateError, setCertificateError] = useState('');
  const [certificatePreview, setCertificatePreview] = useState(null);
  const [certificateGeneratingKey, setCertificateGeneratingKey] = useState('');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [queryForm] = Form.useForm();

  const loadChallenge = async () => {
    setChallengeLoading(true);
    setError('');
    setCertificateError('');
    setCertificatePreview(null);

    try {
      const response = await h5Api.get('/challenges/national-security');
      setChallenge(response.data);
      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
    } catch (requestError) {
      setChallenge(null);
      setError(getErrorMessage(requestError, '加载挑战题目失败，请稍后重试。'));
    } finally {
      setChallengeLoading(false);
    }
  };

  const checkProfile = async () => {
    try {
      const response = await h5Api.get('/h5-auth/session');
      setAuthUser(response.data?.authenticated ? response.data.user : null);
    } catch (requestError) {
      setAuthUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const previousTitle = document.title;
    document.title = DEFAULT_TITLE;
    checkProfile();

    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    if (authUser) {
      loadChallenge();
    } else {
      setChallenge(null);
      setResult(null);
      setAnswers({});
      setCurrentIndex(0);
    }
  }, [authUser]);

  useEffect(() => {
    if (result) {
      window.scrollTo(0, 0);
    }
  }, [result]);

  const questions = challenge?.questions || [];
  const totalQuestions = challenge?.totalQuestions || questions.length || 20;
  const currentQuestion = questions[currentIndex] || null;
  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((value) => Number.isInteger(value)).length;
  }, [answers]);
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);
  const isLastQuestion = currentIndex === questions.length - 1;
  const footerText = challenge?.footer || result?.footer || DEFAULT_FOOTER;
  const titleText = challenge?.title || result?.title || DEFAULT_TITLE;
  const inQuizMode = Boolean(authUser && challenge && challenge.ready && currentQuestion && !result);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: optionIndex
    }));
  };

  const buildAwardKey = (username, award) => {
    return `${username}-${award._id || award.id || award.medalTier}-${award.createdAt || award.submittedAt || 'current'}`;
  };

  const downloadCertificateImage = (imageUrl, filename) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.click();
  };

  const buildResultAward = () => {
    if (!result) {
      return null;
    }

    return {
      medalTitle: result.medal.title,
      medalTier: result.medal.tier,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      submittedAt: result.submittedAt
    };
  };

  const handleGenerateCertificate = useCallback(async ({ username, award }) => {
    const currentKey = buildAwardKey(username, award);
    setCertificateGeneratingKey(currentKey);
    setCertificateError('');

    try {
      const imageUrl = await generateCertificatePreview({
        username,
        awardTitle: award.medalTitle || award.title,
        correctCount: award.correctCount,
        totalQuestions: award.totalQuestions,
        awardedAt: award.createdAt || award.submittedAt
      });

      setCertificatePreview({
        imageUrl,
        username,
        awardTitle: award.medalTitle || award.title,
        sourceKey: currentKey,
        filename: `${username}-${award.medalTitle || award.title}-荣誉奖牌.png`
      });
    } catch (generationError) {
      setCertificateError(generationError.message || '生成奖牌失败，请稍后重试。');
    } finally {
      setCertificateGeneratingKey('');
    }
  }, []);

  const lookupAwardRecords = async (values) => {
    setQueryLoading(true);
    setQueryError('');
    setAwardLookupAttempted(true);

    try {
      const response = await h5Api.post('/h5-auth/award-records/query', values);
      setAwardLookup(response.data);
    } catch (requestError) {
      setAwardLookup(null);
      setQueryError(getErrorMessage(requestError, '查询获奖记录失败，请稍后重试。'));
    } finally {
      setQueryLoading(false);
    }
  };

  const handleAuthenticate = async (endpoint, values) => {
    setAuthSubmitting(true);
    setAuthError('');

    try {
      const response = await h5Api.post(endpoint, values);
      setAuthUser(response.data);
      setAwardLookup(null);
      setAwardLookupAttempted(false);
      setQueryError('');
      setCertificateError('');
      loginForm.resetFields();
      registerForm.resetFields();
    } catch (requestError) {
      setAuthError(getErrorMessage(requestError, '操作失败，请稍后重试。'));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const previousUser = authUser;

    try {
      await h5Api.post('/h5-auth/logout');
    } catch (requestError) {
      // noop
    }

    setAuthUser(null);
    setAuthMode('lookup');
    setAuthError('');
    setError('');
    setCertificateError('');
    setCertificatePreview(null);

    if (previousUser) {
      const queryValues = {
        phone: previousUser.phone,
        username: previousUser.username
      };
      queryForm.setFieldsValue(queryValues);
      await lookupAwardRecords(queryValues);
    }
  };

  const handleNext = async () => {
    if (!isLastQuestion) {
      setCurrentIndex((previousIndex) => Math.min(previousIndex + 1, questions.length - 1));
      return;
    }

    if (!challenge?.challengeToken) {
      setError('挑战凭证已失效，请重新加载页面。');
      return;
    }

    if (unansweredCount > 0) {
      const confirmed = window.confirm(`还有 ${unansweredCount} 题未作答，未作答将按答错处理，确定完成挑战吗？`);

      if (!confirmed) {
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await h5Api.post('/challenges/national-security/submit', {
        challengeToken: challenge.challengeToken,
        answers
      });
      setResult(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, '提交挑战失败，请稍后重试。'));
    } finally {
      setSubmitting(false);
    }
  };

  const authTabs = [
    {
      key: 'login',
      label: '登录',
      children: (
        <div className="mobile-h5-tab-panel">
          {renderSectionHeader('AUTH ACCESS', '登录后开始答题', '使用手机号和用户名验证身份，进入密码安全知识挑战。')}
          <Form
            form={loginForm}
            layout="vertical"
            className="mobile-h5-form"
            onFinish={(values) => handleAuthenticate('/h5-auth/login', values)}
            autoComplete="on"
          >
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input placeholder="请输入手机号" maxLength={11} inputMode="numeric" />
            </Form.Item>
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" maxLength={30} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={authSubmitting}>
              登录后开始答题
            </Button>
          </Form>
        </div>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <div className="mobile-h5-tab-panel">
          {renderSectionHeader('CREATE IDENTITY', '快速注册并参与', '仅需手机号和用户名即可完成注册，立即进入答题流程。')}
          <Form
            form={registerForm}
            layout="vertical"
            className="mobile-h5-form"
            onFinish={(values) => handleAuthenticate('/h5-auth/register', values)}
            autoComplete="on"
          >
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input placeholder="请输入手机号" maxLength={11} inputMode="numeric" />
            </Form.Item>
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" maxLength={30} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={authSubmitting}>
              注册并开始答题
            </Button>
          </Form>
        </div>
      )
    },
    {
      key: 'lookup',
      label: '获奖查询',
      children: (
        <Space direction="vertical" size={16} className="mobile-h5-block mobile-h5-tab-panel">
          {renderSectionHeader('HONOR LOOKUP', '查询历史获奖记录', '仅展示已获得荣誉的挑战结果，可进一步生成电子奖牌。')}
          <Form
            form={queryForm}
            layout="vertical"
            className="mobile-h5-form"
            onFinish={lookupAwardRecords}
            autoComplete="on"
          >
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input placeholder="请输入手机号" maxLength={11} inputMode="numeric" />
            </Form.Item>
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" maxLength={30} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={queryLoading}>
              查询获奖记录
            </Button>
          </Form>

          {queryError && <Alert message={queryError} type="error" showIcon className="mobile-h5-alert mobile-h5-alert--inline" />}
          {certificateError && <Alert message={certificateError} type="error" showIcon className="mobile-h5-alert mobile-h5-alert--inline" />}

          {awardLookup && awardLookup.awards?.length > 0 && (
            <div className="mobile-h5-award-list">
              {awardLookup.awards.map((award) => (
                <div key={award._id} className="mobile-h5-award-item">
                  <div className="mobile-h5-award-head">
                    <Tag color={MEDAL_TAG_COLOR_MAP[award.medalTier] || 'blue'}>{award.medalTitle}</Tag>
                    <Text type="secondary">{formatAwardTime(award.createdAt)}</Text>
                  </div>
                  <Text>答对 {award.correctCount} / {award.totalQuestions} 题</Text>
                  <Button
                    size="small"
                    className="mobile-h5-award-action"
                    onClick={() => handleGenerateCertificate({ username: awardLookup.username, award })}
                    loading={certificateGeneratingKey === buildAwardKey(awardLookup.username, award)}
                  >
                    生成奖牌
                  </Button>
                </div>
              ))}
            </div>
          )}

          {awardLookupAttempted && !queryError && (!awardLookup || awardLookup.awards?.length === 0) && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="未查询到获奖记录"
              className="mobile-h5-empty"
            />
          )}
        </Space>
      )
    }
  ];

  const resultAward = buildResultAward();
  const resultAwardKey = resultAward && authUser
    ? buildAwardKey(authUser.username, {
      ...resultAward,
      createdAt: resultAward.submittedAt
    })
    : '';

  useEffect(() => {
    if (!authUser || !resultAward || !AWARDED_MEDAL_TIERS.includes(resultAward.medalTier)) {
      return;
    }

    if (certificatePreview?.sourceKey === resultAwardKey || certificateGeneratingKey === resultAwardKey) {
      return;
    }

    handleGenerateCertificate({
      username: authUser.username,
      award: {
        ...resultAward,
        createdAt: resultAward.submittedAt
      }
    });
  }, [authUser, resultAward, resultAwardKey, certificateGeneratingKey, certificatePreview, handleGenerateCertificate]);

  const renderCertificatePreviewCard = () => {
    if (!certificatePreview) {
      return null;
    }

    return (
      <Card bordered={false} className="mobile-h5-card">
        <Space direction="vertical" size={12} className="mobile-h5-block">
          <Tag color="blue">电子奖牌</Tag>
          <Title level={4} className="mobile-h5-title mobile-h5-title--compact">{certificatePreview.awardTitle}</Title>
          <Paragraph type="secondary" className="mobile-h5-paragraph">
            长按图片可保存到手机，也可以点击下方按钮直接下载奖牌。
          </Paragraph>
          <img
            className="mobile-h5-certificate-image"
            src={certificatePreview.imageUrl}
            alt={`${certificatePreview.username} 的荣誉奖牌`}
          />
          <Button
            type="primary"
            onClick={() => downloadCertificateImage(certificatePreview.imageUrl, certificatePreview.filename)}
          >
            下载奖牌
          </Button>
        </Space>
      </Card>
    );
  };

  const renderResultCertificateCard = () => {
    if (!resultAward || !AWARDED_MEDAL_TIERS.includes(resultAward.medalTier)) {
      return null;
    }

    if (certificatePreview?.sourceKey === resultAwardKey) {
      return renderCertificatePreviewCard();
    }

    return (
      <Card bordered={false} className="mobile-h5-card mobile-h5-card--center">
        <Space direction="vertical" size={12} align="center">
          <Spin />
          <Text type="secondary">正在生成荣誉奖牌，请稍候...</Text>
        </Space>
      </Card>
    );
  };

  function renderSectionHeader(label, title, description) {
    return (
      <div className="mobile-h5-section-header">
        <span className="mobile-h5-section-kicker">{label}</span>
        <strong className="mobile-h5-section-title">{title}</strong>
        {description && <Text type="secondary" className="mobile-h5-section-description">{description}</Text>}
      </div>
    );
  }

  function renderTagCloud(items) {
    return (
      <div className="mobile-h5-tag-cloud">
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="mobile-h5-tag-cloud-item">{item}</span>
        ))}
      </div>
    );
  }

  function renderHeroSection({ eyebrow, title, subtitle, chips }) {
    return (
      <section className="mobile-h5-hero">
        <div className="mobile-h5-hero-grid">
          <div className="mobile-h5-hero-copy">
            <span className="mobile-h5-hero-kicker">{eyebrow}</span>
            <Title level={1} className="mobile-h5-hero-title">{title}</Title>
            <Paragraph className="mobile-h5-hero-subtitle">{subtitle}</Paragraph>
            {chips?.length > 0 && renderTagCloud(chips)}
          </div>

          <div className="mobile-h5-hero-lock" aria-hidden="true">
            <div className="mobile-h5-hero-lock-shackle" />
            <div className="mobile-h5-hero-lock-body">
              <div className="mobile-h5-hero-lock-core" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (authChecking) {
    return (
      <div className="mobile-h5-page">
        <div className="mobile-h5-shell">
          <Card bordered={false} className="mobile-h5-card mobile-h5-card--center">
            <Space direction="vertical" size={16} align="center">
              <Spin size="large" />
              <Title level={3}>加载中</Title>
              <Paragraph type="secondary">正在校验登录状态，请稍候。</Paragraph>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="mobile-h5-page">
        <div className="mobile-h5-shell">
          {renderHeroSection({
            eyebrow: 'ENTERPRISE SECURITY / CYBER TECH',
            title: titleText,
            subtitle: '登录或注册后即可参与答题，系统将自动从题库中抽取 20 道密码安全知识题供你逐题作答。',
            chips: AUTH_HERO_CHIPS
          })}

          <Card bordered={false} className="mobile-h5-card mobile-h5-card--panel">
            {authError && <Alert message={authError} type="error" showIcon className="mobile-h5-alert" />}
            <Tabs className="mobile-h5-tabs" activeKey={authMode} onChange={setAuthMode} items={authTabs} />
          </Card>

          <div className="mobile-h5-footer">
            <Text type="secondary">请使用手机号和用户名完成登录或注册后参与挑战。</Text>
            <Text type="secondary">{footerText}</Text>
          </div>
          {renderCertificatePreviewCard()}
        </div>
      </div>
    );
  }

  if (challengeLoading) {
    return (
      <div className="mobile-h5-page">
        <div className="mobile-h5-shell">
          <Card bordered={false} className="mobile-h5-card">
            <Space direction="vertical" size={12} className="mobile-h5-block">
              <Row justify="space-between" align="middle">
                <Col>
                  <Tag color="blue">正在准备题目</Tag>
                </Col>
                <Col>
                  <Button type="link" onClick={handleLogout}>退出登录</Button>
                </Col>
              </Row>
              <Title level={3} className="mobile-h5-title mobile-h5-title--compact">题目加载中</Title>
              <Paragraph type="secondary">正在从项目题库中抽取本次挑战题目，请稍候。</Paragraph>
              <Spin />
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="mobile-h5-page">
        <div className="mobile-h5-shell">
          <Card bordered={false} className="mobile-h5-card">
            <Result
              status="error"
              title="暂时无法开始挑战"
              subTitle={error || '题目服务暂不可用，请稍后再试。'}
              extra={[
                <Button key="reload" type="primary" onClick={loadChallenge}>
                  重新加载题目
                </Button>,
                <Button key="logout" onClick={handleLogout}>
                  退出登录
                </Button>
              ]}
            />
          </Card>
        </div>
      </div>
    );
  }

  if (!challenge.ready || !currentQuestion) {
    return (
      <div className="mobile-h5-page">
        <div className="mobile-h5-shell">
          <Card bordered={false} className="mobile-h5-card">
            <Result
              status="warning"
              title="当前挑战尚未就绪"
              subTitle={challenge.message || '题库中符合条件的题目不足 20 道，请先补充题目后再开启挑战。'}
              extra={[
                <Button key="check" type="primary" onClick={loadChallenge}>
                  重新检查题库
                </Button>
              ]}
            />
          </Card>
        </div>
      </div>
    );
  }

  if (result) {
    const medalClassName = MEDAL_CLASS_MAP[result.medal.tier] || MEDAL_CLASS_MAP.encourage;

    return (
      <div className="mobile-h5-page">
        <div className="mobile-h5-shell">
          {renderHeroSection({
            eyebrow: 'SECURITY RESULT / HONOR UNLOCKED',
            title: result.medal.title,
            subtitle: `系统已完成自动判题，本次挑战答对 ${result.correctCount} / ${result.totalQuestions} 题，荣誉结果如下。`,
            chips: [result.medal.badge, `答对 ${result.correctCount} 题`, '自动判题']
          })}

          <div className="mobile-h5-topbar">
            <span className="mobile-h5-topbar-label">挑战完成</span>
            <Button type="link" onClick={handleLogout}>退出登录</Button>
          </div>

          <Card bordered={false} className={`mobile-h5-card mobile-h5-card--result ${medalClassName}`}>
            <Space direction="vertical" size={12} className="mobile-h5-block">
              <Tag color={MEDAL_TAG_COLOR_MAP[result.medal.tier] || 'blue'}>{result.medal.badge}</Tag>
              <Title level={3} className="mobile-h5-title mobile-h5-title--compact">{result.medal.title}</Title>
              <Paragraph className="mobile-h5-paragraph">{result.medal.description}</Paragraph>
            </Space>

            <Row gutter={[12, 12]}>
              <Col span={12}>
                <div className="mobile-h5-stat">
                  <Text type="secondary">答对题数</Text>
                  <strong>{result.correctCount}</strong>
                </div>
              </Col>
              <Col span={12}>
                <div className="mobile-h5-stat">
                  <Text type="secondary">总题数</Text>
                  <strong>{result.totalQuestions}</strong>
                </div>
              </Col>
              <Col span={12}>
                <div className="mobile-h5-stat">
                  <Text type="secondary">已作答</Text>
                  <strong>{result.answeredCount}</strong>
                </div>
              </Col>
              <Col span={12}>
                <div className="mobile-h5-stat">
                  <Text type="secondary">未作答</Text>
                  <strong>{result.unansweredCount}</strong>
                </div>
              </Col>
            </Row>

            <Button type="primary" block onClick={loadChallenge}>
              再来一次
            </Button>
          </Card>

          {certificateError && <Alert message={certificateError} type="error" showIcon className="mobile-h5-alert" />}
          {renderResultCertificateCard()}

          <div className="mobile-h5-footer">
            <Text type="secondary">{footerText}</Text>
          </div>
        </div>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion._id];

  if (inQuizMode) {
    return (
      <div className="mobile-h5-page mobile-h5-page--quiz">
        <div className="mobile-h5-shell mobile-h5-shell--quiz">
          <Card bordered={false} className="mobile-h5-card mobile-h5-card--sticky mobile-h5-card--compact">
            <Row justify="space-between" align="middle" gutter={[12, 8]}>
              <Col flex="1 1 0">
                <Space size={8} wrap>
                  <span className="mobile-h5-quiz-chip">答题中</span>
                  <Text strong className="mobile-h5-quiz-title">{titleText}</Text>
                </Space>
              </Col>
              <Col>
                <Button type="link" onClick={handleLogout}>退出</Button>
              </Col>
            </Row>
            <Row gutter={12} align="middle" className="mobile-h5-progress-head mobile-h5-progress-head--compact">
              <Col flex="1 1 0">
                <Text type="secondary">第 {currentIndex + 1} / {totalQuestions} 题</Text>
                <div className="mobile-h5-progress-value mobile-h5-progress-value--compact">已作答 {answeredCount} 题</div>
              </Col>
              <Col>
                <span className="mobile-h5-quiz-chip mobile-h5-quiz-chip--secondary">单选题</span>
              </Col>
            </Row>
            <Progress
              percent={Math.round(((currentIndex + 1) / totalQuestions) * 100)}
              showInfo={false}
              strokeColor="#1890ff"
              trailColor="#f0f0f0"
            />
          </Card>

          {error && <Alert message={error} type="error" showIcon className="mobile-h5-alert" />}

          <Card
            bordered={false}
            className="mobile-h5-card mobile-h5-card--question"
            title={<span>第 {currentIndex + 1} 题</span>}
          >
            <Space direction="vertical" size={12} className="mobile-h5-block">
              {currentQuestion.title && currentQuestion.title !== currentQuestion.content && (
                <Title level={4} className="mobile-h5-title mobile-h5-title--compact">{currentQuestion.title}</Title>
              )}
              <Paragraph className="mobile-h5-question-content">{currentQuestion.content}</Paragraph>
            </Space>

            <div className="mobile-h5-options">
              {(currentQuestion.options || []).map((option, optionIndex) => {
                const isSelected = currentAnswer === optionIndex;

                return (
                  <button
                    key={`${currentQuestion._id}-${optionIndex}`}
                    type="button"
                    className={`mobile-h5-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectOption(currentQuestion._id, optionIndex)}
                  >
                    <span className="mobile-h5-option-key">{OPTION_LABELS[optionIndex] || optionIndex + 1}</span>
                    <span className="mobile-h5-option-text">{option}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="mobile-h5-actions mobile-h5-actions--sticky">
            <Row gutter={12}>
              <Col span={12}>
                <Button
                  block
                  size="large"
                  onClick={() => setCurrentIndex((previousIndex) => Math.max(previousIndex - 1, 0))}
                  disabled={currentIndex === 0}
                >
                  上一页
                </Button>
              </Col>
              <Col span={12}>
                <Button block size="large" type="primary" onClick={handleNext} loading={submitting}>
                  {isLastQuestion ? '完成挑战' : '下一页'}
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default MobileNationalSecurityChallenge;
