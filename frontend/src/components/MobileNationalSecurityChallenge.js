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
  Tag,
  Typography
} from 'antd';
import h5Api from '../h5Api';
import { generateCertificatePreview } from '../utils/certificateGenerator';
import './MobileNationalSecurityChallenge.css';

const { Title, Paragraph, Text } = Typography;
const OPTION_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DEFAULT_QUESTION_COUNT = 15;
const DEFAULT_TITLE = '密码安全知识挑战';
const DEFAULT_FOOTER = '强化密码安全意识，落实安全责任 | 普及密码知识，提升防护能力';
const AUTH_HERO_CHIPS = ['密码安全', '密码防护', '数据保密', '身份验证'];
const AWARDED_MEDAL_TIERS = ['silver', 'gold'];
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

const LEGACY_MEDAL_TITLE_MAP = {
  '国家安全之星': '密码安全金奖',
  '密码安全之星': '密码安全金奖',
  '安全榜样·金徽': '密码安全金奖',
  '国安先锋·银徽': '密码安全银奖',
  '密码先锋·银徽': '密码安全银奖',
  '安全卫士·铜徽': '密码安全银奖'
};

const normalizeAwardTitle = (title) => {
  const safeTitle = String(title || '').trim();

  return LEGACY_MEDAL_TITLE_MAP[safeTitle] || safeTitle;
};

const resolveAwardTitle = (award = {}) => normalizeAwardTitle(award.medalTitle || award.title);

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

const getOptionLabel = (optionIndex) => OPTION_LABELS[optionIndex] || optionIndex + 1;

const getReviewAnswerText = (optionIndex, options = []) => {
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
    return '未作答';
  }

  return `${getOptionLabel(optionIndex)}. ${options[optionIndex]}`;
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
  const [activeView, setActiveView] = useState('home');
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
  const [accessForm] = Form.useForm();

  const loadChallenge = async () => {
    setActiveView('quiz');
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
      setError(getErrorMessage(requestError, '加载答题内容失败，请稍后重试。'));
    } finally {
      setChallengeLoading(false);
    }
  };

  const checkProfile = async () => {
    try {
      const response = await h5Api.get('/h5-auth/session');
      setAuthUser(response.data?.authenticated ? response.data.user : null);
      setActiveView('home');
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
    if (!authUser) {
      setChallenge(null);
      setResult(null);
      setAnswers({});
      setCurrentIndex(0);
      setAwardLookup(null);
      setAwardLookupAttempted(false);
      setQueryError('');
      setCertificateError('');
      setCertificatePreview(null);
    }
  }, [authUser]);

  useEffect(() => {
    if (result) {
      window.scrollTo(0, 0);
    }
  }, [result]);

  const questions = challenge?.questions || [];
  const totalQuestions = challenge?.totalQuestions || questions.length || DEFAULT_QUESTION_COUNT;
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

  const handleGenerateCertificate = useCallback(async ({ username, award }) => {
    const currentKey = buildAwardKey(username, award);
    setCertificateGeneratingKey(currentKey);
    setCertificateError('');

    try {
      const awardTitle = resolveAwardTitle(award);

      const imageUrl = await generateCertificatePreview({
        username,
        awardTitle,
        medalTier: award.medalTier || award.tier,
        correctCount: award.correctCount,
        totalQuestions: award.totalQuestions,
        awardedAt: award.createdAt || award.submittedAt
      });

      setCertificatePreview({
        imageUrl,
        username,
        awardTitle,
        sourceKey: currentKey,
        filename: `${username}-${awardTitle}-荣誉奖牌.png`
      });
    } catch (generationError) {
      setCertificateError(generationError.message || '生成电子奖牌失败，请稍后重试。');
    } finally {
      setCertificateGeneratingKey('');
    }
  }, []);

  const lookupAwardRecords = async (values = authUser ? {
    username: authUser.username
  } : null) => {
    if (!values) {
      return;
    }

    setQueryLoading(true);
    setQueryError('');
    setAwardLookupAttempted(true);

    try {
      const response = await h5Api.post('/h5-auth/award-records/query', values);
      setAwardLookup(response.data);
    } catch (requestError) {
      setAwardLookup(null);
      setQueryError(getErrorMessage(requestError, '查询荣誉记录失败，请稍后重试。'));
    } finally {
      setQueryLoading(false);
    }
  };

  const handleAccess = async (values) => {
    setAuthSubmitting(true);
    setAuthError('');

    try {
      const response = await h5Api.post('/h5-auth/access', values);
      setAuthUser(response.data);
      setActiveView('home');
      setAwardLookup(null);
      setAwardLookupAttempted(false);
      setQueryError('');
      setCertificateError('');
      setCertificatePreview(null);
      setChallenge(null);
      setResult(null);
      setAnswers({});
      setCurrentIndex(0);
      setError('');
      accessForm.resetFields();
    } catch (requestError) {
      setAuthError(getErrorMessage(requestError, '操作未成功，请稍后重试。'));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await h5Api.post('/h5-auth/logout');
    } catch (requestError) {
      // noop
    }

    setAuthUser(null);
    setActiveView('home');
    setAuthError('');
    setError('');
    setQueryError('');
    setCertificateError('');
    setCertificatePreview(null);
    setAwardLookup(null);
    setAwardLookupAttempted(false);
    setChallenge(null);
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
  };

  const handleOpenLookup = async () => {
    setActiveView('lookup');
    setCertificateError('');
    setCertificatePreview(null);
    await lookupAwardRecords();
  };

  const handleBackHome = () => {
    setActiveView('home');
    setError('');
    setQueryError('');
    setCertificateError('');
    setCertificatePreview(null);
    setChallenge(null);
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
  };

  const handleNext = async () => {
    if (!isLastQuestion) {
      setCurrentIndex((previousIndex) => Math.min(previousIndex + 1, questions.length - 1));
      return;
    }

    if (!challenge?.challengeToken) {
      setError('本次答题凭证已失效，请重新加载页面后继续。');
      return;
    }

    if (unansweredCount > 0) {
      const confirmed = window.confirm(`当前仍有 ${unansweredCount} 题未作答，未作答题目将按答错处理。确认提交答卷吗？`);

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
      setError(getErrorMessage(requestError, '提交答卷失败，请稍后重试。'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderResultReview = () => {
    if (!result?.review?.length) {
      return null;
    }

    return (
      <Card bordered={false} className="mobile-h5-card mobile-h5-card--review">
        <Space direction="vertical" size={16} className="mobile-h5-block">
          {renderSectionHeader(
            'ANSWER REVIEW',
            '答题答案与解析',
            '答题完成后可立即查看每道题的标准答案和解析，帮助参与者边答边学、加深记忆。'
          )}

          <div className="mobile-h5-review-list">
            {result.review.map((item, index) => {
              const answerStatusText = item.isCorrect ? '回答正确' : (Number.isInteger(item.selectedAnswer) ? '回答错误' : '未作答');
              const answerStatusClassName = item.isCorrect
                ? 'mobile-h5-review-status--correct'
                : (Number.isInteger(item.selectedAnswer)
                  ? 'mobile-h5-review-status--wrong'
                  : 'mobile-h5-review-status--empty');

              return (
                <article key={item.questionId || index} className="mobile-h5-review-item">
                  <div className="mobile-h5-review-head">
                    <span className="mobile-h5-review-index">第 {index + 1} 题</span>
                    <span className={`mobile-h5-review-status ${answerStatusClassName}`}>{answerStatusText}</span>
                  </div>

                  <Space direction="vertical" size={10} className="mobile-h5-block">
                    <Title level={5} className="mobile-h5-title mobile-h5-title--compact">{item.title || item.content}</Title>
                    {item.title && item.title !== item.content && (
                      <Paragraph className="mobile-h5-question-content">{item.content}</Paragraph>
                    )}

                    <div className="mobile-h5-review-answer-grid">
                      <div className="mobile-h5-review-answer-card">
                        <Text type="secondary">你的答案</Text>
                        <strong>{getReviewAnswerText(item.selectedAnswer, item.options)}</strong>
                      </div>
                      <div className="mobile-h5-review-answer-card mobile-h5-review-answer-card--correct">
                        <Text type="secondary">标准答案</Text>
                        <strong>{getReviewAnswerText(item.correctAnswer, item.options)}</strong>
                      </div>
                    </div>

                    <div className="mobile-h5-review-explanation">
                      <Text strong>解析</Text>
                      <Paragraph className="mobile-h5-paragraph">{item.explanation}</Paragraph>
                    </div>
                  </Space>
                </article>
              );
            })}
          </div>
        </Space>
      </Card>
    );
  };

  const renderAuthPanel = () => {
    return (
      <div className="mobile-h5-tab-panel">
        {renderSectionHeader(
          'QUICK ACCESS',
          '输入昵称即可进入答题',
          '系统会自动识别昵称是否已存在：已存在则直接登录，不存在则自动注册并进入。'
        )}
        <Form
          form={accessForm}
          layout="vertical"
          className="mobile-h5-form"
          onFinish={handleAccess}
          autoComplete="on"
        >
          <Form.Item
            name="username"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" maxLength={30} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={authSubmitting}>
            进入答题
          </Button>
        </Form>
      </div>
    );
  };

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
            subtitle: '请完成登录或注册后参加答题，系统将从题库中随机抽取 15 道密码安全知识题供逐题作答。',
            chips: AUTH_HERO_CHIPS
          })}

          <Card bordered={false} className="mobile-h5-card mobile-h5-card--panel">
            {authError && <Alert message={authError} type="error" showIcon className="mobile-h5-alert" />}
            {renderAuthPanel()}
          </Card>

          <div className="mobile-h5-footer">
            <Text type="secondary">输入昵称后系统将自动完成登录或注册，无需切换页面。</Text>
            <Text type="secondary">{footerText}</Text>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'home' && !challengeLoading && !challenge && !result) {
    return (
      <div className="mobile-h5-page">
        <div className="mobile-h5-shell">
          {renderHeroSection({
            eyebrow: 'ACCESS GRANTED / SECURITY CONSOLE',
            title: `当前账号：${authUser.username}`,
            subtitle: '当前登录状态已保持。您可直接进入答题，也可先查询历史荣誉记录。',
            chips: ['登录状态已保持', '15题随机抽取', '荣誉记录查询']
          })}

          <Card bordered={false} className="mobile-h5-card mobile-h5-card--panel">
            {renderSectionHeader('READY TO START', '请选择当前办理事项', '登录后可根据需要选择进入答题或查询荣誉记录。')}
            <Space direction="vertical" size={14} className="mobile-h5-block">
              <div className="mobile-h5-account-summary">
                <Text strong>{authUser.username}</Text>
                <Text type="secondary">昵称已登录，可直接开始答题。</Text>
              </div>
              <Button type="primary" block onClick={loadChallenge}>进入答题</Button>
              <Button block onClick={handleOpenLookup} loading={queryLoading}>查询荣誉记录</Button>
              <Button block onClick={handleLogout}>退出登录</Button>
            </Space>
          </Card>

          <div className="mobile-h5-footer">
            <Text type="secondary">再次访问页面时，系统将优先恢复当前登录状态，无需重复登录。</Text>
            <Text type="secondary">{footerText}</Text>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'lookup') {
    return (
      <div className="mobile-h5-page">
        <div className="mobile-h5-shell">
          <div className="mobile-h5-topbar">
            <span className="mobile-h5-topbar-label">荣誉记录查询</span>
            <Button type="link" onClick={handleBackHome}>返回</Button>
          </div>

          <Card bordered={false} className="mobile-h5-card mobile-h5-card--panel">
            <Space direction="vertical" size={16} className="mobile-h5-block mobile-h5-tab-panel">
              {renderSectionHeader('HONOR LOOKUP', '荣誉记录与电子奖牌查询', '电子奖牌统一在此生成、展示和下载，便于集中查看与留存。')}
              <div className="mobile-h5-account-summary">
                <Text strong>{authUser.username}</Text>
                <Text type="secondary">当前按昵称查询该账号的获奖记录。</Text>
              </div>
              <Button type="primary" block onClick={() => lookupAwardRecords()} loading={queryLoading}>查询荣誉记录</Button>

              {queryError && <Alert message={queryError} type="error" showIcon className="mobile-h5-alert mobile-h5-alert--inline" />}
              {certificateError && <Alert message={certificateError} type="error" showIcon className="mobile-h5-alert mobile-h5-alert--inline" />}

              {awardLookup && awardLookup.awards?.length > 0 && (
                <div className="mobile-h5-award-list">
                  {awardLookup.awards.map((award) => (
                    <div key={award._id} className="mobile-h5-award-item">
                      <div className="mobile-h5-award-head">
                        <Tag color={MEDAL_TAG_COLOR_MAP[award.medalTier] || 'blue'}>{resolveAwardTitle(award)}</Tag>
                        <Text type="secondary">{formatAwardTime(award.createdAt)}</Text>
                      </div>
                        <Text>答对 {award.correctCount} / {award.totalQuestions} 题</Text>
                      <Button
                        size="small"
                        className="mobile-h5-award-action"
                        onClick={() => handleGenerateCertificate({ username: awardLookup.username, award })}
                        loading={certificateGeneratingKey === buildAwardKey(awardLookup.username, award)}
                      >
                        生成电子奖牌
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {awardLookupAttempted && !queryError && (!awardLookup || awardLookup.awards?.length === 0) && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="当前账号暂无获奖记录"
                  className="mobile-h5-empty"
                />
              )}
            </Space>
          </Card>

          {renderCertificatePreviewCard()}

          <div className="mobile-h5-footer">
            <Text type="secondary">电子奖牌统一在“荣誉记录查询”页面中生成和展示。</Text>
            <Text type="secondary">{footerText}</Text>
          </div>
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
                  <Tag color="blue">正在准备答题内容</Tag>
                </Col>
                <Col>
                  <Button type="link" onClick={handleLogout}>退出登录</Button>
                </Col>
              </Row>
              <Title level={3} className="mobile-h5-title mobile-h5-title--compact">答题内容加载中</Title>
              <Paragraph type="secondary">系统正在从题库中抽取本次答题内容，请稍候。</Paragraph>
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
              title="当前暂无法进入答题"
              subTitle={error || '答题服务暂不可用，请稍后再试。'}
              extra={[
                <Button key="reload" type="primary" onClick={loadChallenge}>
                  重新加载
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
              title="当前答题条件暂未满足"
              subTitle={challenge.message || '题库中符合条件的题目不足 15 道，请补充题目后再开放答题。'}
              extra={[
                <Button key="check" type="primary" onClick={loadChallenge}>
                  重新检查
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
    const hasAward = AWARDED_MEDAL_TIERS.includes(result.medal.tier);
    const medalTitle = normalizeAwardTitle(result.medal.title);

    return (
      <div className="mobile-h5-page">
        <div className="mobile-h5-shell">
          {renderHeroSection({
            eyebrow: 'SECURITY RESULT / HONOR UNLOCKED',
            title: medalTitle,
            subtitle: `系统已完成自动判题。本次答题共答对 ${result.correctCount} / ${result.totalQuestions} 题，结果如下。`,
            chips: [result.medal.badge, `答对 ${result.correctCount} 题`, '自动判题']
          })}

          <div className="mobile-h5-topbar">
            <span className="mobile-h5-topbar-label">答题完成</span>
            <Button type="link" onClick={handleLogout}>退出登录</Button>
          </div>

          <Card bordered={false} className={`mobile-h5-card mobile-h5-card--result ${medalClassName}`}>
            <Space direction="vertical" size={12} className="mobile-h5-block">
              <Tag color={MEDAL_TAG_COLOR_MAP[result.medal.tier] || 'blue'}>{result.medal.badge}</Tag>
              <Title level={3} className="mobile-h5-title mobile-h5-title--compact">{medalTitle}</Title>
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
                重新开始答题
              </Button>

              {hasAward && (
                <Button block onClick={handleOpenLookup} loading={queryLoading}>
                  前往荣誉记录查询电子奖牌
                </Button>
              )}

            <Button block onClick={handleBackHome}>
              返回首页
            </Button>
          </Card>

          {renderResultReview()}

          {certificateError && <Alert message={certificateError} type="error" showIcon className="mobile-h5-alert" />}
          {hasAward && (
            <Card bordered={false} className="mobile-h5-card mobile-h5-card--center">
              <Space direction="vertical" size={12} align="center">
                <Tag color={MEDAL_TAG_COLOR_MAP[result.medal.tier] || 'blue'}>电子奖牌已移至获奖记录</Tag>
                <Text type="secondary">为保持页面简洁，电子奖牌统一在“荣誉记录查询”页面中生成、展示和下载。</Text>
              </Space>
            </Card>
          )}

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
                  <span className="mobile-h5-quiz-chip">正在答题</span>
                  <Text strong className="mobile-h5-quiz-title">{titleText}</Text>
                </Space>
              </Col>
              <Col>
                <Button type="link" onClick={handleLogout}>退出登录</Button>
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
                     <span className="mobile-h5-option-key">{getOptionLabel(optionIndex)}</span>
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
                  上一题
                </Button>
              </Col>
              <Col span={12}>
                <Button block size="large" type="primary" onClick={handleNext} loading={submitting}>
                  {isLastQuestion ? '提交答卷' : '下一题'}
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
