<template>
  <div class="app-container">
    <el-alert
      title="仅展示待审核头像；审核完成后会自动给用户发送站内消息。"
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

    <el-table v-loading="loading" :data="avatarList">
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="头像" align="center" width="110">
        <template slot-scope="scope">
          <div class="avatar-box">
            <img v-if="scope.row.avatar" :src="scope.row.avatar" class="avatar-image" />
            <span v-else>-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="用户名" align="center" prop="username" min-width="140" />
      <el-table-column label="当前昵称" align="center" prop="nickname" min-width="180" :show-overflow-tooltip="true" />
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
import { listPendingAvatars, reviewAvatar } from '@/api/quiz/user'

export default {
  name: 'QuizAvatarAudit',
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      avatarList: [],
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
      listPendingAvatars(this.queryParams).then(response => {
        this.avatarList = response.rows || []
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
      this.avatarList = this.avatarList.filter(item => item.id !== id)
      this.total = Math.max(this.total - 1, 0)
      if (!this.avatarList.length && this.queryParams.pageNum > 1) {
        this.queryParams.pageNum -= 1
        this.getList()
      }
    },
    handleReview(row, status) {
      const actionText = status === 'approved' ? '通过' : '拒绝'
      this.$modal.confirm('是否确认' + actionText + '用户“' + row.username + '”的头像申请？').then(() => {
        this.reviewingId = row.id
        return reviewAvatar({
          id: row.id,
          avatarStatus: status
        })
      }).then(() => {
        this.$modal.msgSuccess('头像审核已处理')
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

.avatar-box {
  display: flex;
  justify-content: center;
}

.avatar-image {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
}
</style>
