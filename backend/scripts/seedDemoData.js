const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { sequelize, Question, Competition } = require('../src/models');
const { ensureDatabase } = require('../src/config/ensureDatabase');
const { ensureSchemaCompatibility } = require('../src/config/ensureSchemaCompatibility');
const { bootstrapAdminUser } = require('../src/services/adminBootstrap');

const demoQuestions = [
  {
    title: '凯撒密码属于哪一类经典密码？',
    content: '凯撒密码通过固定偏移量对字母进行替换，它属于哪一类经典密码？',
    options: ['替换密码', '置换密码', '流密码', '哈希函数'],
    correctAnswer: 0,
    difficulty: 'easy',
    category: '本地演示',
    points: 5
  },
  {
    title: 'RSA 常见安全性依赖于什么问题？',
    content: '在经典教材和常见实现中，RSA 的安全性主要依赖于哪个数学难题？',
    options: ['离散对数问题', '大整数分解问题', '背包问题', '最短路径问题'],
    correctAnswer: 1,
    difficulty: 'medium',
    category: '本地演示',
    points: 10
  },
  {
    title: 'MD5 现在为什么不再推荐用于安全场景？',
    content: 'MD5 仍可用于非安全场景校验，但在安全场景下不再推荐，最核心的原因是什么？',
    options: ['运算速度太慢', '摘要长度太长', '存在可行碰撞攻击', '不支持二进制数据'],
    correctAnswer: 2,
    difficulty: 'medium',
    category: '本地演示',
    points: 10
  },
  {
    title: '一次一密最关键的前提是什么？',
    content: '一次一密理论上可达香农完美保密，但必须满足一个关键前提。以下哪项最准确？',
    options: ['密钥长度短于明文', '密钥可以重复使用', '密钥与明文等长且只使用一次', '只在本地网络传输'],
    correctAnswer: 2,
    difficulty: 'hard',
    category: '本地演示',
    points: 15
  },
  {
    title: 'HTTPS 中 TLS 的主要作用是什么？',
    content: '在 HTTPS 连接中，TLS 协议最核心的职责是什么？',
    options: ['压缩网页资源', '提供机密性和完整性保护', '提高 DNS 解析速度', '替代浏览器缓存'],
    correctAnswer: 1,
    difficulty: 'easy',
    category: '本地演示',
    points: 5
  },
  {
    title: '数字签名首先解决的是什么问题？',
    content: '相比单纯加密，数字签名最直接解决的是哪类需求？',
    options: ['数据压缩', '身份认证与不可否认性', '跨域请求', '数据库索引'],
    correctAnswer: 1,
    difficulty: 'medium',
    category: '本地演示',
    points: 10
  }
];

const competitionTitle = '本地演示挑战赛';

async function upsertQuestion(payload) {
  const existingQuestion = await Question.findOne({
    where: {
      title: payload.title,
      category: payload.category
    }
  });

  if (existingQuestion) {
    await existingQuestion.update(payload);
    return existingQuestion;
  }

  return Question.create(payload);
}

async function seedDemoData() {
  await ensureDatabase();
  await sequelize.authenticate();
  await sequelize.sync();
  await ensureSchemaCompatibility();
  await bootstrapAdminUser();

  const createdQuestions = [];

  for (const payload of demoQuestions) {
    const question = await upsertQuestion(payload);
    createdQuestions.push(question);
  }

  const now = new Date();
  const startDate = new Date(now.getTime() - 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const totalPoints = createdQuestions.reduce((sum, question) => sum + question.points, 0);

  let competition = await Competition.findOne({
    where: {
      title: competitionTitle
    }
  });

  const competitionPayload = {
    title: competitionTitle,
    description: '用于本地联调与功能演示的竞赛，包含基础密码学题目。',
    startDate,
    endDate,
    status: 'active',
    totalPoints
  };

  if (competition) {
    await competition.update(competitionPayload);
  } else {
    competition = await Competition.create(competitionPayload);
  }

  await competition.setQuestions(createdQuestions.map((question) => question.id));

  console.log(`Seeded ${createdQuestions.length} demo questions.`);
  console.log(`Prepared competition: ${competitionTitle}`);
}

seedDemoData()
  .then(async () => {
    await sequelize.close();
  })
  .catch(async (error) => {
    console.error(error);
    await sequelize.close().catch(() => {});
    process.exit(1);
  });
