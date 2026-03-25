<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="题目标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入题目标题"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="题目分类" prop="category">
        <el-input
          v-model="queryParams.category"
          placeholder="请输入题目分类"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="题目难度" prop="difficulty">
        <el-select v-model="queryParams.difficulty" placeholder="请选择难度" clearable style="width: 160px">
          <el-option v-for="item in difficultyOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['quiz:question:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate" v-hasPermi="['quiz:question:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete" v-hasPermi="['quiz:question:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="el-icon-upload2" size="mini" @click="handleImport" v-hasPermi="['quiz:question:import']">批量导入</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="questionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="题目标题" align="center" prop="title" min-width="220" :show-overflow-tooltip="true" />
      <el-table-column label="题目分类" align="center" prop="category" width="140" :show-overflow-tooltip="true" />
      <el-table-column label="题目难度" align="center" prop="difficulty" width="110">
        <template slot-scope="scope">
          <el-tag :type="difficultyTagType(scope.row.difficulty)" size="small">{{ difficultyLabel(scope.row.difficulty) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="分值" align="center" prop="points" width="90" />
      <el-table-column label="选项数" align="center" width="90">
        <template slot-scope="scope">
          {{ scope.row.options ? scope.row.options.length : 0 }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="160">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['quiz:question:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['quiz:question:remove']">删除</el-button>
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
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="题目标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入题目标题" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="题目分类" prop="category">
              <el-input v-model="form.category" placeholder="请输入题目分类" maxlength="255" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="题目难度" prop="difficulty">
              <el-select v-model="form.difficulty" placeholder="请选择题目难度" style="width: 100%">
                <el-option v-for="item in difficultyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="题目分值" prop="points">
              <el-input-number v-model="form.points" :min="1" :max="1000" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="题目内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入题目内容" />
        </el-form-item>
        <el-form-item label="题目选项" required>
          <div v-for="(item, index) in form.options" :key="`option-${index}`" class="option-item">
            <span class="option-label">{{ optionLetter(index) }}</span>
            <el-input v-model="form.options[index]" placeholder="请输入选项内容" />
            <el-button
              type="text"
              icon="el-icon-delete"
              :disabled="form.options.length <= 2"
              @click="handleRemoveOption(index)"
            >删除</el-button>
          </div>
          <el-button size="mini" plain icon="el-icon-plus" @click="handleAddOption">添加选项</el-button>
        </el-form-item>
        <el-form-item label="正确答案" prop="correctAnswer">
          <el-select v-model="form.correctAnswer" placeholder="请选择正确答案" style="width: 100%">
            <el-option v-for="item in correctAnswerOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="upload.title" :visible.sync="upload.open" width="420px" append-to-body>
      <el-upload
        ref="upload"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将 Excel 文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip text-center" slot="tip">
          <div class="el-upload__tip">仅允许导入 xls、xlsx 格式文件。</div>
          <div class="el-upload__tip">模板列包含标题、题干、选项A-F、正确答案、难度、分类、分值。</div>
          <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="upload.open = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listQuestion, getQuestion, addQuestion, updateQuestion, delQuestion } from '@/api/quiz/question'
import { getToken } from '@/utils/auth'

const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]

export default {
  name: 'QuizQuestion',
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
      questionList: [],
      difficultyOptions,
      upload: {
        open: false,
        title: '',
        isUploading: false,
        headers: { Authorization: 'Bearer ' + getToken() },
        url: process.env.VUE_APP_BASE_API + '/quiz/question/importData'
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: undefined,
        category: undefined,
        difficulty: undefined
      },
      form: {},
      rules: {
        title: [
          { required: true, message: '题目标题不能为空', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '题目分类不能为空', trigger: 'blur' }
        ],
        difficulty: [
          { required: true, message: '题目难度不能为空', trigger: 'change' }
        ],
        points: [
          { required: true, message: '题目分值不能为空', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '题目内容不能为空', trigger: 'blur' }
        ],
        correctAnswer: [
          { required: true, message: '正确答案不能为空', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    correctAnswerOptions() {
      return (this.form.options || []).map((item, index) => {
        const value = item ? item.trim() : ''
        return {
          value: index,
          label: value ? `${this.optionLetter(index)}. ${value}` : `选项 ${this.optionLetter(index)}`
        }
      })
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listQuestion(this.queryParams).then(response => {
        this.questionList = response.rows || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        id: undefined,
        title: undefined,
        content: undefined,
        category: undefined,
        difficulty: 'easy',
        points: 5,
        correctAnswer: 0,
        options: ['', '']
      }
      this.resetForm('form')
    },
    difficultyLabel(value) {
      const matched = this.difficultyOptions.find(item => item.value === value)
      return matched ? matched.label : value || '-'
    },
    difficultyTagType(value) {
      if (value === 'easy') {
        return 'success'
      }
      if (value === 'medium') {
        return 'warning'
      }
      if (value === 'hard') {
        return 'danger'
      }
      return 'info'
    },
    optionLetter(index) {
      return String.fromCharCode(65 + index)
    },
    handleAddOption() {
      this.form.options.push('')
    },
    handleRemoveOption(index) {
      if (this.form.options.length <= 2) {
        return
      }
      this.form.options.splice(index, 1)
      if (this.form.correctAnswer >= this.form.options.length) {
        this.form.correctAnswer = this.form.options.length - 1
      }
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
      this.title = '新增题目'
    },
    handleImport() {
      this.upload.title = '赛题批量导入'
      this.upload.open = true
    },
    importTemplate() {
      this.download('quiz/question/importTemplate', {}, `quiz_question_template_${new Date().getTime()}.xlsx`)
    },
    handleFileUploadProgress() {
      this.upload.isUploading = true
    },
    handleFileSuccess(response) {
      this.upload.open = false
      this.upload.isUploading = false
      this.$refs.upload.clearFiles()
      this.$alert("<div style='overflow:auto;overflow-x:hidden;max-height:70vh;padding:10px 20px 0;'>" + response.msg + '</div>', '导入结果', {
        dangerouslyUseHTMLString: true
      })
      this.getList()
    },
    submitFileForm() {
      const file = this.$refs.upload.uploadFiles
      if (!file || file.length === 0 || !file[0].name.toLowerCase().endsWith('.xls') && !file[0].name.toLowerCase().endsWith('.xlsx')) {
        this.$modal.msgError('请选择后缀为 “xls”或“xlsx”的文件。')
        return
      }
      this.$refs.upload.submit()
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getQuestion(id).then(response => {
        this.form = {
          ...response.data,
          options: response.data && response.data.options && response.data.options.length ? response.data.options : ['', ''],
          correctAnswer: response.data && response.data.correctAnswer !== undefined ? response.data.correctAnswer : 0
        }
        this.open = true
        this.title = '修改题目'
      })
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) {
          return
        }
        const normalizedOptions = (this.form.options || [])
          .map(item => (item || '').trim())
          .filter(item => item)

        if (normalizedOptions.length < 2) {
          this.$modal.msgError('至少需要两个有效选项')
          return
        }

        if (this.form.correctAnswer >= normalizedOptions.length) {
          this.$modal.msgError('正确答案超出选项范围')
          return
        }

        const payload = {
          id: this.form.id,
          title: this.form.title,
          content: this.form.content,
          category: this.form.category,
          difficulty: this.form.difficulty,
          points: this.form.points,
          correctAnswer: this.form.correctAnswer,
          options: normalizedOptions
        }

        const request = payload.id ? updateQuestion(payload) : addQuestion(payload)
        request.then(() => {
          this.$modal.msgSuccess(payload.id ? '修改成功' : '新增成功')
          this.open = false
          this.getList()
        })
      })
    },
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除题目编号为"' + ids + '"的数据项？').then(() => {
        return delQuestion(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.option-label {
  width: 24px;
  color: #606266;
  font-weight: 600;
  flex-shrink: 0;
}
</style>
