const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1200;

const MEDAL_THEMES = {
  bronze: {
    primary: '#b96b2d',
    secondary: '#e6a56c',
    accent: '#fff1d8',
    ribbonLeft: '#b91c1c',
    ribbonRight: '#1d4ed8'
  },
  silver: {
    primary: '#7d8da3',
    secondary: '#c6d0dc',
    accent: '#f7fbff',
    ribbonLeft: '#b91c1c',
    ribbonRight: '#2563eb'
  },
  gold: {
    primary: '#c99611',
    secondary: '#f1cf65',
    accent: '#fff9d9',
    ribbonLeft: '#b91c1c',
    ribbonRight: '#1d4ed8'
  },
  special: {
    primary: '#2457c5',
    secondary: '#7fb2ff',
    accent: '#eef6ff',
    ribbonLeft: '#c2410c',
    ribbonRight: '#1d4ed8'
  },
  encourage: {
    primary: '#2f7b7b',
    secondary: '#6ecfcf',
    accent: '#eefefe',
    ribbonLeft: '#0f766e',
    ribbonRight: '#0ea5e9'
  }
};

const formatAwardDate = (value) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const fitFontSize = (context, text, preferredSize, minSize, maxWidth, fontFamily = 'Microsoft YaHei') => {
  let currentSize = preferredSize;

  while (currentSize > minSize) {
    context.font = `700 ${currentSize}px ${fontFamily}`;

    if (context.measureText(text).width <= maxWidth) {
      return currentSize;
    }

    currentSize -= 1;
  }

  return minSize;
};

const wrapText = (context, text, maxWidth) => {
  const content = String(text || '').trim();

  if (!content) {
    return [];
  }

  const lines = [];
  let currentLine = '';

  for (const char of content) {
    const nextLine = currentLine + char;

    if (context.measureText(nextLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const drawRoundedRect = (context, x, y, width, height, radius) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const drawRibbon = (context, x, theme, isLeft) => {
  const topY = 110;
  const bottomY = 430;
  const width = 104;
  const tipOffset = 34;

  context.save();
  context.beginPath();
  context.moveTo(x, topY);
  context.lineTo(x + width, topY);
  context.lineTo(x + width, bottomY - 78);
  context.lineTo(x + width / 2, bottomY);
  context.lineTo(x, bottomY - 78);
  context.closePath();

  const ribbonGradient = context.createLinearGradient(x, topY, x + width, bottomY);
  ribbonGradient.addColorStop(0, isLeft ? theme.ribbonLeft : theme.ribbonRight);
  ribbonGradient.addColorStop(1, theme.primary);
  context.fillStyle = ribbonGradient;
  context.fill();

  context.fillStyle = 'rgba(255,255,255,0.16)';
  context.beginPath();
  context.moveTo(x + tipOffset, topY);
  context.lineTo(x + width / 2, topY);
  context.lineTo(x + width / 2, bottomY - 34);
  context.lineTo(x + tipOffset, bottomY - 68);
  context.closePath();
  context.fill();
  context.restore();
};

const drawStar = (context, centerX, centerY, outerRadius, innerRadius, fillStyle) => {
  context.save();
  context.beginPath();

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
  context.restore();
};

const buildMedalCopy = ({ awardTitle, correctCount, totalQuestions }) => {
  return `在国家安全知识挑战中完成 ${totalQuestions} 道题目挑战，累计答对 ${correctCount} 题，荣获 ${awardTitle}。`;
};

export const generateCertificatePreview = async ({
  username,
  awardTitle,
  medalTier,
  correctCount,
  totalQuestions,
  awardedAt
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext('2d');
  const safeAwardTitle = String(awardTitle || '').trim();
  const safeUserName = String(username || '').trim();
  const theme = MEDAL_THEMES[medalTier] || MEDAL_THEMES.gold;

  const backgroundGradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  backgroundGradient.addColorStop(0, '#fffdf7');
  backgroundGradient.addColorStop(1, '#f6f8fc');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = 'rgba(201, 150, 17, 0.08)';
  context.beginPath();
  context.arc(160, 160, 130, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(760, 250, 180, 0, Math.PI * 2);
  context.fill();

  context.save();
  drawRoundedRect(context, 52, 52, CANVAS_WIDTH - 104, CANVAS_HEIGHT - 104, 36);
  context.lineWidth = 3;
  context.strokeStyle = 'rgba(36, 87, 197, 0.12)';
  context.stroke();
  context.restore();

  drawRibbon(context, 252, theme, true);
  drawRibbon(context, 544, theme, false);

  const outerGradient = context.createLinearGradient(210, 350, 690, 880);
  outerGradient.addColorStop(0, theme.secondary);
  outerGradient.addColorStop(1, theme.primary);
  context.fillStyle = outerGradient;
  context.beginPath();
  context.arc(CANVAS_WIDTH / 2, 610, 216, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = 'rgba(255,255,255,0.52)';
  context.beginPath();
  context.arc(CANVAS_WIDTH / 2, 610, 176, 0, Math.PI * 2);
  context.fill();

  const innerGradient = context.createRadialGradient(CANVAS_WIDTH / 2 - 44, 560, 10, CANVAS_WIDTH / 2, 610, 180);
  innerGradient.addColorStop(0, theme.accent);
  innerGradient.addColorStop(1, theme.secondary);
  context.fillStyle = innerGradient;
  context.beginPath();
  context.arc(CANVAS_WIDTH / 2, 610, 150, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = 'rgba(255,255,255,0.65)';
  context.lineWidth = 10;
  context.beginPath();
  context.arc(CANVAS_WIDTH / 2, 610, 188, 0, Math.PI * 2);
  context.stroke();

  drawStar(context, CANVAS_WIDTH / 2, 512, 42, 18, '#fff7cc');

  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const awardFontSize = fitFontSize(context, safeAwardTitle, 42, 28, 250);
  context.fillStyle = '#24415f';
  context.font = `700 ${awardFontSize}px Microsoft YaHei`;
  const awardLines = wrapText(context, safeAwardTitle, 250).slice(0, 2);
  awardLines.forEach((line, index) => {
    context.fillText(line, CANVAS_WIDTH / 2, 600 + index * 54);
  });

  context.fillStyle = '#5f6b7a';
  context.font = '500 24px Microsoft YaHei';
  context.fillText('国家安全知识挑战', CANVAS_WIDTH / 2, 770);

  drawRoundedRect(context, 222, 826, 456, 76, 38);
  context.fillStyle = '#ffffff';
  context.fill();
  context.strokeStyle = 'rgba(36, 87, 197, 0.12)';
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = '#24415f';
  context.font = '600 28px Microsoft YaHei';
  context.fillText(safeUserName, CANVAS_WIDTH / 2, 864);

  context.fillStyle = '#6b7280';
  context.font = '500 22px Microsoft YaHei';
  context.fillText(`答对 ${correctCount} / ${totalQuestions} 题`, CANVAS_WIDTH / 2, 942);

  context.font = '400 20px Microsoft YaHei';
  context.fillText(formatAwardDate(awardedAt), CANVAS_WIDTH / 2, 986);

  context.fillStyle = '#6b7280';
  context.font = '400 24px Microsoft YaHei';
  const copyLines = wrapText(context, buildMedalCopy({ awardTitle: safeAwardTitle, correctCount, totalQuestions }), 620).slice(0, 3);
  copyLines.forEach((line, index) => {
    context.fillText(line, CANVAS_WIDTH / 2, 1070 + index * 34);
  });

  return canvas.toDataURL('image/png');
};
