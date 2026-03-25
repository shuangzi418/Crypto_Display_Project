<template>
  <div class="app-container dashboard-home">
    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="hero-card">
          <div class="hero-eyebrow">Operations Console</div>
          <h2>{{ title }}</h2>
          <p>
            聚焦密码知识竞赛的题库、竞赛、审核与排行榜运营，首页直接展示关键指标、竞赛动态和待处理数据。
          </p>
          <div class="hero-actions">
            <el-button type="primary" icon="el-icon-notebook-2" @click="go('/quiz/question')">题目管理</el-button>
            <el-button plain icon="el-icon-date" @click="go('/quiz/competition')">竞赛管理</el-button>
            <el-button plain icon="el-icon-s-data" @click="go('/quiz/leaderboard')">排行榜</el-button>
            <el-button plain icon="el-icon-tickets" @click="go('/quiz/data')">数据管理</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel-card highlight-panel">
          <div slot="header" class="card-header">
            <span>运营摘要</span>
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

    <el-row :gutter="16" class="mt16">
      <el-col :xs="12" :sm="8" :lg="4" v-for="item in metricCards" :key="item.label">
        <el-card shadow="hover" class="metric-card" v-loading="loading">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
          <div class="metric-desc">{{ item.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt20">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header between-header">
            <span>最近竞赛动态</span>
            <el-button type="text" @click="go('/quiz/competition')">查看全部</el-button>
          </div>
          <el-table v-loading="loading" :data="recentCompetitions" size="small">
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
            <span>待处理资料</span>
            <el-button type="text" @click="go('/quiz/nickname-audit')">进入审核</el-button>
          </div>
          <el-table v-loading="loading" :data="pendingReviews" size="small">
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

    <el-row :gutter="20" class="mt20">
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header between-header">
            <span>积分榜前列</span>
            <el-button type="text" @click="go('/quiz/leaderboard')">查看榜单</el-button>
          </div>
          <el-table v-loading="loading" :data="topUsers" size="small">
            <el-table-column label="排名" prop="rank" width="70" align="center" />
            <el-table-column label="用户" min-width="170">
              <template slot-scope="scope">
                <div class="user-cell">
                  <img v-if="scope.row.avatar && scope.row.avatarStatus === 'approved'" :src="scope.row.avatar" class="avatar-image" />
                  <div v-else class="avatar-placeholder">{{ (scope.row.username || '?').slice(0, 1).toUpperCase() }}</div>
                  <div>
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
            <span>业务表统计</span>
            <el-button type="text" @click="go('/quiz/data')">进入数据管理</el-button>
          </div>
          <el-table v-loading="loading" :data="tableStats" size="small">
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
      if (row.nickname && row.nicknameStatus === 'approved') {
        return row.nickname
      }
      return row.username || '-'
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-home {
  background: #f5f7fb;
}

.hero-card,
.panel-card,
.metric-card {
  border: none;
}

.hero-card {
  min-height: 240px;
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

.highlight-panel {
  min-height: 240px;
}

.highlight-grid {
  display: grid;
  gap: 14px;
}

.highlight-item {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
}

.highlight-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.highlight-label {
  margin-top: 4px;
  color: #334155;
  font-size: 14px;
}

.highlight-desc {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.metric-card {
  min-height: 132px;
  margin-bottom: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.metric-label {
  color: #64748b;
  font-size: 13px;
}

.metric-value {
  margin-top: 12px;
  color: #0f172a;
  font-size: 30px;
  font-weight: 700;
}

.metric-desc {
  margin-top: 10px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.6;
}

.card-header {
  font-weight: 600;
  color: #0f172a;
}

.between-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
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
  background: #e0f2fe;
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

.mt16 {
  margin-top: 16px;
}

.mt20 {
  margin-top: 20px;
}
</style>
