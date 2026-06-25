<template>
  <div class="app-container data-center-page">
    <el-alert
      title="这是项目专用数据管理页，只展示竞赛业务核心表的统计与数据快照，不直接暴露通用数据库操作。"
      type="info"
      :closable="false"
      show-icon
      class="mb16"
    />

    <div class="page-intro">
      <div>
        <div class="page-title">业务数据中心</div>
        <div class="page-subtitle">聚焦核心业务表、竞赛快照、待审队列和榜单头部数据，便于后台巡检</div>
      </div>
    </div>

    <el-row :gutter="16" class="data-row data-row--metrics">
      <el-col :xs="12" :sm="8" :lg="4" v-for="item in metricCards" :key="item.label" class="metric-col">
        <el-card shadow="hover" class="metric-card" v-loading="loading">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
          <div class="metric-desc">{{ item.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="data-row data-section">
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header">
            <div>
              <div class="card-title">业务表统计</div>
              <div class="card-subtitle">快速了解各核心表的数据量与管理入口</div>
            </div>
          </div>
          <el-table v-loading="loading" :data="tableStats" size="small" stripe class="panel-table">
            <el-table-column label="表名" prop="displayName" min-width="120" />
            <el-table-column label="记录数" prop="recordCount" width="90" align="center" />
            <el-table-column label="用途说明" prop="description" min-width="200" :show-overflow-tooltip="true" />
            <el-table-column label="操作" width="120" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="go(scope.row.routePath)">{{ scope.row.routeLabel }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header">
            <div>
              <div class="card-title">最近竞赛数据</div>
              <div class="card-subtitle">查看近期场次状态、题量与参赛规模变化</div>
            </div>
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
    </el-row>

    <el-row :gutter="20" class="data-row data-section">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header">
            <div>
              <div class="card-title">待审核队列</div>
              <div class="card-subtitle">优先处理用户资料审核，降低积压风险</div>
            </div>
          </div>
          <el-table v-loading="loading" :data="pendingReviews" size="small" stripe class="panel-table">
            <el-table-column label="用户" prop="username" min-width="120" />
            <el-table-column label="昵称" prop="nickname" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="审核类型" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="small" type="warning">{{ reviewTypeLabel(scope.row.reviewType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="积分" prop="score" width="80" align="center" />
            <el-table-column label="进入处理" width="110" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="go(scope.row.reviewType === 'avatar' ? '/quiz/avatar-audit' : '/quiz/nickname-audit')">去审核</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header">
            <div>
              <div class="card-title">积分榜快照</div>
              <div class="card-subtitle">聚焦当前头部用户与展示资料的一致性</div>
            </div>
          </div>
          <el-table v-loading="loading" :data="topUsers" size="small" stripe class="panel-table">
            <el-table-column label="排名" prop="rank" width="70" align="center" />
            <el-table-column label="用户" min-width="180">
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
            <el-table-column label="详情" width="100" align="center">
              <template>
                <el-button type="text" size="mini" @click="go('/quiz/leaderboard')">查看榜单</el-button>
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
  name: 'QuizDataCenter',
  data() {
    return {
      loading: false,
      metrics: {},
      tableStats: [],
      recentCompetitions: [],
      pendingReviews: [],
      topUsers: []
    }
  },
  computed: {
    metricCards() {
      return [
        { label: '题目总数', value: this.metrics.questionCount || 0, desc: '题库当前可维护题目' },
        { label: '竞赛总数', value: this.metrics.competitionCount || 0, desc: '已创建的竞赛场次' },
        { label: '活跃竞赛', value: this.metrics.activeCompetitionCount || 0, desc: '当前进行中的竞赛' },
        { label: '参赛用户', value: this.metrics.userCount || 0, desc: '业务侧注册用户' },
        { label: '答题记录', value: this.metrics.submissionCount || 0, desc: '累计提交的答题次数' },
        { label: '待审资料', value: this.metrics.pendingReviewCount || 0, desc: '昵称或头像待处理' }
      ]
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
.data-center-page {
  --page-bg: #f5f7fb;
  --surface-soft: #f8fafc;
  --surface-strong: #eff6ff;
  --border-color: #e2e8f0;
  --text-strong: #0f172a;
  --text-muted: #64748b;
  --text-subtle: #94a3b8;
  --shadow-soft: 0 16px 34px rgba(15, 23, 42, 0.06);
  --shadow-hover: 0 20px 40px rgba(15, 23, 42, 0.1);
  padding: 24px;
  background: var(--page-bg);
}

.mb16 {
  margin-bottom: 16px;
}

.page-intro {
  margin-bottom: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-strong);
}

.page-subtitle {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-muted);
}

.data-row {
  & + & {
    margin-top: 20px;
  }
}

.metric-card,
.panel-card {
  border: 1px solid var(--border-color);
  border-radius: 18px;
  overflow: hidden;
}

.metric-card {
  min-height: 138px;
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

::v-deep .panel-card .el-card__header {
  padding: 20px 22px 0;
  border-bottom: none;
}

::v-deep .panel-card .el-card__body {
  padding: 20px 22px 22px;
}

.metric-label {
  color: var(--text-muted);
  font-size: 13px;
}

.metric-value {
  margin-top: 12px;
  color: var(--text-strong);
  font-size: 32px;
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-copy {
  min-width: 0;
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
  border: 1px solid #dcdfe6;
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
  background: var(--surface-soft);
}

::v-deep .panel-table td {
  padding: 13px 0;
}

::v-deep .panel-table .el-table__row:hover > td {
  background: #f8fbff !important;
}

@media (max-width: 767px) {
  .data-center-page {
    padding: 16px;
  }

  ::v-deep .panel-card .el-card__header,
  ::v-deep .panel-card .el-card__body {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
