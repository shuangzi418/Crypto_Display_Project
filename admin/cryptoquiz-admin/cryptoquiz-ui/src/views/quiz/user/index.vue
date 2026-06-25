<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="queryParams.username"
          placeholder="请输入用户名"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入昵称"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="queryParams.role" placeholder="请选择角色" clearable style="width: 160px">
          <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="userList">
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="头像" align="center" width="90">
        <template slot-scope="scope">
          <div class="avatar-box">
            <img v-if="scope.row.avatar" :src="scope.row.avatar" class="avatar-image" />
            <span v-else>-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="用户名" align="center" prop="username" min-width="140" />
      <el-table-column label="昵称" align="center" prop="nickname" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="邮箱" align="center" prop="email" min-width="200" :show-overflow-tooltip="true" />
      <el-table-column label="积分" align="center" prop="score" width="90" />
      <el-table-column label="业务角色" align="center" prop="role" width="110">
        <template slot-scope="scope">
          <el-tag :type="roleTagType(scope.row.role)" size="small">{{ roleLabel(scope.row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="昵称审核" align="center" prop="nicknameStatus" width="120">
        <template slot-scope="scope">
          <el-tag :type="auditTagType(scope.row.nicknameStatus)" size="small">{{ auditLabel(scope.row.nicknameStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="头像审核" align="center" prop="avatarStatus" width="120">
        <template slot-scope="scope">
          <el-tag :type="auditTagType(scope.row.avatarStatus)" size="small">{{ auditLabel(scope.row.avatarStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="130">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleRole(scope.row)" v-hasPermi="['quiz:user:edit']">调整角色</el-button>
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

    <el-dialog :title="title" :visible.sync="open" width="420px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" disabled />
        </el-form-item>
        <el-form-item label="当前昵称">
          <el-input v-model="form.nickname" disabled />
        </el-form-item>
        <el-form-item label="业务角色" prop="role">
          <el-radio-group v-model="form.role">
            <el-radio v-for="item in roleOptions" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listBusinessUser, changeBusinessUserRole } from '@/api/quiz/user'

const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: '旧系统管理员', value: 'admin' }
]

const auditOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
]

export default {
  name: 'QuizBusinessUser',
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      open: false,
      title: '',
      userList: [],
      roleOptions,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        username: undefined,
        nickname: undefined,
        role: undefined
      },
      form: {},
      rules: {
        role: [
          { required: true, message: '业务角色不能为空', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listBusinessUser(this.queryParams).then(response => {
        this.userList = response.rows || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    reset() {
      this.form = {
        id: undefined,
        username: undefined,
        nickname: undefined,
        role: 'user'
      }
      this.resetForm('form')
    },
    cancel() {
      this.open = false
      this.reset()
    },
    roleLabel(value) {
      const matched = this.roleOptions.find(item => item.value === value)
      return matched ? matched.label : value || '-'
    },
    roleTagType(value) {
      return value === 'admin' ? 'danger' : 'success'
    },
    auditLabel(value) {
      const matched = auditOptions.find(item => item.value === value)
      return matched ? matched.label : value || '-'
    },
    auditTagType(value) {
      if (value === 'approved') {
        return 'success'
      }
      if (value === 'rejected') {
        return 'danger'
      }
      return 'warning'
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleRole(row) {
      this.reset()
      this.form = {
        id: row.id,
        username: row.username,
        nickname: row.nickname,
        role: row.role
      }
      this.open = true
      this.title = '调整业务角色'
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) {
          return
        }
        changeBusinessUserRole({
          id: this.form.id,
          role: this.form.role
        }).then(() => {
          this.$modal.msgSuccess('角色调整成功')
          this.open = false
          this.getList()
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.avatar-box {
  display: flex;
  justify-content: center;
}

.avatar-image {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
}
</style>
