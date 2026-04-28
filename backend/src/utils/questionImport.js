const XLSX = require('xlsx');
const { normalizeQuestionPayload } = require('./questionPayload');

const HEADER_ALIASES = {
  title: 'title',
  标题: 'title',
  题目标题: 'title',
  题干标题: 'title',
  titlename: 'title',
  questiontitle: 'title',
  biaoti: 'title',
  timu: 'title',
  timubiaoti: 'title',
  titletext: 'title',
  question: 'title',
  content: 'content',
  内容: 'content',
  题目内容: 'content',
  题干: 'content',
  questioncontent: 'content',
  description: 'content',
  neirong: 'content',
  timuneirong: 'content',
  questiontext: 'content',
  explanation: 'explanation',
  解析: 'explanation',
  题目解析: 'explanation',
  analysis: 'explanation',
  explain: 'explanation',
  jiexi: 'explanation',
  options: 'options',
  选项: 'options',
  xuanxiang: 'options',
  choices: 'options',
  choice: 'options',
  optiona: 'optionA',
  选项a: 'optionA',
  a: 'optionA',
  xuanxianga: 'optionA',
  optionb: 'optionB',
  选项b: 'optionB',
  b: 'optionB',
  xuanxiangb: 'optionB',
  optionc: 'optionC',
  选项c: 'optionC',
  c: 'optionC',
  xuanxiangc: 'optionC',
  optiond: 'optionD',
  选项d: 'optionD',
  d: 'optionD',
  xuanxiangd: 'optionD',
  optione: 'optionE',
  选项e: 'optionE',
  e: 'optionE',
  xuanxiange: 'optionE',
  optionf: 'optionF',
  选项f: 'optionF',
  f: 'optionF',
  xuanxiangf: 'optionF',
  correctanswer: 'correctAnswer',
  正确答案: 'correctAnswer',
  标准答案: 'correctAnswer',
  答案: 'correctAnswer',
  answer: 'correctAnswer',
  rightanswer: 'correctAnswer',
  zhengquedaan: 'correctAnswer',
  daan: 'correctAnswer',
  ans: 'correctAnswer',
  difficulty: 'difficulty',
  难度: 'difficulty',
  nandu: 'difficulty',
  level: 'difficulty',
  category: 'category',
  分类: 'category',
  类别: 'category',
  type: 'category',
  fenlei: 'category',
  leibie: 'category',
  points: 'points',
  分值: 'points',
  分数: 'points',
  score: 'points',
  fenzhi: 'points',
  fenshu: 'points'
};

const FORMAT_LABELS = {
  json: 'JSON',
  csv: 'CSV',
  tsv: 'TSV',
  table: '表格文本',
  structured: '题目块文本',
  spreadsheet: 'Excel/CSV 文件'
};

const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF'];
const HEADER_KEYS = new Set(Object.keys(HEADER_ALIASES));

const normalizeHeader = (header) => String(header || '')
  .trim()
  .toLowerCase()
  .replace(/[\s_\-()\[\]{}:：]/g, '');

const normalizeCellString = (value) => String(value == null ? '' : value).trim();

const stripBom = (content) => String(content || '').replace(/^\uFEFF/, '');

const mapRow = (row) => {
  return Object.entries(row || {}).reduce((accumulator, [key, value]) => {
    const canonicalKey = HEADER_ALIASES[normalizeHeader(key)] || key;
    accumulator[canonicalKey] = value;
    return accumulator;
  }, {});
};

const parseOptionsText = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeCellString(item)).filter(Boolean);
  }

  const rawValue = normalizeCellString(value);

  if (!rawValue) {
    return [];
  }

  if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizeCellString(item)).filter(Boolean);
      }
    } catch (error) {
      // Fallback to delimiter splitting below.
    }
  }

  return rawValue
    .split(/\r?\n|\s*[|｜;；]\s*/)
    .map((item) => normalizeCellString(item))
    .filter(Boolean);
};

const collectOptions = (row) => {
  if (row.options !== undefined && normalizeCellString(row.options)) {
    return parseOptionsText(row.options);
  }

  return OPTION_KEYS
    .map((key) => normalizeCellString(row[key]))
    .filter(Boolean);
};

const normalizeCorrectAnswer = (value, options) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const normalizedValue = normalizeCellString(value);

  if (!normalizedValue) {
    return normalizedValue;
  }

  if (/^\d+$/.test(normalizedValue)) {
    return Number(normalizedValue);
  }

  if (/^[A-Fa-f]$/.test(normalizedValue)) {
    return normalizedValue.toUpperCase().charCodeAt(0) - 65;
  }

  const optionIndex = options.findIndex((option) => option === normalizedValue);
  return optionIndex >= 0 ? optionIndex : normalizedValue;
};

const normalizeDifficulty = (value) => {
  const normalizedValue = normalizeCellString(value).toLowerCase();
  const aliases = {
    easy: 'easy',
    simple: 'easy',
    jian: 'easy',
    jiandan: 'easy',
    '简单': 'easy',
    medium: 'medium',
    normal: 'medium',
    zhong: 'medium',
    zhongdeng: 'medium',
    '中等': 'medium',
    hard: 'hard',
    difficult: 'hard',
    kunnan: 'hard',
    '困难': 'hard'
  };

  return aliases[normalizedValue] || normalizedValue;
};

const transformRowToQuestion = (row) => {
  const mappedRow = mapRow(row);
  const options = collectOptions(mappedRow);

  return normalizeQuestionPayload({
    title: mappedRow.title,
    content: mappedRow.content,
    explanation: mappedRow.explanation,
    options,
    correctAnswer: normalizeCorrectAnswer(mappedRow.correctAnswer, options),
    difficulty: normalizeDifficulty(mappedRow.difficulty),
    category: mappedRow.category,
    points: mappedRow.points
  });
};

const isEmptyMatrixRow = (row) => !row.some((cell) => normalizeCellString(cell));

const isHeaderRow = (row) => {
  const normalizedCells = row.map((cell) => normalizeHeader(cell)).filter(Boolean);
  const matches = normalizedCells.filter((cell) => HEADER_KEYS.has(cell)).length;
  return matches >= 2;
};

const inferRowObject = (row) => {
  const cells = row.map((cell) => normalizeCellString(cell)).filter((cell) => cell !== '');

  if (cells.length < 7) {
    throw new Error('无法自动识别该行结构，请补充表头或确保列顺序为 标题、内容、选项、答案、难度、类别、分值');
  }

  const questionTitle = cells[0];
  const questionContent = cells[1];
  const correctAnswer = cells[cells.length - 4];
  const difficulty = cells[cells.length - 3];
  const category = cells[cells.length - 2];
  const points = cells[cells.length - 1];
  const optionValues = cells.slice(2, -4);

  if (optionValues.length < 2) {
    throw new Error('自动识别到的选项数量不足，至少需要两个选项');
  }

  return {
    title: questionTitle,
    content: questionContent,
    correctAnswer,
    difficulty,
    category,
    points,
    ...OPTION_KEYS.reduce((accumulator, key, index) => {
      if (optionValues[index]) {
        accumulator[key] = optionValues[index];
      }
      return accumulator;
    }, {})
  };
};

const matrixToObjects = (matrix) => {
  const rows = matrix
    .map((row) => (Array.isArray(row) ? row : []))
    .filter((row) => !isEmptyMatrixRow(row));

  if (rows.length === 0) {
    throw new Error('导入内容中没有可用数据');
  }

  if (isHeaderRow(rows[0])) {
    const headers = rows[0];
    return {
      rows: rows.slice(1).map((row) => headers.reduce((accumulator, header, index) => {
        accumulator[header] = row[index];
        return accumulator;
      }, {})),
      recognitionMode: 'header'
    };
  }

  return {
    rows: rows.map(inferRowObject),
    recognitionMode: 'column-inference'
  };
};

const parseDelimitedText = (content, delimiter) => {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;
  const text = stripBom(content);

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
};

const detectDelimiter = (content) => {
  const candidates = [',', '\t', ';', '|'];
  const sampleLines = stripBom(content)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  let bestMatch = null;

  candidates.forEach((candidate) => {
    const parsedLines = sampleLines
      .map((line) => parseDelimitedText(line, candidate)[0] || [])
      .filter((cells) => cells.length > 1);

    if (parsedLines.length === 0) {
      return;
    }

    const score = parsedLines.reduce((sum, cells) => sum + cells.length, 0);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        delimiter: candidate,
        score
      };
    }
  });

  return bestMatch ? bestMatch.delimiter : null;
};

const mapStructuredLabel = (label) => HEADER_ALIASES[normalizeHeader(label)] || label;

const parseStructuredBlocks = (content) => {
  const blocks = stripBom(content)
    .split(/\r?\n\s*\r?\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const row = {};

    block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
      const optionMatch = line.match(/^([A-Fa-f])[.．、):：-]\s*(.+)$/);
      if (optionMatch) {
        row[`option${optionMatch[1].toUpperCase()}`] = optionMatch[2];
        return;
      }

      const namedOptionMatch = line.match(/^选项\s*([A-Fa-f])[：:.-]?\s*(.+)$/i);
      if (namedOptionMatch) {
        row[`option${namedOptionMatch[1].toUpperCase()}`] = namedOptionMatch[2];
        return;
      }

      const fieldMatch = line.match(/^([^：:]+)[：:]+\s*(.+)$/);
      if (fieldMatch) {
        row[mapStructuredLabel(fieldMatch[1])] = fieldMatch[2];
      }
    });

    return row;
  }).filter((row) => Object.keys(row).length > 0);
};

const looksLikeStructuredContent = (content) => {
  return /(标题|内容|题目|答案|正确答案|难度|分类|分值|title|content|correct\s*answer|difficulty|category|points)\s*[：:]/i.test(content)
    || /(^|\n)\s*[A-F][.．、):：-]/i.test(content);
};

const parseWorkbookRows = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('导入文件中没有可读取的工作表');
  }

  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    header: 1,
    defval: ''
  });

  return matrixToObjects(matrix);
};

const buildParseResult = (rows, options = {}) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('导入内容中没有可用数据');
  }

  const validQuestions = [];
  const errors = [];
  const rowResults = [];
  const startRow = options.startRow || 2;

  rows.forEach((row, index) => {
    try {
      const normalizedQuestion = transformRowToQuestion(row);
      validQuestions.push(normalizedQuestion);
      rowResults.push({
        index,
        row: startRow + index,
        status: 'success',
        sourceRow: row,
        normalizedQuestion
      });
    } catch (error) {
      const errorInfo = {
        index,
        row: startRow + index,
        message: error.message,
        sourceRow: row
      };

      errors.push(errorInfo);
      rowResults.push({
        index,
        row: startRow + index,
        status: 'error',
        message: error.message,
        sourceRow: row
      });
    }
  });

  return {
    validQuestions,
    errors,
    rowResults,
    totalRows: rows.length,
    detectedFormat: options.detectedFormat || 'json',
    detectedFormatLabel: FORMAT_LABELS[options.detectedFormat] || options.detectedFormat || '未知格式',
    recognitionMode: options.recognitionMode || 'direct'
  };
};

const parseQuestionRows = (rows) => {
  return buildParseResult(rows, {
    detectedFormat: 'json',
    recognitionMode: 'direct',
    startRow: 2
  });
};

const parseQuestionContent = (content) => {
  const normalizedContent = stripBom(content).trim();

  if (!normalizedContent) {
    throw new Error('请先输入要导入的内容');
  }

  if (normalizedContent.startsWith('[') || normalizedContent.startsWith('{')) {
    try {
      const parsed = JSON.parse(normalizedContent);
      const rows = Array.isArray(parsed) ? parsed : parsed.questions;
      if (Array.isArray(rows) && rows.length > 0) {
        return buildParseResult(rows, {
          detectedFormat: 'json',
          recognitionMode: 'json',
          startRow: 2
        });
      }
    } catch (error) {
      // Fallback to other recognizers.
    }
  }

  const delimiter = detectDelimiter(normalizedContent);
  if (delimiter) {
    const matrix = parseDelimitedText(normalizedContent, delimiter);
    const parsedTable = matrixToObjects(matrix);
    return buildParseResult(parsedTable.rows, {
      detectedFormat: delimiter === ',' ? 'csv' : delimiter === '\t' ? 'tsv' : 'table',
      recognitionMode: parsedTable.recognitionMode,
      startRow: parsedTable.recognitionMode === 'header' ? 2 : 1
    });
  }

  if (looksLikeStructuredContent(normalizedContent)) {
    const rows = parseStructuredBlocks(normalizedContent);
    return buildParseResult(rows, {
      detectedFormat: 'structured',
      recognitionMode: 'labeled-blocks',
      startRow: 1
    });
  }

  throw new Error('无法自动识别导入内容，请使用 JSON、CSV/TSV、Excel，或带标题/答案等标签的题目块文本');
};

const parseQuestionFile = (file) => {
  if (!file || !file.buffer) {
    throw new Error('请上传 Excel 或 CSV 文件');
  }

  const parsedWorkbook = parseWorkbookRows(file.buffer);
  return buildParseResult(parsedWorkbook.rows, {
    detectedFormat: 'spreadsheet',
    recognitionMode: parsedWorkbook.recognitionMode,
    startRow: parsedWorkbook.recognitionMode === 'header' ? 2 : 1
  });
};

module.exports = {
  parseQuestionRows,
  parseQuestionContent,
  parseQuestionFile
};
