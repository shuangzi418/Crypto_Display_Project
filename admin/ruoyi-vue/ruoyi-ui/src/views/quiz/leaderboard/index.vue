<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="总排行榜" name="overall">
        <el-form :model="overallQueryParams" ref="overallQueryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
          <el-form-item label="关键词" prop="keyword">
            <el-input
              v-model="overallQueryParams.keyword"
              placeholder="用户名 / 昵称 / 邮箱"
              clearable
              style="width: 260px"
              @keyup.enter.native="handleOverallQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleOverallQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetOverallQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getOverallList" />
        </el-row>

        <el-table v-loading="overallLoading" :data="overallList">
          <el-table-column label="排名" align="center" prop="rank" width="80" />
          <el-table-column label="用户" min-width="240">
            <template slot-scope="scope">
              <div class="user-cell">
                <img v-if="scope.row.avatar && scope.row.avatarStatus === 'approved'" :src="scope.row.avatar" class="avatar-image" />
                <div v-else class="avatar-placeholder">{{ scope.row.username ? scope.row.username.slice(0, 1).toUpperCase() : '?' }}</div>
                <div>
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
      </el-tab-pane>

      <el-tab-pane label="竞赛排行榜" name="competition">
        <el-form :model="competitionQueryParams" ref="competitionQueryForm" size="small" :inline="true" v-show="showSearch" label-width="82px">
          <el-form-item label="竞赛选择" prop="competitionId">
            <el-select v-model="competitionQueryParams.competitionId" placeholder="请选择竞赛" clearable filterable style="width: 320px" @change="handleCompetitionChange">
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
              style="width: 220px"
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

        <el-table v-loading="competitionLoading" :data="competitionList">
          <el-table-column label="排名" align="center" prop="rank" width="80" />
          <el-table-column label="用户" min-width="240">
            <template slot-scope="scope">
              <div class="user-cell">
                <img v-if="scope.row.avatar && scope.row.avatarStatus === 'approved'" :src="scope.row.avatar" class="avatar-image" />
                <div v-else class="avatar-placeholder">{{ scope.row.username ? scope.row.username.slice(0, 1).toUpperCase() : '?' }}</div>
                <div>
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
      if (row.nickname && row.nicknameStatus === 'approved') {
        return row.nickname
      }
      return row.username || '-'
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
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
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
  margin-bottom: 16px;
}
</style>
