const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const headers = [
  '题目标题',
  '题目内容',
  '选项A',
  '选项B',
  '选项C',
  '选项D',
  '选项E',
  '选项F',
  '正确答案',
  '题目难度',
  '题目分类',
  '分值',
  '正确答案解析',
  '错误答案解析'
];

const exampleRows = [
  [
    '示例题目1',
    '《中华人民共和国密码法》自何时起施行？',
    '2019年10月26日',
    '2020年1月1日',
    '2021年7月1日',
    '2020年6月1日',
    '',
    '',
    'B',
    'easy',
    '密码安全',
    5,
    '《中华人民共和国密码法》自2020年1月1日起正式施行。',
    '如果选错，重点回顾《密码法》的正式施行时间是2020年1月1日。'
  ],
  [
    '示例题目2',
    '以下哪种做法有利于保护自己的密码安全？',
    '把密码写在便签纸上贴在电脑旁',
    '所有平台使用同一个密码',
    '定期更换密码并避免重复使用',
    '使用连续数字如123456作为密码',
    '',
    '',
    'C',
    'easy',
    '密码安全',
    5,
    '定期更换并避免重复使用密码，可以降低账号连带泄露风险。',
    '如果答错，说明还需要强化“不要重复使用密码、不要使用弱密码”的安全意识。'
  ]
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function quoteCsv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function writeCsv(targetPath) {
  const lines = [headers, ...exampleRows].map((row) => row.map(quoteCsv).join(','));
  fs.writeFileSync(targetPath, `\uFEFF${lines.join('\n')}`, 'utf8');
}

function writeXlsx(targetPath) {
  const worksheet = xlsx.utils.aoa_to_sheet([headers, ...exampleRows]);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, '题目导入模板');
  xlsx.writeFile(workbook, targetPath);
}

function main() {
  const templateDir = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'templates');
  ensureDir(templateDir);

  const csvPath = path.join(templateDir, 'question-import-template.csv');
  const xlsxPath = path.join(templateDir, 'question-import-template.xlsx');

  writeCsv(csvPath);
  writeXlsx(xlsxPath);

  console.log(`Generated template files:\n- ${csvPath}\n- ${xlsxPath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
