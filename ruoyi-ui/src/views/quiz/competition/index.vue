<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="竞赛标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入竞赛标题"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="竞赛状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择竞赛状态" clearable style="width: 160px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['quiz:competition:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate" v-hasPermi="['quiz:competition:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete" v-hasPermi="['quiz:competition:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-refresh" size="mini" @click="handleSyncStatus" v-hasPermi="['quiz:competition:edit']">同步状态</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="competitionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="竞赛标题" align="center" prop="title" min-width="220" :show-overflow-tooltip="true" />
      <el-table-column label="竞赛状态" align="center" prop="status" width="110">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)" size="small">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="题目数" align="center" prop="questionCount" width="90" />
      <el-table-column label="总分" align="center" prop="totalPoints" width="90" />
      <el-table-column label="时间范围" align="center" min-width="280">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startDate) }} ~ {{ parseTime(scope.row.endDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="题目概览" align="center" prop="questionTitles" min-width="220" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="160">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['quiz:competition:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['quiz:competition:remove']">删除</el-button>
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

    <el-dialog :title="title" :visible.sync="open" width="760px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="竞赛标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入竞赛标题" maxlength="255" />
        </el-form-item>
        <el-form-item label="竞赛描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入竞赛描述" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="竞赛状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择竞赛状态" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="竞赛时间" prop="timeRange">
              <el-date-picker
                v-model="timeRange"
                type="datetimerange"
                value-format="yyyy-MM-dd HH:mm:ss"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关联题目" prop="questionIds">
          <el-select v-model="form.questionIds" multiple filterable placeholder="请选择竞赛题目" style="width: 100%">
            <el-option
              v-for="item in questionOptions"
              :key="item.id"
              :label="`${item.title}（${item.category || '未分类'} / ${difficultyLabel(item.difficulty)} / ${item.points}分）`"
              :value="item.id"
            />
          </el-select>
          <div class="selection-summary">
            <el-tag size="small" effect="plain">已选 {{ selectedQuestionCount }} 题</el-tag>
            <el-tag size="small" type="success" effect="plain">预计总分 {{ selectedTotalPoints }}</el-tag>
            <el-tag size="small" type="info" effect="plain">建议状态 {{ suggestedStatusLabel }}</el-tag>
          </div>
          <div class="form-tip">提交后会自动重新计算总分，并按当前时间范围校验状态是否合理。</div>
          <div v-if="selectedQuestionDetails.length" class="question-preview-list">
            <div v-for="item in selectedQuestionDetails" :key="item.id" class="question-preview-item">
              <div class="question-preview-title">{{ item.title }}</div>
              <div class="question-preview-meta">
                <span>{{ item.category || '未分类' }}</span>
                <span>{{ difficultyLabel(item.difficulty) }}</span>
                <span>{{ item.points || 0 }} 分</span>
              </div>
            </div>
          </div>
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
import { listCompetition, getCompetition, addCompetition, updateCompetition, delCompetition, syncCompetitionStatus } from '@/api/quiz/competition'
import { optionselectQuestion } from '@/api/quiz/question'

const statusOptions = [
  { label: '未开始', value: 'upcoming' },
  { label: '进行中', value: 'active' },
  { label: '已结束', value: 'ended' }
]

const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]

const createDefaultForm = () => ({
  id: undefined,
  title: undefined,
  description: undefined,
  status: 'upcoming',
  questionIds: []
})

export default {
  name: 'QuizCompetition',
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      open: false,
      title: '',
      competitionList: [],
      questionOptions: [],
      statusOptions,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: undefined,
        status: undefined
      },
      form: createDefaultForm(),
      timeRange: [],
      rules: {
        title: [
          { required: true, message: '竞赛标题不能为空', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '竞赛描述不能为空', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '竞赛状态不能为空', trigger: 'change' }
        ],
        questionIds: [
          { required: true, message: '请至少选择一道题目', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    selectedQuestionDetails() {
      const idMap = new Map(this.questionOptions.map(item => [item.id, item]))
      return (this.form.questionIds || []).map(id => idMap.get(id)).filter(Boolean)
    },
    selectedQuestionCount() {
      return this.selectedQuestionDetails.length
    },
    selectedTotalPoints() {
      return this.selectedQuestionDetails.reduce((sum, item) => sum + Number(item.points || 0), 0)
    },
    suggestedStatusLabel() {
      if (!this.timeRange || this.timeRange.length !== 2) {
        return '待设置时间'
      }
      const now = new Date().getTime()
      const start = new Date(this.timeRange[0]).getTime()
      const end = new Date(this.timeRange[1]).getTime()
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return '待校验'
      }
      if (start > now) {
        return '未开始'
      }
      if (end < now) {
        return '已结束'
      }
      return '进行中'
    }
  },
  created() {
    this.getList()
    this.loadQuestionOptions()
  },
  methods: {
    getList() {
      this.loading = true
      listCompetition(this.queryParams).then(response => {
        this.competitionList = response.rows || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    loadQuestionOptions() {
      optionselectQuestion().then(response => {
        this.questionOptions = response.data || []
      })
    },
    reset() {
      this.form = createDefaultForm()
      this.timeRange = []
      this.resetForm('form')
    },
    cancel() {
      this.open = false
      this.reset()
    },
    statusLabel(value) {
      const matched = this.statusOptions.find(item => item.value === value)
      return matched ? matched.label : value || '-'
    },
    statusTagType(value) {
      if (value === 'upcoming') {
        return 'info'
      }
      if (value === 'active') {
        return 'success'
      }
      if (value === 'ended') {
        return 'warning'
      }
      return 'info'
    },
    difficultyLabel(value) {
      const matched = difficultyOptions.find(item => item.value === value)
      return matched ? matched.label : value || '未知'
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '新增竞赛'
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getCompetition(id).then(response => {
        const data = response.data || {}
        this.form = {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status || 'upcoming',
          questionIds: data.questionIds || []
        }
        this.timeRange = [data.startDate, data.endDate]
        this.open = true
        this.title = '修改竞赛'
      })
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) {
          return
        }
        if (!this.timeRange || this.timeRange.length !== 2) {
          this.$modal.msgError('请选择完整的竞赛时间范围')
          return
        }
        if (!this.form.questionIds || !this.form.questionIds.length) {
          this.$modal.msgError('请至少选择一道题目')
          return
        }

        const payload = {
          id: this.form.id,
          title: this.form.title,
          description: this.form.description,
          status: this.form.status,
          startDate: this.timeRange[0],
          endDate: this.timeRange[1],
          questionIds: this.form.questionIds
        }

        const request = payload.id ? updateCompetition(payload) : addCompetition(payload)
        request.then(() => {
          this.$modal.msgSuccess(payload.id ? '修改成功' : '新增成功')
          this.open = false
          this.getList()
        })
      })
    },
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除竞赛编号为"' + ids + '"的数据项？').then(() => {
        return delCompetition(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleSyncStatus() {
      syncCompetitionStatus().then(() => {
        this.$modal.msgSuccess('竞赛状态同步成功')
        this.getList()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.form-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.selection-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.question-preview-list {
  margin-top: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  max-height: 220px;
  overflow-y: auto;
}

.question-preview-item {
  padding: 10px 12px;
  border-bottom: 1px solid #f2f6fc;
}

.question-preview-item:last-child {
  border-bottom: none;
}

.question-preview-title {
  color: #303133;
  font-weight: 500;
  line-height: 1.5;
}

.question-preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}
</style>
