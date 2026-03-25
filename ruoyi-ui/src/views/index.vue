<template>
  <div class="app-container dashboard-home">
    <el-row :gutter="20">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="hero-card">
          <div class="hero-eyebrow">Admin Dashboard</div>
          <h2>{{ title }}</h2>
          <p>
            面向密码知识竞赛项目的后台运营中心，统一承接题库维护、赛题导入、竞赛编排、排行榜展示以及业务用户审核。
          </p>
          <div class="hero-actions">
            <el-button type="primary" icon="el-icon-notebook-2" @click="go('/quiz/question')">进入题目管理</el-button>
            <el-button plain icon="el-icon-date" @click="go('/quiz/competition')">进入竞赛管理</el-button>
            <el-button plain icon="el-icon-s-data" @click="go('/quiz/leaderboard')">查看排行榜</el-button>
            <el-button plain icon="el-icon-tickets" @click="go('/quiz/data')">数据管理</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="summary-card">
          <div slot="header" class="card-header">
            <span>迁移概览</span>
          </div>
          <div class="summary-list">
            <div v-for="item in summaryItems" :key="item.label" class="summary-item">
              <div class="summary-value">{{ item.value }}</div>
              <div class="summary-label">{{ item.label }}</div>
              <div class="summary-desc">{{ item.desc }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt20">
      <el-col :xs="24" :sm="12" :lg="8" v-for="item in moduleCards" :key="item.title">
        <el-card shadow="hover" class="module-card">
          <div class="module-icon">
            <svg-icon :icon-class="item.icon" />
          </div>
          <div class="module-title">{{ item.title }}</div>
          <div class="module-desc">{{ item.desc }}</div>
          <el-button type="text" @click="go(item.path)">立即进入</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt20">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header">
            <span>当前工作流</span>
          </div>
          <el-timeline>
            <el-timeline-item v-for="item in workflowItems" :key="item.title" :type="item.type" :timestamp="item.stage">
              <div class="timeline-title">{{ item.title }}</div>
              <div class="timeline-desc">{{ item.desc }}</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header">
            <span>运营入口</span>
          </div>
          <div class="quick-links">
            <div v-for="item in quickLinks" :key="item.path" class="quick-link" @click="go(item.path)">
              <div>
                <div class="quick-link-title">{{ item.title }}</div>
                <div class="quick-link-desc">{{ item.desc }}</div>
              </div>
              <i class="el-icon-arrow-right"></i>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'Index',
  data() {
    return {
      title: process.env.VUE_APP_TITLE,
      summaryItems: [
        { label: '业务模块', value: '6', desc: '题目、竞赛、排行榜、用户、昵称审核、头像审核' },
        { label: '双栈现状', value: '进行中', desc: 'RuoYi 管理端逐步替换旧 React Admin' },
        { label: '数据库', value: 'crypto_quiz', desc: '系统表与业务表共用同一 MySQL 实例' }
      ],
      moduleCards: [
        { title: '题目管理', desc: '维护题库内容、难度、分类和正确答案。', path: '/quiz/question', icon: 'question' },
        { title: '竞赛管理', desc: '创建竞赛、关联题目、同步赛事状态。', path: '/quiz/competition', icon: 'date' },
        { title: '业务用户', desc: '查看参赛用户并管理旧系统业务角色。', path: '/quiz/user', icon: 'peoples' },
        { title: '排行榜', desc: '查看累计积分榜与竞赛分榜表现。', path: '/quiz/leaderboard', icon: 'chart' },
        { title: '数据管理', desc: '查看核心业务表统计、待审核队列与积分榜快照。', path: '/quiz/data', icon: 'table' }
      ],
      workflowItems: [
        { stage: 'Step 1', title: '题库录入与维护', desc: '先沉淀可复用题目，再按分类与难度做精细化运营。', type: 'primary' },
        { stage: 'Step 2', title: '竞赛创建与编排', desc: '基于题库组合竞赛，设定时间窗口与题目集。', type: 'success' },
        { stage: 'Step 3', title: '排行榜复核与审核', desc: '结合昵称、头像审核结果，确保展示信息与排名数据一致。', type: 'warning' }
      ],
      quickLinks: [
        { title: '排行榜总览', desc: '查看积分总榜与竞赛分榜', path: '/quiz/leaderboard' },
        { title: '数据管理', desc: '查看业务表统计与关键数据快照', path: '/quiz/data' },
        { title: '昵称审核', desc: '处理待审核昵称申请', path: '/quiz/nickname-audit' },
        { title: '头像审核', desc: '处理待审核头像申请', path: '/quiz/avatar-audit' },
        { title: '赛题批量导入', desc: '用 Excel 快速导入题库', path: '/quiz/question' },
        { title: '业务用户管理', desc: '调整旧系统业务角色', path: '/quiz/user' }
      ]
    }
  },
  methods: {
    go(path) {
      this.$router.push(path)
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-home {
  background: #f5f7fb;
}

.hero-card {
  min-height: 240px;
  border: none;
  background: linear-gradient(135deg, #0f766e 0%, #155e75 55%, #1d4ed8 100%);
  color: #fff;

  h2 {
    margin: 12px 0 16px;
    font-size: 30px;
    line-height: 1.2;
  }

  p {
    max-width: 620px;
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
    color: rgba(255, 255, 255, 0.88);
  }
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hero-actions {
  margin-top: 28px;
}

.summary-card,
.panel-card,
.module-card {
  border: none;
}

.summary-list {
  display: grid;
  gap: 16px;
}

.summary-item {
  padding: 16px 18px;
  border-radius: 14px;
  background: #f8fafc;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.summary-label {
  margin-top: 4px;
  font-size: 14px;
  color: #334155;
}

.summary-desc {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.module-card {
  margin-bottom: 20px;
}

.module-icon {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #e2e8f0;
  color: #0f766e;
  font-size: 22px;
}

.module-title {
  margin-top: 18px;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.module-desc {
  margin-top: 10px;
  min-height: 44px;
  line-height: 1.7;
  color: #64748b;
}

.card-header {
  font-weight: 600;
  color: #0f172a;
}

.timeline-title {
  font-weight: 600;
  color: #0f172a;
}

.timeline-desc {
  margin-top: 6px;
  color: #64748b;
  line-height: 1.7;
}

.quick-links {
  display: grid;
  gap: 12px;
}

.quick-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: #eef6ff;
  }
}

.quick-link-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.quick-link-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.mt20 {
  margin-top: 20px;
}
</style>
