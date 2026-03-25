<template>
  <div class="app-container data-center-page">
    <el-alert
      title="这是项目专用数据管理页，只展示竞赛业务核心表的统计与数据快照，不直接暴露通用数据库操作。"
      type="info"
      :closable="false"
      show-icon
      class="mb16"
    />

    <el-row :gutter="16">
      <el-col :xs="12" :sm="8" :lg="4" v-for="item in metricCards" :key="item.label">
        <el-card shadow="hover" class="metric-card" v-loading="loading">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
          <div class="metric-desc">{{ item.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt20">
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header">
            <span>业务表统计</span>
          </div>
          <el-table v-loading="loading" :data="tableStats" size="small">
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
            <span>最近竞赛数据</span>
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
    </el-row>

    <el-row :gutter="20" class="mt20">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="panel-card">
          <div slot="header" class="card-header">
            <span>待审核队列</span>
          </div>
          <el-table v-loading="loading" :data="pendingReviews" size="small">
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
            <span>积分榜快照</span>
          </div>
          <el-table v-loading="loading" :data="topUsers" size="small">
            <el-table-column label="排名" prop="rank" width="70" align="center" />
            <el-table-column label="用户" min-width="180">
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
      if (row.nickname && row.nicknameStatus === 'approved') {
        return row.nickname
      }
      return row.username || '-'
    }
  }
}
</script>

<style lang="scss" scoped>
.mb16 {
  margin-bottom: 16px;
}

.mt20 {
  margin-top: 20px;
}

.metric-card,
.panel-card {
  border: none;
}

.metric-card {
  min-height: 138px;
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
  font-size: 32px;
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
</style>
