<template>
  <div class="app-container leaderboard-page">
    <div class="page-intro">
      <div>
        <div class="page-title">排行榜管理</div>
        <div class="page-subtitle">对比总榜和竞赛榜表现，快速定位头部用户与当前场次成绩</div>
      </div>
    </div>
    <el-tabs v-model="activeTab" @tab-click="handleTabChange" class="leaderboard-tabs">
      <el-tab-pane label="总排行榜" name="overall">
        <el-card shadow="never" class="leaderboard-card filter-card">
          <div slot="header" class="section-header between-header">
            <div>
              <div class="section-title">总榜筛选</div>
              <div class="section-subtitle">按用户信息筛选累计积分榜结果</div>
            </div>
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getOverallList" />
          </div>
          <el-form :model="overallQueryParams" ref="overallQueryForm" size="small" :inline="true" v-show="showSearch" label-width="68px" class="leaderboard-form">
            <el-form-item label="关键词" prop="keyword">
              <el-input
                v-model="overallQueryParams.keyword"
                placeholder="用户名 / 昵称 / 邮箱"
                clearable
                style="width: 280px"
                @keyup.enter.native="handleOverallQuery"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleOverallQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="mini" @click="resetOverallQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="leaderboard-card table-card">
          <div slot="header" class="section-header">
            <div>
              <div class="section-title">总排行榜</div>
              <div class="section-subtitle">展示累计积分与资料审核状态，便于联合判断榜单质量</div>
            </div>
          </div>
          <el-table v-loading="overallLoading" :data="overallList" stripe class="leaderboard-table">
          <el-table-column label="排名" align="center" prop="rank" width="80" />
          <el-table-column label="用户" min-width="240">
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
          <el-table-column label="资料状态" align="center" width="170">
            <template slot-scope="scope">
              <el-tag size="small" :type="auditTagType(scope.row.nicknameStatus)">昵称{{ auditLabel(scope.row.nicknameStatus) }}</el-tag>
              <el-tag size="small" :type="auditTagType(scope.row.avatarStatus)">头像{{ auditLabel(scope.row.avatarStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="累计积分" align="center" prop="score" width="120" />
        </el-table>

          <pagination
            v-show="overallTotal > 0"
            :total="overallTotal"
            :page.sync="overallQueryParams.pageNum"
            :limit.sync="overallQueryParams.pageSize"
            @pagination="getOverallList"
          />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="竞赛排行榜" name="competition">
        <el-card shadow="never" class="leaderboard-card filter-card">
          <div slot="header" class="section-header between-header">
            <div>
              <div class="section-title">竞赛榜筛选</div>
              <div class="section-subtitle">切换场次并查看对应的实时榜单分布</div>
            </div>
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getCompetitionList" />
          </div>
          <el-form :model="competitionQueryParams" ref="competitionQueryForm" size="small" :inline="true" v-show="showSearch" label-width="82px" class="leaderboard-form">
            <el-form-item label="竞赛选择" prop="competitionId">
              <el-select v-model="competitionQueryParams.competitionId" placeholder="请选择竞赛" clearable filterable style="width: 340px" @change="handleCompetitionChange">
                <el-option
                  v-for="item in competitionOptions"
                  :key="item.id"
                  :label="`${item.title}（${statusLabel(item.status)}）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词" prop="keyword">
              <el-input
                v-model="competitionQueryParams.keyword"
                placeholder="用户名 / 昵称 / 邮箱"
                clearable
                style="width: 240px"
                @keyup.enter.native="handleCompetitionQuery"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleCompetitionQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="mini" @click="resetCompetitionQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div v-if="selectedCompetitionSummary" class="competition-summary">
            <el-tag size="small">{{ selectedCompetitionSummary.title }}</el-tag>
            <el-tag size="small" type="info">{{ statusLabel(selectedCompetitionSummary.status) }}</el-tag>
            <el-tag size="small" type="success">题目 {{ selectedCompetitionSummary.questionCount || 0 }} 道</el-tag>
            <el-tag size="small" type="warning">总分 {{ selectedCompetitionSummary.totalPoints || 0 }}</el-tag>
          </div>
        </el-card>

        <el-card shadow="never" class="leaderboard-card table-card">
          <div slot="header" class="section-header">
            <div>
              <div class="section-title">竞赛排行榜</div>
              <div class="section-subtitle">按场次查看得分与完赛状态，便于复盘竞争表现</div>
            </div>
          </div>
          <el-table v-loading="competitionLoading" :data="competitionList" stripe class="leaderboard-table">
          <el-table-column label="排名" align="center" prop="rank" width="80" />
          <el-table-column label="用户" min-width="240">
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
          <el-table-column label="竞赛得分" align="center" prop="score" width="120" />
          <el-table-column label="完赛状态" align="center" width="120">
            <template slot-scope="scope">
              <el-tag size="small" :type="scope.row.completed ? 'success' : 'warning'">{{ scope.row.completed ? '已完赛' : '进行中' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>

          <pagination
            v-show="competitionTotal > 0"
            :total="competitionTotal"
            :page.sync="competitionQueryParams.pageNum"
            :limit.sync="competitionQueryParams.pageSize"
            @pagination="getCompetitionList"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { listOverallLeaderboard, listCompetitionLeaderboard, listLeaderboardCompetitionOptions } from '@/api/quiz/leaderboard'

const competitionStatusOptions = [
  { label: '未开始', value: 'upcoming' },
  { label: '进行中', value: 'active' },
  { label: '已结束', value: 'ended' }
]

export default {
  name: 'QuizLeaderboard',
  data() {
    return {
      activeTab: 'overall',
      showSearch: true,
      overallLoading: false,
      competitionLoading: false,
      overallTotal: 0,
      competitionTotal: 0,
      overallList: [],
      competitionList: [],
      competitionOptions: [],
      overallQueryParams: {
        pageNum: 1,
        pageSize: 10,
        keyword: undefined
      },
      competitionQueryParams: {
        pageNum: 1,
        pageSize: 10,
        competitionId: undefined,
        keyword: undefined
      }
    }
  },
  computed: {
    selectedCompetitionSummary() {
      return this.competitionOptions.find(item => item.id === this.competitionQueryParams.competitionId)
    }
  },
  created() {
    this.getOverallList()
    this.getCompetitionOptions()
  },
  methods: {
    getOverallList() {
      this.overallLoading = true
      listOverallLeaderboard(this.overallQueryParams).then(response => {
        this.overallList = response.rows || []
        this.overallTotal = response.total || 0
        this.overallLoading = false
      }).catch(() => {
        this.overallLoading = false
      })
    },
    getCompetitionOptions() {
      listLeaderboardCompetitionOptions().then(response => {
        this.competitionOptions = response.data || []
        if (!this.competitionQueryParams.competitionId && this.competitionOptions.length) {
          this.competitionQueryParams.competitionId = this.competitionOptions[0].id
          this.getCompetitionList()
        }
      })
    },
    getCompetitionList() {
      if (!this.competitionQueryParams.competitionId) {
        this.competitionList = []
        this.competitionTotal = 0
        return
      }
      this.competitionLoading = true
      listCompetitionLeaderboard(this.competitionQueryParams).then(response => {
        this.competitionList = response.rows || []
        this.competitionTotal = response.total || 0
        this.competitionLoading = false
      }).catch(() => {
        this.competitionLoading = false
      })
    },
    handleTabChange() {
      if (this.activeTab === 'competition' && this.competitionQueryParams.competitionId) {
        this.getCompetitionList()
      }
    },
    handleOverallQuery() {
      this.overallQueryParams.pageNum = 1
      this.getOverallList()
    },
    resetOverallQuery() {
      this.resetForm('overallQueryForm')
      this.handleOverallQuery()
    },
    handleCompetitionQuery() {
      this.competitionQueryParams.pageNum = 1
      this.getCompetitionList()
    },
    handleCompetitionChange() {
      this.competitionQueryParams.pageNum = 1
      this.getCompetitionList()
    },
    resetCompetitionQuery() {
      const competitionId = this.competitionQueryParams.competitionId
      this.resetForm('competitionQueryForm')
      this.competitionQueryParams.competitionId = competitionId
      this.handleCompetitionQuery()
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
    },
    auditLabel(status) {
      if (status === 'approved') {
        return '已通过'
      }
      if (status === 'rejected') {
        return '已拒绝'
      }
      return '待审核'
    },
    auditTagType(status) {
      if (status === 'approved') {
        return 'success'
      }
      if (status === 'rejected') {
        return 'danger'
      }
      return 'warning'
    },
    statusLabel(status) {
      const matched = competitionStatusOptions.find(item => item.value === status)
      return matched ? matched.label : status || '-'
    }
  }
}
</script>

<style lang="scss" scoped>
.leaderboard-page {
  --page-bg: #f5f7fb;
  --surface-soft: #f8fafc;
  --border-color: #e2e8f0;
  --text-strong: #0f172a;
  --text-muted: #64748b;
  padding: 24px;
  background: var(--page-bg);
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

::v-deep .leaderboard-tabs > .el-tabs__header {
  margin-bottom: 16px;
}

::v-deep .leaderboard-tabs > .el-tabs__header .el-tabs__nav-wrap::after {
  background-color: #e2e8f0;
}

.leaderboard-card {
  border: 1px solid var(--border-color);
  border-radius: 18px;
  overflow: hidden;
}

.filter-card {
  margin-bottom: 16px;
}

::v-deep .leaderboard-card .el-card__header {
  padding: 20px 22px 0;
  border-bottom: none;
}

::v-deep .leaderboard-card .el-card__body {
  padding: 20px 22px 22px;
}

.section-header {
  color: var(--text-strong);
}

.between-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.section-subtitle {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
}

.leaderboard-form {
  margin-bottom: -8px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-copy {
  min-width: 0;
}

.avatar-image,
.avatar-placeholder {
  width: 40px;
  height: 40px;
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

.competition-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

::v-deep .leaderboard-table {
  border-radius: 14px;
  overflow: hidden;
}

::v-deep .leaderboard-table th.is-leaf {
  background: var(--surface-soft);
}

::v-deep .leaderboard-table td {
  padding: 13px 0;
}

::v-deep .leaderboard-table .el-table__row:hover > td {
  background: #f8fbff !important;
}

@media (max-width: 767px) {
  .leaderboard-page {
    padding: 16px;
  }

  .between-header {
    flex-direction: column;
    align-items: flex-start;
  }

  ::v-deep .leaderboard-card .el-card__header,
  ::v-deep .leaderboard-card .el-card__body {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
