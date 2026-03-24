import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Space,
  InputNumber,
  Alert,
  Upload,
  Tabs,
  Tag,
  Divider
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../axios';

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

const formatRecognitionMode = (recognitionMode) => {
  if (recognitionMode === 'header') {
    return '表头识别';
  }

  if (recognitionMode === 'column-inference') {
    return '列顺序推断';
  }

  if (recognitionMode === 'labeled-blocks') {
    return '题目块识别';
  }

  if (recognitionMode === 'json') {
    return 'JSON 识别';
  }

  return '内容识别';
};

const formatImportFeedback = (importedCount, failedCount, detectedFormatLabel, recognitionMode) => {
  const formatLabel = detectedFormatLabel || '自动识别格式';
  const modeText = formatRecognitionMode(recognitionMode);

  if (failedCount > 0) {
    return `已识别为 ${formatLabel}（${modeText}），成功导入 ${importedCount} 道题，失败 ${failedCount} 道`;
  }

  return `已识别为 ${formatLabel}（${modeText}），成功导入 ${importedCount} 道题`;
};

const formatPreviewFeedback = (validCount, failedCount, detectedFormatLabel, recognitionMode) => {
  const formatLabel = detectedFormatLabel || '自动识别格式';
  const modeText = formatRecognitionMode(recognitionMode);
  return `已识别为 ${formatLabel}（${modeText}），可导入 ${validCount} 道题，失败 ${failedCount} 道`;
};

const escapeCsvValue = (value) => {
  const normalizedValue = Array.isArray(value)
    ? value.join(' | ')
    : value && typeof value === 'object'
      ? JSON.stringify(value)
      : String(value == null ? '' : value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
};

const downloadTextFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const serializeSourceRow = (sourceRow) => {
  if (!sourceRow || typeof sourceRow !== 'object') {
    return String(sourceRow == null ? '' : sourceRow);
  }

  return Object.entries(sourceRow)
    .filter(([, value]) => String(value == null ? '' : value).trim() !== '')
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(' | ') : value}`)
    .join(' ; ');
};

const buildFailedRowsCsv = (failedRows) => {
  const rowKeys = Array.from(new Set(
    failedRows.flatMap((item) => Object.keys(item.sourceRow || {}))
  ));
  const headers = ['row', 'message', ...rowKeys];
  const lines = [headers.map(escapeCsvValue).join(',')];

  failedRows.forEach((item) => {
    const values = [
      item.row,
      item.message,
      ...rowKeys.map((key) => (item.sourceRow || {})[key])
    ];
    lines.push(values.map(escapeCsvValue).join(','));
  });

  return `\uFEFF${lines.join('\n')}`;
};

const downloadTemplate = (fileName) => {
  const basePath = process.env.PUBLIC_URL || '';
  const link = document.createElement('a');
  link.href = `${basePath}/templates/${fileName}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const QuestionManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [importText, setImportText] = useState('');
  const [importFileList, setImportFileList] = useState([]);
  const [importMode, setImportMode] = useState('text');
  const [importLoading, setImportLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importAnalysis, setImportAnalysis] = useState(null);
  const [form] = Form.useForm();
  const history = useHistory();
  const { isAuthenticated, user } = useSelector(state => state.user);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      history.push('/');
    }
  }, [isAuthenticated, user, history]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/questions');
      setQuestions(response.data);
    } catch (error) {
      message.error('获取题目列表失败');
      console.error('获取题目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const resetImportState = (nextMode = importMode) => {
    setImportText('');
    setImportFileList([]);
    setImportAnalysis(null);
    setImportMode(nextMode);
  };

  const closeImportModal = () => {
    setIsImportModalVisible(false);
    resetImportState('text');
  };

  const handleAddQuestion = () => {
    setIsEditMode(false);
    setCurrentQuestion(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditQuestion = (question) => {
    setIsEditMode(true);
    setCurrentQuestion(question);
    form.setFieldsValue({
      title: question.title,
      content: question.content,
      options: Array.isArray(question.options) ? question.options.join('\n') : '',
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      category: question.category,
      points: question.points
    });
    setIsModalVisible(true);
  };

  const handleSaveQuestion = async (values) => {
    try {
      setLoading(true);
      const { title, content, options, correctAnswer, difficulty, category, points } = values;

      const questionData = {
        title,
        content,
        options: options.split('\n').filter((opt) => opt.trim() !== ''),
        correctAnswer: parseInt(correctAnswer, 10),
        difficulty,
        category,
        points
      };

      if (isEditMode && currentQuestion) {
        await api.put(`/questions/${currentQuestion._id}`, questionData);
        message.success('题目更新成功');
      } else {
        await api.post('/questions', questionData);
        message.success('题目添加成功');
      }

      setIsModalVisible(false);
      fetchQuestions();
    } catch (error) {
      message.error(error.response?.data?.message || '保存题目失败');
      console.error('保存题目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFileFormData = () => {
    const formData = new FormData();
    formData.append('file', importFileList[0]);
    return formData;
  };

  const requestImportAnalysis = async (action) => {
    if (importMode === 'text') {
      if (!importText.trim()) {
        throw new Error('请先粘贴要导入的内容');
      }

      return api.post(`/questions/import${action === 'preview' ? '/preview' : ''}`, {
        content: importText
      });
    }

    if (importFileList.length === 0) {
      throw new Error('请先选择 Excel 或 CSV 文件');
    }

    return api.post(`/questions/import-file${action === 'preview' ? '/preview' : ''}`, createFileFormData(), {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  };

  const handlePreviewImport = async () => {
    try {
      setPreviewLoading(true);
      const response = await requestImportAnalysis('preview');
      setImportAnalysis(response.data);
      message.success(
        formatPreviewFeedback(
          response.data.validCount,
          response.data.failedCount,
          response.data.detectedFormatLabel,
          response.data.recognitionMode
        )
      );
    } catch (error) {
      if (error.response?.data?.failedRows || error.response?.data?.validPreview) {
        setImportAnalysis(error.response.data);
      }

      const errorMessage = error.response?.data?.message || error.message || '预览识别失败';
      message.error(errorMessage);
      console.error('预览识别失败:', error.response?.data || error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImportQuestions = async () => {
    try {
      setImportLoading(true);
      const response = await requestImportAnalysis('import');
      const {
        importedCount,
        failedCount,
        errors,
        detectedFormatLabel,
        recognitionMode
      } = response.data;

      setImportAnalysis(response.data);

      const feedback = formatImportFeedback(
        importedCount,
        failedCount,
        detectedFormatLabel,
        recognitionMode
      );

      if (importedCount > 0) {
        fetchQuestions();
      }

      if (failedCount > 0) {
        message.warning(`${feedback}，失败行已保留在预览区，可直接导出`);
        console.warn('批量导入失败详情:', errors);
      } else {
        message.success(feedback);
        closeImportModal();
      }
    } catch (error) {
      if (error.response?.data?.failedRows || error.response?.data?.validPreview) {
        setImportAnalysis(error.response.data);
      }

      message.error(error.response?.data?.message || error.message || '批量导入失败');
      console.error('批量导入失败:', error.response?.data || error);
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportFailedRows = () => {
    if (!importAnalysis || !importAnalysis.failedRows || importAnalysis.failedRows.length === 0) {
      message.info('当前没有失败行可导出');
      return;
    }

    const csvContent = buildFailedRowsCsv(importAnalysis.failedRows);
    downloadTextFile(csvContent, `question-import-failed-rows-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    message.success('失败行已导出为 CSV');
  };

  const handleDeleteQuestion = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/questions/${id}`);
      message.success('题目删除成功');
      fetchQuestions();
    } catch (error) {
      message.error(error.response?.data?.message || '删除题目失败');
      console.error('删除题目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '题目ID',
      dataIndex: '_id',
      key: '_id'
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => {
        switch (difficulty) {
          case 'easy':
            return '简单';
          case 'medium':
            return '中等';
          case 'hard':
            return '困难';
          default:
            return difficulty;
        }
      }
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: '分数',
      dataIndex: 'points',
      key: 'points'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => handleEditQuestion(record)}>
            编辑
          </Button>
          <Button danger size="small" onClick={() => handleDeleteQuestion(record._id)}>
            删除
          </Button>
        </Space>
      )
    }
  ];

  const previewColumns = [
    {
      title: '源行',
      dataIndex: 'row',
      key: 'row',
      width: 80
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 120
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (value) => {
        if (value === 'easy') {
          return '简单';
        }

        if (value === 'medium') {
          return '中等';
        }

        if (value === 'hard') {
          return '困难';
        }

        return value;
      }
    },
    {
      title: '正确答案',
      key: 'correctAnswer',
      render: (_, record) => record.options?.[record.correctAnswer] || record.correctAnswer
    },
    {
      title: '分值',
      dataIndex: 'points',
      key: 'points',
      width: 80
    }
  ];

  const failedColumns = [
    {
      title: '失败行',
      dataIndex: 'row',
      key: 'row',
      width: 90,
      render: (value) => <span style={{ color: '#cf1322', fontWeight: 600 }}>{value}</span>
    },
    {
      title: '错误原因',
      dataIndex: 'message',
      key: 'message',
      width: 260,
      render: (value) => <Tag color="error">{value}</Tag>
    },
    {
      title: '原始内容',
      dataIndex: 'sourceRow',
      key: 'sourceRow',
      render: (value) => serializeSourceRow(value) || '-'
    }
  ];

  const importTabItems = [
    {
      key: 'text',
      label: '粘贴内容自动识别',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            type="info"
            showIcon
            message="支持自动识别 JSON、CSV、TSV，以及带 标题/内容/答案/难度 等标签的题目文本块"
            description="建议先点一次“预览识别”，确认识别格式、成功题数和失败行，再正式导入。"
          />
          <TextArea
            rows={14}
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setImportAnalysis(null);
            }}
            placeholder={`[
  {
    "title": "凯撒密码基础题",
    "content": "凯撒密码本质上属于哪一种加密方式？",
    "options": ["替换加密", "置换加密", "哈希算法", "分组加密"],
    "correctAnswer": 0,
    "difficulty": "easy",
    "category": "古典密码",
    "points": 5
  }
]

或：

标题: 凯撒密码基础题
内容: 凯撒密码属于哪种加密方式？
A: 替换加密
B: 置换加密
C: 哈希算法
D: 分组加密
答案: A
难度: 简单
分类: 古典密码
分值: 5`}
          />
        </Space>
      )
    },
    {
      key: 'file',
      label: '上传 Excel/CSV',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            type="info"
            showIcon
            message="支持 .xlsx、.xls、.csv，系统会自动识别表头或按列顺序推断字段"
            description="你可以先下载模板再填，也可以直接上传现有表格进行预览识别。"
          />
          <Dragger
            accept=".xlsx,.xls,.csv"
            beforeUpload={(file) => {
              setImportFileList([file]);
              setImportAnalysis(null);
              return false;
            }}
            onRemove={() => {
              setImportFileList([]);
              setImportAnalysis(null);
            }}
            fileList={importFileList}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽 Excel/CSV 文件到这里</p>
            <p className="ant-upload-hint">支持中文表头、英文表头，也支持无表头列顺序推断</p>
          </Dragger>
        </Space>
      )
    }
  ];

  return (
    <Card
      title="题目管理"
      extra={(
        <Space>
          <Button onClick={() => setIsImportModalVisible(true)}>批量导入</Button>
          <Button type="primary" onClick={handleAddQuestion}>添加题目</Button>
        </Space>
      )}
    >
      <Table
        columns={columns}
        dataSource={questions}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={isEditMode ? '编辑题目' : '添加题目'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveQuestion}
        >
          <Form.Item
            label="题目标题"
            name="title"
            rules={[{ required: true, message: '请输入题目标题' }]}
          >
            <Input placeholder="请输入题目标题" />
          </Form.Item>

          <Form.Item
            label="题目内容"
            name="content"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea rows={4} placeholder="请输入题目内容" />
          </Form.Item>

          <Form.Item
            label="选项（每行一个选项）"
            name="options"
            rules={[{ required: true, message: '请输入选项' }]}
          >
            <TextArea rows={6} placeholder="请输入选项，每行一个选项" />
          </Form.Item>

          <Form.Item
            label="正确答案（选项索引，从0开始）"
            name="correctAnswer"
            rules={[{ required: true, message: '请输入正确答案的索引' }]}
          >
            <InputNumber placeholder="请输入正确答案的索引" />
          </Form.Item>

          <Form.Item
            label="难度"
            name="difficulty"
            rules={[{ required: true, message: '请选择难度' }]}
          >
            <Select placeholder="请选择难度">
              <Option value="easy">简单</Option>
              <Option value="medium">中等</Option>
              <Option value="hard">困难</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="类别"
            name="category"
            rules={[{ required: true, message: '请输入类别' }]}
          >
            <Input placeholder="请输入题目类别" />
          </Form.Item>

          <Form.Item
            label="分数"
            name="points"
            rules={[{ required: true, message: '请输入分数' }]}
          >
            <InputNumber placeholder="请输入分数" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入题目"
        open={isImportModalVisible}
        onCancel={closeImportModal}
        width={980}
        footer={[
          <Button key="template-csv" onClick={() => downloadTemplate('question-import-template.csv')}>
            下载 CSV 模板
          </Button>,
          <Button key="template-xlsx" onClick={() => downloadTemplate('question-import-template.xlsx')}>
            下载 Excel 模板
          </Button>,
          <Button key="export-failed" disabled={!importAnalysis?.failedRows?.length} onClick={handleExportFailedRows}>
            导出失败行
          </Button>,
          <Button key="cancel" onClick={closeImportModal}>
            取消
          </Button>,
          <Button key="preview" onClick={handlePreviewImport} loading={previewLoading}>
            预览识别
          </Button>,
          <Button key="import" type="primary" onClick={handleImportQuestions} loading={importLoading}>
            开始导入
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Tabs activeKey={importMode} onChange={(key) => resetImportState(key)} items={importTabItems} />

          {importAnalysis && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Alert
                type={importAnalysis.failedCount > 0 ? 'warning' : 'success'}
                showIcon
                message={formatPreviewFeedback(
                  importAnalysis.validCount,
                  importAnalysis.failedCount,
                  importAnalysis.detectedFormatLabel,
                  importAnalysis.recognitionMode
                )}
                description={`总行数 ${importAnalysis.totalRows}，当前预览展示前 ${importAnalysis.previewLimit || 20} 条成功题目。${importAnalysis.source ? ` 来源文件：${importAnalysis.source}` : ''}`}
              />

              <Space>
                <Tag color="blue">识别格式：{importAnalysis.detectedFormatLabel}</Tag>
                <Tag color="geekblue">识别方式：{formatRecognitionMode(importAnalysis.recognitionMode)}</Tag>
                <Tag color="green">成功：{importAnalysis.validCount}</Tag>
                <Tag color={importAnalysis.failedCount > 0 ? 'red' : 'default'}>失败：{importAnalysis.failedCount}</Tag>
              </Space>

              {importAnalysis.validPreview?.length > 0 && (
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>成功预览</div>
                  <Table
                    size="small"
                    columns={previewColumns}
                    dataSource={importAnalysis.validPreview.map((item) => ({ ...item, key: `valid-${item.row}` }))}
                    pagination={false}
                    scroll={{ x: 720 }}
                  />
                </div>
              )}

              {importAnalysis.failedRows?.length > 0 && (
                <div>
                  <div style={{ margin: '16px 0 8px', fontWeight: 600, color: '#cf1322' }}>失败行高亮</div>
                  <Table
                    size="small"
                    columns={failedColumns}
                    dataSource={importAnalysis.failedRows.map((item) => ({ ...item, key: `failed-${item.row}` }))}
                    pagination={{ pageSize: 5 }}
                    scroll={{ x: 720 }}
                  />
                </div>
              )}
            </>
          )}
        </Space>
      </Modal>
    </Card>
  );
};

export default QuestionManagement;
