const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// 初始化Express应用
const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// 在生产环境信任反向代理并强制HTTPS
app.enable('trust proxy');
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// 中间件
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ limit: '3mb', extended: true }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// 数据库连接
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME = 'admin' } = process.env;

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: ADMIN_EMAIL });
    if (!adminExists) {
      await User.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin'
      });
    }
  }
}).catch(err => {
  console.error('数据库连接失败:', err);
});

// 路由
app.get('/', (req, res) => {
  res.json({ message: 'Cryptography Knowledge Quiz System API' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 导入用户路由
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// 导入题目路由
const questionRoutes = require('./routes/questionRoutes');
app.use('/api/questions', questionRoutes);

// 导入答题路由
const submissionRoutes = require('./routes/submissionRoutes');
app.use('/api/submissions', submissionRoutes);

// 导入竞赛路由
const competitionRoutes = require('./routes/competitionRoutes');
app.use('/api/competitions', competitionRoutes);

// 导入排行榜路由
const rankingRoutes = require('./routes/rankingRoutes');
app.use('/api/users', rankingRoutes);

// 导入消息路由
const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

// 导出app
module.exports = app;

// 启动服务器（仅在直接运行时）
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}
