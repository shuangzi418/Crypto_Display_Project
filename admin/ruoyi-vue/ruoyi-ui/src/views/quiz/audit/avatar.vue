<template>
  <div class="app-container audit-page">
    <el-alert
      title="仅展示待审核头像；审核完成后会自动给用户发送站内消息。"
      type="info"
      :closable="false"
      show-icon
      class="mb16"
    />

    <div class="audit-overview">
      <div class="audit-overview__item">
        <span>待处理记录</span>
        <strong>{{ total }}</strong>
      </div>
      <div class="audit-overview__item audit-overview__item--muted">
        <span>当前页</span>
        <strong>{{ queryParams.pageNum }}</strong>
      </div>
    </div>

    <el-card shadow="never" class="audit-card filter-card">
      <div slot="header" class="section-header between-header">
        <div>
          <div class="section-title">筛选待审头像</div>
          <div class="section-subtitle">按用户名、昵称或邮箱快速缩小审核范围</div>
        </div>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
      </div>
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px" class="audit-form">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="用户名 / 昵称 / 邮箱"
            clearable
            style="width: 280px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="audit-card table-card">
      <div slot="header" class="section-header">
        <div>
          <div class="section-title">头像审核队列</div>
          <div class="section-subtitle">放大头像预览与用户信息并排展示，减少误判</div>
        </div>
      </div>
      <el-table v-loading="loading" :data="avatarList" stripe class="audit-table">
        <el-table-column label="ID" align="center" prop="id" width="80" />
        <el-table-column label="头像" align="center" width="124">
          <template slot-scope="scope">
            <div class="avatar-box">
              <img v-if="scope.row.avatar" :src="scope.row.avatar" class="avatar-image" />
              <span v-else class="avatar-empty">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户名" align="center" prop="username" min-width="140" />
        <el-table-column label="当前昵称" align="center" prop="nickname" min-width="180" :show-overflow-tooltip="true">
          <template slot-scope="scope">
            <div class="nickname-cell">{{ scope.row.nickname || '-' }}</div>
          </template>
        </el-table-column>
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
    </el-card>
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
.audit-page {
  --page-bg: #f5f7fb;
  --surface: #ffffff;
  --surface-soft: #f8fafc;
  --border-color: #e2e8f0;
  --text-strong: #0f172a;
  --text-muted: #64748b;
  padding: 24px;
  background: var(--page-bg);
}

.mb16 {
  margin-bottom: 16px;
}

.audit-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.audit-overview__item {
  min-width: 120px;
  padding: 12px 16px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #eff6ff;

  span {
    display: block;
    font-size: 12px;
    color: #1d4ed8;
  }

  strong {
    display: block;
    margin-top: 6px;
    font-size: 24px;
    line-height: 1;
    color: #0f172a;
  }
}

.audit-overview__item--muted {
  border-color: var(--border-color);
  background: var(--surface-soft);

  span {
    color: var(--text-muted);
  }
}

.audit-card {
  border: 1px solid var(--border-color);
  border-radius: 18px;
  overflow: hidden;
}

.filter-card {
  margin-bottom: 16px;
}

::v-deep .audit-card .el-card__header {
  padding: 20px 22px 0;
  border-bottom: none;
}

::v-deep .audit-card .el-card__body {
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

.audit-form {
  margin-bottom: -8px;
}

.avatar-box {
  display: flex;
  justify-content: center;
}

.avatar-empty {
  color: #94a3b8;
}

.nickname-cell {
  font-weight: 600;
  color: #334155;
}

.avatar-image {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
  background: #f5f7fa;
  border: 1px solid #dbe4ee;
}

::v-deep .audit-table {
  border-radius: 14px;
  overflow: hidden;
}

::v-deep .audit-table th.is-leaf {
  background: var(--surface-soft);
}

::v-deep .audit-table td {
  padding: 13px 0;
}

::v-deep .audit-table .el-table__row:hover > td {
  background: #f8fbff !important;
}

@media (max-width: 767px) {
  .audit-page {
    padding: 16px;
  }

  .between-header {
    flex-direction: column;
    align-items: flex-start;
  }

  ::v-deep .audit-card .el-card__header,
  ::v-deep .audit-card .el-card__body {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
