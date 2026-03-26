<template>
  <div class="app-container">
    <el-alert
      title="仅展示待审核昵称；审核通过或拒绝后会自动给用户发送站内消息。"
      type="info"
      :closable="false"
      show-icon
      class="mb16"
    />

    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="关键词" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="用户名 / 昵称 / 邮箱"
          clearable
          style="width: 260px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="nicknameList">
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="用户名" align="center" prop="username" min-width="140" />
      <el-table-column label="待审昵称" align="center" prop="nickname" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="邮箱" align="center" prop="email" min-width="220" :show-overflow-tooltip="true" />
      <el-table-column label="提交时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-circle-check" :disabled="reviewingId === scope.row.id" @click="handleReview(scope.row, 'approved')" v-hasPermi="['quiz:user:audit']">通过</el-button>
          <el-button size="mini" type="text" icon="el-icon-circle-close" :disabled="reviewingId === scope.row.id" @click="handleReview(scope.row, 'rejected')" v-hasPermi="['quiz:user:audit']">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listPendingNicknames, reviewNickname } from '@/api/quiz/user'

export default {
  name: 'QuizNicknameAudit',
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      nicknameList: [],
      reviewingId: undefined,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        keyword: undefined
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listPendingNicknames(this.queryParams).then(response => {
        this.nicknameList = response.rows || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    removeHandledRecord(id) {
      this.nicknameList = this.nicknameList.filter(item => item.id !== id)
      this.total = Math.max(this.total - 1, 0)
      if (!this.nicknameList.length && this.queryParams.pageNum > 1) {
        this.queryParams.pageNum -= 1
        this.getList()
      }
    },
    handleReview(row, status) {
      const actionText = status === 'approved' ? '通过' : '拒绝'
      this.$modal.confirm('是否确认' + actionText + '用户“' + row.username + '”的昵称申请？').then(() => {
        this.reviewingId = row.id
        return reviewNickname({
          id: row.id,
          nicknameStatus: status
        })
      }).then(() => {
        this.$modal.msgSuccess('昵称审核已处理')
        this.removeHandledRecord(row.id)
      }).finally(() => {
        this.reviewingId = undefined
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.mb16 {
  margin-bottom: 16px;
}
</style>
