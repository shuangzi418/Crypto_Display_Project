<template>
  <div class="app-container dashboard-home">
    <el-row :gutter="16" class="dashboard-row dashboard-row--hero">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="hero-card">
          <div class="hero-eyebrow">Operations Console</div>
          <h2>{{ title }}</h2>
          <p>
            聚焦密码知识竞赛的题库、竞赛、审核与排行榜运营，首页直接展示关键指标、竞赛动态和待处理数据。
          </p>
          <div class="hero-meta">
            <div class="hero-meta-item">
              <span>进行中竞赛</span>
              <strong>{{ metrics.activeCompetitionCount || 0 }}</strong>
            </div>
            <div class="hero-meta-item">
              <span>待审资料</span>
              <strong>{{ metrics.pendingReviewCount || 0 }}</strong>
            </div>
            <div class="hero-meta-item">
              <span>累计答题</span>
              <strong>{{ metrics.submissionCount || 0 }}</strong>
            </div>
          </div>
          <div class="hero-actions">
            <el-button type="primary" icon="el-icon-notebook-2" class="hero-action-btn" @click="go('/quiz/question')">题目管理</el-button>
            <el-button plain icon="el-icon-date" class="hero-action-btn" @click="go('/quiz/competition')">竞赛管理</el-button>
            <el-button plain icon="el-icon-s-data" class="hero-action-btn" @click="go('/quiz/leaderboard')">排行榜</el-button>
            <el-button plain icon="el-icon-tickets" class="hero-action-btn" @click="go('/quiz/data')">数据管理</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel-card highlight-panel">
          <div slot="header" class="card-header">
            <div>
              <div class="card-title">运营摘要</div>
              <div class="card-subtitle">快速查看题库、竞赛和审核压力</div>
            </div>
          </div>
          <div class="highlight-grid" v-loading="loading">
            <div v-for="item in highlightItems" :key="item.label" class="highlight-item">
              <div class="highlight-value">{{ item.value }}</div>
              <div class="highlight-label">{{ item.label }}</div>
              <div class="highlight-desc">{{ item.desc }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="dashboard-row dashboard-row--metrics">
      <el-col :xs="12" :sm="8" :lg="4" v-for="item in metricCards" :key="item.label" class="metric-col">
        <el-card shadow="hover" class="metric-card" v-loading="loading">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
          <div class="metric-desc">{{ item.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-row dashboard-section">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header between-header">
            <div>
              <div class="card-title">最近竞赛动态</div>
              <div class="card-subtitle">跟踪场次状态、参赛规模和题目配置</div>
            </div>
            <el-button type="text" @click="go('/quiz/competition')">查看全部</el-button>
          </div>
          <el-table v-loading="loading" :data="recentCompetitions" size="small" stripe class="panel-table">
            <el-table-column label="竞赛标题" prop="title" min-width="180" :show-overflow-tooltip="true" />
            <el-table-column label="状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="small" :type="competitionTagType(scope.row.status)">{{ competitionStatusLabel(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="题目数" prop="questionCount" width="90" align="center" />
            <el-table-column label="参赛人数" prop="participantCount" width="100" align="center" />
            <el-table-column label="总分" prop="totalPoints" width="80" align="center" />
            <el-table-column label="开始时间" width="170" align="center">
              <template slot-scope="scope">{{ parseTime(scope.row.startDate) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header between-header">
            <div>
              <div class="card-title">待处理资料</div>
              <div class="card-subtitle">优先处理昵称与头像审核请求</div>
            </div>
            <el-button type="text" @click="go('/quiz/nickname-audit')">进入审核</el-button>
          </div>
          <el-table v-loading="loading" :data="pendingReviews" size="small" stripe class="panel-table">
            <el-table-column label="用户" prop="username" min-width="110" />
            <el-table-column label="审核类型" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="small" type="warning">{{ reviewTypeLabel(scope.row.reviewType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="积分" prop="score" width="80" align="center" />
            <el-table-column label="处理" width="90" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="go(scope.row.reviewType === 'avatar' ? '/quiz/avatar-audit' : '/quiz/nickname-audit')">去处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-row dashboard-section">
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header between-header">
            <div>
              <div class="card-title">积分榜前列</div>
              <div class="card-subtitle">聚焦头部用户与资料展示效果</div>
            </div>
            <el-button type="text" @click="go('/quiz/leaderboard')">查看榜单</el-button>
          </div>
          <el-table v-loading="loading" :data="topUsers" size="small" stripe class="panel-table">
            <el-table-column label="排名" prop="rank" width="70" align="center" />
            <el-table-column label="用户" min-width="170">
              <template slot-scope="scope">
                <div class="user-cell">
                  <img v-if="displayAvatarUrl(scope.row)" :src="displayAvatarUrl(scope.row)" class="avatar-image" />
                  <div v-else class="avatar-placeholder">{{ displayAvatarText(scope.row) }}</div>
                  <div class="user-copy">
                    <div class="display-name">{{ displayName(scope.row) }}</div>
                    <div class="sub-text">账号：{{ scope.row.username }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="积分" prop="score" width="90" align="center" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header between-header">
            <div>
              <div class="card-title">业务表统计</div>
              <div class="card-subtitle">按核心数据表查看记录规模与入口分布</div>
            </div>
            <el-button type="text" @click="go('/quiz/data')">进入数据管理</el-button>
          </div>
          <el-table v-loading="loading" :data="tableStats" size="small" stripe class="panel-table">
            <el-table-column label="表名" prop="displayName" min-width="120" />
            <el-table-column label="记录数" prop="recordCount" width="90" align="center" />
            <el-table-column label="用途说明" prop="description" min-width="220" :show-overflow-tooltip="true" />
            <el-table-column label="操作" width="120" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="go(scope.row.routePath)">{{ scope.row.routeLabel }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getQuizDataOverview } from '@/api/quiz/data'

const competitionStatusMap = {
  upcoming: '未开始',
  active: '进行中',
  ended: '已结束'
}

export default {
  name: 'Index',
  data() {
    return {
      loading: false,
      title: process.env.VUE_APP_TITLE,
      metrics: {},
      tableStats: [],
      recentCompetitions: [],
      pendingReviews: [],
      topUsers: []
    }
  },
  computed: {
    highlightItems() {
      return [
        { label: '题目总数', value: this.metrics.questionCount || 0, desc: '当前题库可维护题目' },
        { label: '活跃竞赛', value: this.metrics.activeCompetitionCount || 0, desc: '正在进行中的竞赛场次' },
        { label: '待审资料', value: this.metrics.pendingReviewCount || 0, desc: '等待处理的昵称或头像' }
      ]
    },
    metricCards() {
      return [
        { label: '竞赛总数', value: this.metrics.competitionCount || 0, desc: '历史累计创建竞赛' },
        { label: '参赛用户', value: this.metrics.userCount || 0, desc: '业务侧注册参赛用户' },
        { label: '答题记录', value: this.metrics.submissionCount || 0, desc: '累计答题提交次数' },
        { label: '消息数量', value: this.metrics.messageCount || 0, desc: '审核提醒与系统消息' },
        { label: '参赛条目', value: this.metrics.participantCount || 0, desc: '竞赛参与关系记录' },
        { label: '题目关联', value: this.tableRelationCount, desc: '竞赛与赛题编排关系' }
      ]
    },
    tableRelationCount() {
      const relation = this.tableStats.find(item => item.tableName === 'competition_questions')
      return relation ? relation.recordCount : 0
    }
  },
  created() {
    this.getOverview()
  },
  methods: {
    getOverview() {
      this.loading = true
      getQuizDataOverview().then(response => {
        const data = response.data || {}
        this.metrics = data.metrics || {}
        this.tableStats = data.tableStats || []
        this.recentCompetitions = data.recentCompetitions || []
        this.pendingReviews = data.pendingReviews || []
        this.topUsers = data.topUsers || []
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    go(path) {
      if (path) {
        this.$router.push(path)
      }
    },
    competitionStatusLabel(status) {
      return competitionStatusMap[status] || status || '-'
    },
    competitionTagType(status) {
      if (status === 'active') {
        return 'success'
      }
      if (status === 'ended') {
        return 'info'
      }
      return 'warning'
    },
    reviewTypeLabel(reviewType) {
      return reviewType === 'avatar' ? '头像' : '昵称'
    },
    displayName(row) {
      return row.displayName || (row.nickname && row.nicknameStatus === 'approved' ? row.nickname : (row.username || '-'))
    },
    displayAvatarUrl(row) {
      return row.displayAvatarUrl || (row.avatar && row.avatarStatus === 'approved' ? row.avatar : '')
    },
    displayAvatarText(row) {
      const fallback = row.displayAvatarText || this.displayName(row) || row.username || '?'
      return String(fallback).trim().slice(0, 1).toUpperCase() || '?'
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-home {
  --page-bg: #f5f7fb;
  --surface: #ffffff;
  --surface-soft: #f8fafc;
  --surface-strong: #eff6ff;
  --border-color: #e2e8f0;
  --text-strong: #0f172a;
  --text-regular: #334155;
  --text-muted: #64748b;
  --text-subtle: #94a3b8;
  --shadow-soft: 0 16px 34px rgba(15, 23, 42, 0.06);
  --shadow-hover: 0 20px 40px rgba(15, 23, 42, 0.1);
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  padding: 24px;
  background: var(--page-bg);
}

.dashboard-row {
  & + & {
    margin-top: var(--space-5);
  }
}

.hero-card,
.panel-card,
.metric-card {
  border: 1px solid var(--border-color);
  border-radius: 18px;
  overflow: hidden;
}

.hero-card {
  min-height: 280px;
  background: linear-gradient(135deg, #0f766e 0%, #155e75 55%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.18);

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

::v-deep .hero-card .el-card__body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 280px;
  padding: 28px;
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

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.hero-meta-item {
  min-width: 118px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);

  span {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.72);
  }

  strong {
    display: block;
    margin-top: 8px;
    font-size: 22px;
    line-height: 1;
    color: #fff;
  }
}

.hero-actions {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.hero-action-btn {
  min-width: 112px;
}

.highlight-panel {
  min-height: 280px;
}

::v-deep .highlight-panel .el-card__body,
::v-deep .panel-card .el-card__body {
  padding: 20px 22px 22px;
}

::v-deep .panel-card .el-card__header {
  padding: 20px 22px 0;
  border-bottom: none;
}

.highlight-grid {
  display: grid;
  gap: var(--space-4);
}

.highlight-item {
  padding: 16px;
  border-radius: 14px;
  background: var(--surface-soft);
  border: 1px solid #edf2f7;
}

.highlight-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-strong);
}

.highlight-label {
  margin-top: 4px;
  color: var(--text-regular);
  font-size: 14px;
}

.highlight-desc {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.metric-card {
  min-height: 132px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-col {
  margin-bottom: 16px;
}

::v-deep .metric-card .el-card__body {
  padding: 18px 18px 20px;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.metric-label {
  color: var(--text-muted);
  font-size: 13px;
}

.metric-value {
  margin-top: 12px;
  color: var(--text-strong);
  font-size: 30px;
  font-weight: 700;
}

.metric-desc {
  margin-top: 10px;
  color: var(--text-subtle);
  font-size: 12px;
  line-height: 1.6;
}

.card-header {
  color: var(--text-strong);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.card-subtitle {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
}

.between-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-image,
.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar-image {
  object-fit: cover;
  border: 1px solid #dbe4ee;
  background: #f5f7fa;
}

.avatar-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-strong);
  color: #0369a1;
  font-weight: 700;
}

.user-copy {
  min-width: 0;
}

.display-name {
  color: #303133;
  font-weight: 600;
}

.sub-text {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}

::v-deep .panel-table {
  border-radius: 14px;
  overflow: hidden;
}

::v-deep .panel-table th.is-leaf {
  background: #f8fafc;
}

::v-deep .panel-table td {
  padding: 13px 0;
}

::v-deep .panel-table .el-table__row:hover > td {
  background: #f8fbff !important;
}

@media (max-width: 1199px) {
  .dashboard-home {
    padding: 20px;
  }
}

@media (max-width: 767px) {
  .dashboard-home {
    padding: 16px;
  }

  ::v-deep .hero-card .el-card__body,
  ::v-deep .highlight-panel .el-card__body,
  ::v-deep .panel-card .el-card__body {
    padding: 18px;
  }

  ::v-deep .panel-card .el-card__header {
    padding: 18px 18px 0;
  }

  .between-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
