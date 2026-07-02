const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function resolveSourcePath(cliPath) {
  if (cliPath) {
    return cliPath;
  }

  const downloadsDir = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
  const candidates = fs.readdirSync(downloadsDir)
    .filter((fileName) => fileName.toLowerCase().endsWith('.xlsx') && fileName.includes('415'))
    .map((fileName) => path.join(downloadsDir, fileName));

  if (candidates.length === 0) {
    throw new Error('Could not find a source xlsx containing "415" in the Downloads directory');
  }

  return candidates[0];
}

function normalizeCell(value) {
  if (value === undefined || value === null) {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim();
}

function parseCorrectAnswer(answer, options, title) {
  const normalized = normalizeCell(answer).toUpperCase();

  if (!normalized) {
    throw new Error(`题目「${title}」缺少正确答案`);
  }

  if (/^[A-F]$/.test(normalized)) {
    const index = normalized.charCodeAt(0) - 65;
    if (index < options.length) {
      return index;
    }
  }

  if (/^\d+$/.test(normalized)) {
    const numeric = Number(normalized);
    if (numeric >= 0 && numeric < options.length) {
      return numeric;
    }
    if (numeric > 0 && numeric <= options.length) {
      return numeric - 1;
    }
  }

  const matchedIndex = options.findIndex((option) => option === normalizeCell(answer));
  if (matchedIndex >= 0) {
    return matchedIndex;
  }

  throw new Error(`题目「${title}」的正确答案无法识别：${answer}`);
}

function convertRow(row, rowNumber) {
  const title = normalizeCell(row[1]);

  if (!title) {
    return null;
  }

  const options = [row[2], row[3], row[4], row[5]]
    .map(normalizeCell)
    .filter(Boolean);

  if (options.length < 2) {
    throw new Error(`第 ${rowNumber} 行题目「${title}」有效选项不足 2 个`);
  }

  return {
    title,
    content: title,
    options,
    correctAnswer: parseCorrectAnswer(row[6], options, title),
    difficulty: 'easy',
    category: '密码安全',
    points: 5,
    explanation: ''
  };
}

function main() {
  const sourcePath = resolveSourcePath(process.argv[2]);

  const workbook = xlsx.readFile(sourcePath, {
    cellDates: true
  });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true
  });

  if (!rows || rows.length < 3) {
    throw new Error('XLSX 内容不足，无法构建初始题库');
  }

  const dataRows = rows.slice(2);
  const convertedQuestions = [];

  dataRows.forEach((row, index) => {
    if (!row || row.every((value) => normalizeCell(value) === '')) {
      return;
    }

    const converted = convertRow(row, index + 3);
    if (converted) {
      convertedQuestions.push(converted);
    }
  });

  const outputPath = path.resolve(__dirname, '..', 'data', 'passwordChallengeQuestions.json');
  fs.writeFileSync(outputPath, JSON.stringify(convertedQuestions, null, 2), 'utf8');

  console.log(`Generated ${convertedQuestions.length} initial questions -> ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
