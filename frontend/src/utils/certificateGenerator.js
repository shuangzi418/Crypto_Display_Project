const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1200;
const FONT_FAMILY = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';

const MEDAL_THEMES = {
  bronze: {
    metalDark: '#6a3a16',
    metalMid: '#a7602c',
    metalLight: '#d49a63',
    navyDark: '#07162f',
    navyLight: '#123760',
    cyan: '#61f1ff',
    coreWarm: '#e6a354',
    accent: '#f6dfb4',
    text: '#f3ece3'
  },
  silver: {
    metalDark: '#637489',
    metalMid: '#a5b6c8',
    metalLight: '#e3edf7',
    navyDark: '#07162f',
    navyLight: '#143e68',
    cyan: '#68f3ff',
    coreWarm: '#86d5ff',
    accent: '#f7fbff',
    text: '#edf4fb'
  },
  gold: {
    metalDark: '#8d6308',
    metalMid: '#c89a26',
    metalLight: '#f0d88b',
    navyDark: '#081830',
    navyLight: '#143f6b',
    cyan: '#63f5ff',
    coreWarm: '#ffe9a3',
    accent: '#fff8da',
    text: '#fbf5e2'
  },
  special: {
    metalDark: '#8f9db1',
    metalMid: '#d5deea',
    metalLight: '#ffffff',
    navyDark: '#061327',
    navyLight: '#13335b',
    cyan: '#66f7ff',
    coreWarm: '#dffcff',
    accent: '#f5faff',
    text: '#f4fbff'
  },
  encourage: {
    metalDark: '#1f6a6e',
    metalMid: '#3099a0',
    metalLight: '#7ae3db',
    navyDark: '#07162f',
    navyLight: '#153861',
    cyan: '#61f5ff',
    coreWarm: '#90fff3',
    accent: '#e8fffb',
    text: '#eefbfb'
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

const fitFontSize = (context, text, preferredSize, minSize, maxWidth, fontFamily = FONT_FAMILY) => {
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
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const buildMedalCopy = ({ awardTitle, correctCount, totalQuestions }) => {
  return `在密码安全知识挑战中，完成 ${totalQuestions} 道题目作答、答对 ${correctCount} 题，经系统评定，授予 ${awardTitle} 电子荣誉奖牌。`;
};

const withAlpha = (hexColor, alpha) => {
  const normalized = String(hexColor || '').replace('#', '');

  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const regularPolygonPoints = (centerX, centerY, radius, sides, rotation = -Math.PI / 2) => {
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + (Math.PI * 2 * index) / sides;

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
};

const drawPolygonPath = (context, points) => {
  if (!points || points.length === 0) {
    return;
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  points.slice(1).forEach((point) => {
    context.lineTo(point.x, point.y);
  });

  context.closePath();
};

const drawGlow = (context, centerX, centerY, radius, color, alpha = 0.4) => {
  const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, withAlpha(color, alpha));
  gradient.addColorStop(1, withAlpha(color, 0));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
};

const drawCircuitPattern = (context, bounds, primaryColor, secondaryColor) => {
  const { x, y, width, height } = bounds;
  const rows = 7;
  const cols = 6;
  const gapY = (height - 40) / (rows - 1);
  const gapX = (width - 50) / (cols - 1);

  context.save();
  context.lineWidth = 1.6;
  context.strokeStyle = withAlpha(primaryColor, 0.36);
  context.fillStyle = withAlpha(secondaryColor, 0.6);

  for (let row = 0; row < rows; row += 1) {
    const anchorY = y + 20 + row * gapY;

    for (let col = 0; col < cols; col += 1) {
      const anchorX = x + 18 + col * gapX + (row % 2 === 0 ? 0 : 6);
      const branch = 18 + ((row + col) % 3) * 8;
      const vertical = ((row + col) % 2 === 0 ? 1 : -1) * (8 + (col % 3) * 6);

      context.beginPath();
      context.moveTo(anchorX, anchorY);
      context.lineTo(anchorX + branch, anchorY);
      context.lineTo(anchorX + branch, anchorY + vertical);
      context.stroke();

      context.beginPath();
      context.arc(anchorX, anchorY, 2.2, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.arc(anchorX + branch, anchorY + vertical, 1.8, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.restore();
};

const drawBrushedMetal = (context, bounds, highlightColor, shadowColor) => {
  const { x, y, width, height } = bounds;

  context.save();
  for (let index = -height; index < width + height; index += 9) {
    context.strokeStyle = index % 18 === 0 ? withAlpha(highlightColor, 0.12) : withAlpha(shadowColor, 0.08);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x + index, y);
    context.lineTo(x + index - height * 0.32, y + height);
    context.stroke();
  }
  context.restore();
};

const drawGlassShape = (context, pathBuilder, bounds, theme, options = {}) => {
  const { cyan, coreWarm } = theme;

  context.save();
  pathBuilder();
  context.clip();

  const glassGradient = context.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height);
  glassGradient.addColorStop(0, withAlpha(cyan, options.topAlpha || 0.34));
  glassGradient.addColorStop(0.5, withAlpha(coreWarm, options.midAlpha || 0.12));
  glassGradient.addColorStop(1, withAlpha('#dffcff', options.bottomAlpha || 0.18));
  context.fillStyle = glassGradient;
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

  drawCircuitPattern(context, bounds, cyan, '#ffffff');

  const sheen = context.createLinearGradient(bounds.x, bounds.y, bounds.x, bounds.y + bounds.height);
  sheen.addColorStop(0, 'rgba(255,255,255,0.26)');
  sheen.addColorStop(0.4, 'rgba(255,255,255,0.02)');
  sheen.addColorStop(1, 'rgba(255,255,255,0.18)');
  context.fillStyle = sheen;
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.restore();

  context.save();
  pathBuilder();
  context.lineWidth = options.lineWidth || 4;
  context.strokeStyle = withAlpha(cyan, 0.74);
  context.shadowColor = withAlpha(cyan, 0.58);
  context.shadowBlur = 24;
  context.stroke();
  context.restore();
};

const drawKeyhole = (context, centerX, centerY, size, fillStyle) => {
  context.save();
  context.fillStyle = fillStyle;
  context.beginPath();
  context.arc(centerX, centerY - size * 0.2, size * 0.22, 0, Math.PI * 2);
  context.fill();
  drawRoundedRect(context, centerX - size * 0.09, centerY - size * 0.02, size * 0.18, size * 0.42, size * 0.09);
  context.fill();
  context.restore();
};

const drawLock = (context, centerX, centerY, size, strokeStyle, fillStyle, alpha = 1) => {
  context.save();
  context.globalAlpha = alpha;
  context.lineWidth = size * 0.08;
  context.strokeStyle = strokeStyle;
  context.fillStyle = fillStyle;

  context.beginPath();
  context.arc(centerX, centerY - size * 0.18, size * 0.22, Math.PI, 0);
  context.stroke();

  drawRoundedRect(context, centerX - size * 0.28, centerY - size * 0.12, size * 0.56, size * 0.5, size * 0.14);
  context.fill();
  context.stroke();
  drawKeyhole(context, centerX, centerY + size * 0.02, size * 0.5, strokeStyle);
  context.restore();
};

const drawAsymmetricBasePlate = (context, centerX, centerY, width, height, theme) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const points = [
    { x: centerX - halfWidth + 52, y: centerY - halfHeight + 8 },
    { x: centerX + halfWidth - 118, y: centerY - halfHeight },
    { x: centerX + halfWidth, y: centerY - halfHeight + 84 },
    { x: centerX + halfWidth - 18, y: centerY + halfHeight - 44 },
    { x: centerX + halfWidth - 132, y: centerY + halfHeight },
    { x: centerX - halfWidth + 72, y: centerY + halfHeight - 12 },
    { x: centerX - halfWidth, y: centerY + halfHeight - 120 },
    { x: centerX - halfWidth + 12, y: centerY - halfHeight + 70 }
  ];

  context.save();
  drawPolygonPath(context, points);
  const gradient = context.createLinearGradient(centerX - halfWidth, centerY - halfHeight, centerX + halfWidth, centerY + halfHeight);
  gradient.addColorStop(0, theme.navyLight);
  gradient.addColorStop(1, theme.navyDark);
  context.fillStyle = gradient;
  context.fill();

  context.lineWidth = 3;
  context.strokeStyle = 'rgba(123, 213, 255, 0.18)';
  context.stroke();

  context.globalAlpha = 0.22;
  drawBrushedMetal(context, {
    x: centerX - halfWidth,
    y: centerY - halfHeight,
    width,
    height
  }, '#ffffff', '#0f2744');
  context.restore();
};

const fillPolygon = (context, points, fillStyle, strokeStyle = null, lineWidth = 0) => {
  context.save();
  drawPolygonPath(context, points);
  context.fillStyle = fillStyle;
  context.fill();

  if (strokeStyle && lineWidth > 0) {
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeStyle;
    context.stroke();
  }

  context.restore();
};

const drawHexFacetBands = (context, outerPoints, innerPoints, fills) => {
  for (let index = 0; index < outerPoints.length; index += 1) {
    const nextIndex = (index + 1) % outerPoints.length;
    context.save();
    context.beginPath();
    context.moveTo(outerPoints[index].x, outerPoints[index].y);
    context.lineTo(outerPoints[nextIndex].x, outerPoints[nextIndex].y);
    context.lineTo(innerPoints[nextIndex].x, innerPoints[nextIndex].y);
    context.lineTo(innerPoints[index].x, innerPoints[index].y);
    context.closePath();
    context.fillStyle = fills[index % fills.length];
    context.fill();
    context.restore();
  }
};

const buildShieldPath = (context, centerX, centerY, width, height) => {
  const halfWidth = width / 2;
  const topY = centerY - height / 2;
  const midY = centerY + height * 0.06;
  const bottomY = centerY + height / 2;

  context.beginPath();
  context.moveTo(centerX, topY);
  context.lineTo(centerX + halfWidth * 0.78, topY + height * 0.12);
  context.quadraticCurveTo(centerX + halfWidth, centerY - height * 0.06, centerX + halfWidth * 0.82, midY);
  context.quadraticCurveTo(centerX + halfWidth * 0.56, centerY + height * 0.28, centerX, bottomY);
  context.quadraticCurveTo(centerX - halfWidth * 0.56, centerY + height * 0.28, centerX - halfWidth * 0.82, midY);
  context.quadraticCurveTo(centerX - halfWidth, centerY - height * 0.06, centerX - halfWidth * 0.78, topY + height * 0.12);
  context.closePath();
};

const drawShieldOutline = (context, centerX, centerY, width, height, primaryStroke, secondaryStroke) => {
  context.save();
  buildShieldPath(context, centerX, centerY, width, height);
  context.fillStyle = 'rgba(255,255,255,0.03)';
  context.fill();
  context.lineWidth = 10;
  context.strokeStyle = primaryStroke;
  context.stroke();
  context.lineWidth = 3;
  context.strokeStyle = secondaryStroke;
  context.stroke();
  context.restore();
};

const drawHeavyPadlock = (context, centerX, centerY, size, theme) => {
  const bodyWidth = size * 0.74;
  const bodyHeight = size * 0.6;
  const bodyX = centerX - bodyWidth / 2;
  const bodyY = centerY + size * 0.08;
  const shackleRadius = size * 0.24;
  const shackleBottomY = bodyY + bodyHeight * 0.06;
  const shackleLineWidth = size * 0.14;
  const cyan = theme.cyan;

  context.save();
  drawRoundedRect(context, bodyX + 8, bodyY + 10, bodyWidth, bodyHeight, size * 0.12);
  context.fillStyle = 'rgba(0, 0, 0, 0.34)';
  context.fill();
  context.restore();

  context.save();
  context.lineCap = 'round';
  context.lineWidth = shackleLineWidth + 12;
  context.strokeStyle = '#0b1623';
  context.beginPath();
  context.moveTo(centerX - shackleRadius, shackleBottomY + 4);
  context.arc(centerX, shackleBottomY + 4, shackleRadius, Math.PI, 0, false);
  context.lineTo(centerX + shackleRadius, shackleBottomY + 4);
  context.stroke();

  const shackleGradient = context.createLinearGradient(centerX - shackleRadius, shackleBottomY - shackleRadius, centerX + shackleRadius, shackleBottomY + shackleRadius);
  shackleGradient.addColorStop(0, '#f5fbff');
  shackleGradient.addColorStop(0.35, '#afbcca');
  shackleGradient.addColorStop(0.7, '#697c91');
  shackleGradient.addColorStop(1, '#eaf2f9');
  context.lineWidth = shackleLineWidth;
  context.strokeStyle = shackleGradient;
  context.beginPath();
  context.moveTo(centerX - shackleRadius, shackleBottomY);
  context.arc(centerX, shackleBottomY, shackleRadius, Math.PI, 0, false);
  context.lineTo(centerX + shackleRadius, shackleBottomY);
  context.stroke();
  context.restore();

  context.save();
  context.strokeStyle = withAlpha(cyan, 0.72);
  context.shadowColor = withAlpha(cyan, 0.7);
  context.shadowBlur = 18;
  context.lineWidth = 4;
  context.lineCap = 'round';
  context.beginPath();
  context.arc(centerX, shackleBottomY, shackleRadius + shackleLineWidth * 0.18, Math.PI * 1.08, Math.PI * 1.34);
  context.stroke();
  context.beginPath();
  context.arc(centerX, shackleBottomY, shackleRadius + shackleLineWidth * 0.18, Math.PI * 1.66, Math.PI * 1.92);
  context.stroke();
  context.restore();

  context.save();
  drawRoundedRect(context, bodyX - 8, bodyY - 8, bodyWidth + 16, bodyHeight + 14, size * 0.16);
  const ceramicGradient = context.createLinearGradient(bodyX, bodyY, bodyX + bodyWidth, bodyY + bodyHeight);
  ceramicGradient.addColorStop(0, '#07182b');
  ceramicGradient.addColorStop(0.55, '#12253a');
  ceramicGradient.addColorStop(1, '#08111d');
  context.fillStyle = ceramicGradient;
  context.fill();
  context.restore();

  context.save();
  drawRoundedRect(context, bodyX, bodyY, bodyWidth, bodyHeight, size * 0.14);
  const metalGradient = context.createLinearGradient(bodyX, bodyY, bodyX + bodyWidth, bodyY + bodyHeight);
  metalGradient.addColorStop(0, '#eef6fc');
  metalGradient.addColorStop(0.36, '#bcc8d4');
  metalGradient.addColorStop(0.68, '#6a7a8c');
  metalGradient.addColorStop(1, '#f0f6fb');
  context.fillStyle = metalGradient;
  context.fill();
  context.clip();
  drawBrushedMetal(context, { x: bodyX, y: bodyY, width: bodyWidth, height: bodyHeight }, '#ffffff', '#758699');
  context.restore();

  context.save();
  context.beginPath();
  context.moveTo(bodyX + bodyWidth * 0.14, bodyY + bodyHeight * 0.1);
  context.lineTo(bodyX + bodyWidth * 0.86, bodyY + bodyHeight * 0.1);
  context.lineTo(bodyX + bodyWidth * 0.72, bodyY + bodyHeight * 0.9);
  context.lineTo(bodyX + bodyWidth * 0.28, bodyY + bodyHeight * 0.9);
  context.closePath();
  const faceGradient = context.createLinearGradient(bodyX, bodyY, bodyX + bodyWidth, bodyY + bodyHeight);
  faceGradient.addColorStop(0, 'rgba(255,255,255,0.16)');
  faceGradient.addColorStop(0.45, 'rgba(12, 27, 43, 0.2)');
  faceGradient.addColorStop(1, 'rgba(255,255,255,0.08)');
  context.fillStyle = faceGradient;
  context.fill();
  context.lineWidth = 1.5;
  context.strokeStyle = 'rgba(226, 237, 247, 0.2)';
  context.stroke();
  context.restore();

  context.save();
  const sidePanelColor = 'rgba(12, 27, 43, 0.76)';
  context.beginPath();
  context.moveTo(bodyX + 10, bodyY + 14);
  context.lineTo(bodyX + 28, bodyY + 24);
  context.lineTo(bodyX + 28, bodyY + bodyHeight - 18);
  context.lineTo(bodyX + 10, bodyY + bodyHeight - 10);
  context.closePath();
  context.fillStyle = sidePanelColor;
  context.fill();
  context.beginPath();
  context.moveTo(bodyX + bodyWidth - 10, bodyY + 14);
  context.lineTo(bodyX + bodyWidth - 28, bodyY + 24);
  context.lineTo(bodyX + bodyWidth - 28, bodyY + bodyHeight - 18);
  context.lineTo(bodyX + bodyWidth - 10, bodyY + bodyHeight - 10);
  context.closePath();
  context.fill();
  context.restore();

  context.save();
  drawRoundedRect(context, bodyX + 18, bodyY + 16, bodyWidth - 36, bodyHeight - 28, size * 0.1);
  context.fillStyle = 'rgba(8, 19, 33, 0.42)';
  context.fill();
  context.restore();

  const resinX = bodyX + bodyWidth * 0.27;
  const resinY = bodyY + bodyHeight * 0.26;
  const resinWidth = bodyWidth * 0.46;
  const resinHeight = bodyHeight * 0.36;

  context.save();
  drawRoundedRect(context, resinX, resinY, resinWidth, resinHeight, size * 0.09);
  const resinGradient = context.createLinearGradient(resinX, resinY, resinX + resinWidth, resinY + resinHeight);
  resinGradient.addColorStop(0, 'rgba(196, 251, 255, 0.32)');
  resinGradient.addColorStop(0.55, withAlpha(cyan, 0.18));
  resinGradient.addColorStop(1, 'rgba(137, 195, 215, 0.12)');
  context.fillStyle = resinGradient;
  context.fill();
  context.clip();
  drawCircuitPattern(context, { x: resinX, y: resinY, width: resinWidth, height: resinHeight }, withAlpha(cyan, 0.32), '#ffffff');
  context.fillStyle = 'rgba(255,255,255,0.14)';
  context.beginPath();
  context.ellipse(resinX + resinWidth * 0.34, resinY + resinHeight * 0.28, resinWidth * 0.28, resinHeight * 0.18, -0.3, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.save();
  drawRoundedRect(context, resinX, resinY, resinWidth, resinHeight, size * 0.09);
  context.lineWidth = 3;
  context.strokeStyle = withAlpha(cyan, 0.52);
  context.shadowColor = withAlpha(cyan, 0.44);
  context.shadowBlur = 18;
  context.stroke();
  context.restore();

  context.save();
  drawKeyhole(context, centerX, resinY + resinHeight * 0.56, size * 0.32, '#eaffff');
  context.restore();

  context.save();
  context.strokeStyle = withAlpha(cyan, 0.72);
  context.shadowColor = withAlpha(cyan, 0.72);
  context.shadowBlur = 16;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centerX, resinY + resinHeight * 0.56 - size * 0.08, size * 0.06, Math.PI * 0.15, Math.PI * 0.85);
  context.stroke();
  context.beginPath();
  context.moveTo(centerX, resinY + resinHeight * 0.64);
  context.lineTo(centerX, resinY + resinHeight * 0.78);
  context.stroke();
  context.restore();

  context.save();
  context.fillStyle = withAlpha('#d9e3ed', 0.78);
  const boltOffsets = [
    [bodyX + 24, bodyY + 24],
    [bodyX + bodyWidth - 24, bodyY + 24],
    [bodyX + 24, bodyY + bodyHeight - 22],
    [bodyX + bodyWidth - 24, bodyY + bodyHeight - 22]
  ];
  boltOffsets.forEach(([x, y]) => {
    context.beginPath();
    context.arc(x, y, 4.2, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
};

const drawChipTexture = (context, centerX, centerY, radius, theme) => {
  const bounds = {
    x: centerX - radius,
    y: centerY - radius,
    width: radius * 2,
    height: radius * 2
  };

  context.save();
  drawPolygonPath(context, regularPolygonPoints(centerX, centerY, radius, 6, Math.PI / 6));
  context.clip();

  const chipGlow = context.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius + 10);
  chipGlow.addColorStop(0, withAlpha('#ffd66c', 0.88));
  chipGlow.addColorStop(0.55, withAlpha('#d8a51e', 0.72));
  chipGlow.addColorStop(1, withAlpha('#4d3005', 0.96));
  context.fillStyle = chipGlow;
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

  drawCircuitPattern(context, bounds, '#ffe18c', theme.cyan);

  context.strokeStyle = withAlpha('#ffe49c', 0.35);
  context.lineWidth = 2;
  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 6 + (Math.PI * 2 * index) / 6;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(centerX + radius * 0.9 * Math.cos(angle), centerY + radius * 0.9 * Math.sin(angle));
    context.stroke();
  }

  context.restore();
};

const drawStarPath = (context, centerX, centerY, outerRadius, innerRadius, rotation = -Math.PI / 2) => {
  context.beginPath();

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (Math.PI / 5) * index;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.closePath();
};

const getPolygonPerimeterPoints = (points, count) => {
  const edges = [];
  let perimeter = 0;

  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    const start = points[index];
    const end = points[nextIndex];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    edges.push({ start, end, length });
    perimeter += length;
  }

  return Array.from({ length: count }, (_, index) => {
    let distance = (perimeter * index) / count;

    for (const edge of edges) {
      if (distance <= edge.length) {
        const ratio = edge.length === 0 ? 0 : distance / edge.length;
        return {
          x: edge.start.x + (edge.end.x - edge.start.x) * ratio,
          y: edge.start.y + (edge.end.y - edge.start.y) * ratio
        };
      }
      distance -= edge.length;
    }

    return points[0];
  });
};

const interpolatePoint = (start, end, ratio) => ({
  x: start.x + (end.x - start.x) * ratio,
  y: start.y + (end.y - start.y) * ratio
});

const drawArcText = (context, text, centerX, centerY, radius, startAngle, endAngle, options = {}) => {
  const content = String(text || '').trim();

  if (!content) {
    return;
  }

  const chars = Array.from(content);
  const step = chars.length <= 1 ? 0 : (endAngle - startAngle) / (chars.length - 1);

  context.save();
  context.fillStyle = options.fillStyle || 'rgba(255,255,255,0.28)';
  context.font = options.font || `500 12px ${FONT_FAMILY}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = options.shadowColor || 'transparent';
  context.shadowBlur = options.shadowBlur || 0;

  chars.forEach((char, index) => {
    const angle = startAngle + step * index;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    context.save();
    context.translate(x, y);
    context.rotate(angle + (options.clockwise === false ? -Math.PI / 2 : Math.PI / 2));
    context.fillText(char, 0, 0);
    context.restore();
  });

  context.restore();
};

const drawBronzeMedal = (context, centerX, centerY, theme) => {
  drawAsymmetricBasePlate(context, centerX, centerY + 12, 520, 500, theme);

  const outerPoints = regularPolygonPoints(centerX, centerY, 186, 6, Math.PI / 6);
  const bronzePoints = regularPolygonPoints(centerX, centerY, 160, 6, Math.PI / 6);

  const enamelGradient = context.createLinearGradient(centerX - 170, centerY - 150, centerX + 170, centerY + 170);
  enamelGradient.addColorStop(0, '#153f6a');
  enamelGradient.addColorStop(1, '#061629');
  fillPolygon(context, outerPoints, enamelGradient, withAlpha('#8bcfff', 0.16), 3);

  const bronzeGradient = context.createLinearGradient(centerX - 150, centerY - 150, centerX + 170, centerY + 170);
  bronzeGradient.addColorStop(0, '#d2a06c');
  bronzeGradient.addColorStop(0.48, theme.metalMid);
  bronzeGradient.addColorStop(1, '#6e3f1b');
  context.save();
  drawPolygonPath(context, bronzePoints);
  context.fillStyle = bronzeGradient;
  context.fill();
  context.clip();
  drawBrushedMetal(context, { x: centerX - 180, y: centerY - 180, width: 360, height: 360 }, '#f2cfab', '#6e3f1b');
  context.restore();

  context.save();
  drawPolygonPath(context, bronzePoints);
  context.lineWidth = 3;
  context.strokeStyle = withAlpha('#f0c48e', 0.48);
  context.stroke();
  context.restore();

  drawShieldOutline(context, centerX, centerY + 6, 136, 164, withAlpha('#6f3f1c', 0.88), withAlpha('#f4d8b0', 0.78));

  context.save();
  buildShieldPath(context, centerX, centerY + 6, 118, 146);
  const shieldGradient = context.createLinearGradient(centerX, centerY - 70, centerX, centerY + 96);
  shieldGradient.addColorStop(0, withAlpha('#f1c898', 0.24));
  shieldGradient.addColorStop(1, withAlpha('#4d2d12', 0.22));
  context.fillStyle = shieldGradient;
  context.fill();
  context.restore();

  drawKeyhole(context, centerX, centerY + 18, 78, '#fff5e5');
};

const drawSilverMedal = (context, centerX, centerY, theme) => {
  drawAsymmetricBasePlate(context, centerX, centerY + 4, 530, 510, theme);
  drawGlow(context, centerX, centerY, 220, theme.cyan, 0.18);

  const outerPoints = regularPolygonPoints(centerX, centerY, 188, 6, Math.PI / 6);
  const moduleInnerPoints = regularPolygonPoints(centerX, centerY, 156, 6, Math.PI / 6);
  const fortressInnerPoints = regularPolygonPoints(centerX, centerY, 132, 6, Math.PI / 6);

  const modulePalette = [
    { fill: '#edf3f9', stroke: 'rgba(255,255,255,0.44)' },
    { fill: '#5f7186', stroke: 'rgba(223,235,246,0.22)' }
  ];

  for (let index = 0; index < outerPoints.length; index += 1) {
    const nextIndex = (index + 1) % outerPoints.length;
    const outerStart = outerPoints[index];
    const outerEnd = outerPoints[nextIndex];
    const innerStart = moduleInnerPoints[index];
    const innerEnd = moduleInnerPoints[nextIndex];
    const outerMid = interpolatePoint(outerStart, outerEnd, 0.5);
    const innerMid = interpolatePoint(innerStart, innerEnd, 0.5);
    const modulePairs = [
      [outerStart, outerMid, innerMid, innerStart],
      [outerMid, outerEnd, innerEnd, innerMid]
    ];

    modulePairs.forEach((modulePoints, moduleIndex) => {
      const palette = modulePalette[(index + moduleIndex) % modulePalette.length];
      const moduleGradient = context.createLinearGradient(
        modulePoints[0].x,
        modulePoints[0].y,
        modulePoints[2].x,
        modulePoints[2].y
      );
      moduleGradient.addColorStop(0, palette.fill);
      moduleGradient.addColorStop(1, moduleIndex % 2 === 0 ? '#8f9fb3' : '#44596e');
      fillPolygon(context, modulePoints, moduleGradient, palette.stroke, 2);
    });
  }

  drawHexFacetBands(context, moduleInnerPoints, fortressInnerPoints, [
    withAlpha('#ffffff', 0.08),
    withAlpha('#0b1930', 0.22),
    withAlpha('#9fb1c4', 0.1)
  ]);

  const cavityGradient = context.createLinearGradient(centerX - 130, centerY - 130, centerX + 130, centerY + 130);
  cavityGradient.addColorStop(0, '#071625');
  cavityGradient.addColorStop(0.5, '#0b1b2e');
  cavityGradient.addColorStop(1, '#040b14');
  fillPolygon(context, fortressInnerPoints, cavityGradient, withAlpha('#dce7f2', 0.14), 2);

  context.save();
  drawPolygonPath(context, outerPoints);
  context.lineWidth = 2;
  context.strokeStyle = withAlpha('#b1c2d4', 0.2);
  context.stroke();
  context.restore();

  const jointPoints = [...outerPoints, ...moduleInnerPoints];
  context.save();
  context.fillStyle = withAlpha('#c3d3e4', 0.7);
  jointPoints.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 3, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();

  const ringText = 'STATE SECURITY / DATA PROTECTION / ';
  drawArcText(context, ringText, centerX, centerY, 170, -Math.PI * 0.8, -Math.PI * 0.22, {
    font: `500 11px ${FONT_FAMILY}`,
    fillStyle: 'rgba(215, 227, 238, 0.22)'
  });
  drawArcText(context, ringText, centerX, centerY, 170, Math.PI * 0.22, Math.PI * 0.8, {
    font: `500 11px ${FONT_FAMILY}`,
    fillStyle: 'rgba(215, 227, 238, 0.22)',
    clockwise: false
  });
  drawArcText(context, ringText, centerX, centerY, 154, -Math.PI * 0.78, -Math.PI * 0.24, {
    font: `500 10px ${FONT_FAMILY}`,
    fillStyle: 'rgba(151, 168, 186, 0.24)'
  });
  drawArcText(context, ringText, centerX, centerY, 154, Math.PI * 0.24, Math.PI * 0.78, {
    font: `500 10px ${FONT_FAMILY}`,
    fillStyle: 'rgba(151, 168, 186, 0.24)',
    clockwise: false
  });

  context.save();
  for (let index = 0; index < 2; index += 1) {
    const direction = index === 0 ? -1 : 1;
    const recessX = centerX + direction * 132 - 9;
    drawRoundedRect(context, recessX, centerY - 76, 18, 152, 8);
    context.fillStyle = 'rgba(7, 16, 28, 0.88)';
    context.fill();

    for (let led = 0; led < 3; led += 1) {
      drawRoundedRect(context, recessX + 5, centerY - 64 + led * 46, 8, 32, 4);
      context.fillStyle = withAlpha(theme.cyan, 0.86 - led * 0.08);
      context.shadowColor = withAlpha(theme.cyan, 0.72);
      context.shadowBlur = 18;
      context.fill();
    }
  }
  context.restore();

  const coreRadius = 76;
  const coreGradient = context.createRadialGradient(centerX - 16, centerY - 18, 8, centerX, centerY, coreRadius + 8);
  coreGradient.addColorStop(0, 'rgba(255,255,255,0.42)');
  coreGradient.addColorStop(0.4, 'rgba(182, 241, 255, 0.22)');
  coreGradient.addColorStop(1, 'rgba(137, 190, 214, 0.08)');
  context.beginPath();
  context.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
  context.fillStyle = coreGradient;
  context.fill();

  drawGlassShape(context, () => {
    context.beginPath();
    context.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
  }, {
    x: centerX - coreRadius,
    y: centerY - coreRadius,
    width: coreRadius * 2,
    height: coreRadius * 2
  }, theme, { topAlpha: 0.22, midAlpha: 0.08, bottomAlpha: 0.2, lineWidth: 4 });

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = 'rgba(255,255,255,0.14)';
  context.beginPath();
  context.ellipse(centerX - 10, centerY - 28, 52, 26, -0.35, 0, Math.PI * 2);
  context.fill();
  context.restore();

  drawHeavyPadlock(context, centerX, centerY + 6, 116, theme);
};

const drawGoldMedal = (context, centerX, centerY, theme) => {
  drawAsymmetricBasePlate(context, centerX, centerY + 4, 540, 520, theme);
  drawGlow(context, centerX, centerY, 250, theme.cyan, 0.16);

  const outerPoints = regularPolygonPoints(centerX, centerY, 186, 6, Math.PI / 6);
  const middlePoints = regularPolygonPoints(centerX, centerY, 160, 6, Math.PI / 6);
  const glassPoints = regularPolygonPoints(centerX, centerY, 126, 6, Math.PI / 6);

  const frameGradient = context.createLinearGradient(centerX - 180, centerY - 180, centerX + 180, centerY + 180);
  frameGradient.addColorStop(0, '#fff2bd');
  frameGradient.addColorStop(0.3, '#c7951d');
  frameGradient.addColorStop(0.6, '#ffd96c');
  frameGradient.addColorStop(1, '#8b5f08');
  fillPolygon(context, outerPoints, frameGradient, withAlpha('#ffe7a6', 0.34), 3);
  drawHexFacetBands(context, outerPoints, middlePoints, [
    withAlpha('#fff1b6', 0.24),
    withAlpha('#9e6d06', 0.18),
    withAlpha('#f7ca55', 0.18)
  ]);

  context.save();
  drawPolygonPath(context, middlePoints);
  context.clip();
  drawBrushedMetal(context, { x: centerX - 190, y: centerY - 190, width: 380, height: 380 }, '#fff1ba', '#8d6308');
  context.restore();

  context.save();
  drawPolygonPath(context, middlePoints);
  const mirrorGradient = context.createLinearGradient(centerX - 120, centerY - 150, centerX + 140, centerY + 160);
  mirrorGradient.addColorStop(0, '#fef7cd');
  mirrorGradient.addColorStop(0.5, '#d1a128');
  mirrorGradient.addColorStop(1, '#fff0b0');
  context.fillStyle = mirrorGradient;
  context.globalAlpha = 0.34;
  context.fill();
  context.restore();

  context.save();
  drawPolygonPath(context, glassPoints);
  context.clip();
  const glassBase = context.createLinearGradient(centerX - 120, centerY - 120, centerX + 120, centerY + 120);
  glassBase.addColorStop(0, '#0d2644');
  glassBase.addColorStop(1, '#071221');
  context.fillStyle = glassBase;
  context.fillRect(centerX - 150, centerY - 150, 300, 300);
  context.restore();

  drawChipTexture(context, centerX, centerY, 126, theme);

  drawGlassShape(context, () => {
    drawPolygonPath(context, glassPoints);
  }, {
    x: centerX - 126,
    y: centerY - 126,
    width: 252,
    height: 252
  }, theme, { topAlpha: 0.22, midAlpha: 0.08, bottomAlpha: 0.12 });
};

const drawSpecialMedal = (context, centerX, centerY, theme) => {
  drawAsymmetricBasePlate(context, centerX, centerY + 8, 560, 540, theme);
  drawGlow(context, centerX, centerY, 300, theme.cyan, 0.26);

  const outerPoints = regularPolygonPoints(centerX, centerY, 194, 6, Math.PI / 6);
  const innerPoints = regularPolygonPoints(centerX, centerY, 144, 6, Math.PI / 6);

  const platinumGradient = context.createLinearGradient(centerX - 190, centerY - 190, centerX + 190, centerY + 190);
  platinumGradient.addColorStop(0, '#ffffff');
  platinumGradient.addColorStop(0.4, '#dce4ef');
  platinumGradient.addColorStop(1, '#93a3b7');
  fillPolygon(context, outerPoints, platinumGradient, withAlpha('#ffffff', 0.54), 3);
  drawHexFacetBands(context, outerPoints, innerPoints, [
    withAlpha('#ffffff', 0.16),
    withAlpha('#94a2b6', 0.2),
    withAlpha('#f2f8ff', 0.12)
  ]);

  const cavityGradient = context.createLinearGradient(centerX - 140, centerY - 140, centerX + 140, centerY + 140);
  cavityGradient.addColorStop(0, '#0b1219');
  cavityGradient.addColorStop(0.55, '#121820');
  cavityGradient.addColorStop(1, '#04080d');
  fillPolygon(context, innerPoints, cavityGradient, withAlpha('#6adfff', 0.12), 2);

  drawGlow(context, centerX, centerY, 160, theme.cyan, 0.36);

  context.save();
  context.translate(centerX, centerY);
  for (let layer = 2; layer >= 0; layer -= 1) {
    context.save();
    context.translate(layer * 10 - 10, layer * 6 - 6);
    drawStarPath(context, 0, 0, 96 - layer * 8, 42 - layer * 4);
    const starGradient = context.createLinearGradient(-100, -100, 100, 100);
    starGradient.addColorStop(0, layer === 0 ? '#ffffff' : withAlpha('#a5f7ff', 0.7 - layer * 0.12));
    starGradient.addColorStop(1, layer === 0 ? withAlpha(theme.cyan, 0.92) : withAlpha('#114e70', 0.72));
    context.fillStyle = starGradient;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = withAlpha('#ffffff', 0.52 - layer * 0.1);
    context.stroke();
    context.restore();
  }
  context.restore();

  context.save();
  context.strokeStyle = withAlpha(theme.cyan, 0.7);
  context.lineWidth = 3;
  context.shadowColor = withAlpha(theme.cyan, 0.72);
  context.shadowBlur = 20;
  for (let ring = 0; ring < 2; ring += 1) {
    context.beginPath();
    context.arc(centerX, centerY, 88 + ring * 22, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();

  const lights = getPolygonPerimeterPoints(outerPoints, 20);
  context.save();
  context.fillStyle = withAlpha(theme.cyan, 0.92);
  context.shadowColor = withAlpha(theme.cyan, 0.86);
  context.shadowBlur = 16;
  lights.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 4.2, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
};

const drawEncourageMedal = (context, centerX, centerY, theme) => {
  drawAsymmetricBasePlate(context, centerX, centerY, 490, 470, theme);
  const points = regularPolygonPoints(centerX, centerY, 170, 6, Math.PI / 6);

  context.save();
  drawPolygonPath(context, points);
  const gradient = context.createLinearGradient(centerX - 170, centerY - 170, centerX + 170, centerY + 170);
  gradient.addColorStop(0, theme.metalLight);
  gradient.addColorStop(1, theme.metalDark);
  context.fillStyle = gradient;
  context.fill();
  context.restore();

  drawGlassShape(context, () => {
    context.beginPath();
    context.arc(centerX, centerY, 88, 0, Math.PI * 2);
  }, {
    x: centerX - 88,
    y: centerY - 88,
    width: 176,
    height: 176
  }, theme, { topAlpha: 0.3, midAlpha: 0.1, bottomAlpha: 0.22 });

  drawLock(context, centerX, centerY, 132, '#efffff', 'rgba(255,255,255,0.08)');
};

const drawMedalByTier = (context, centerX, centerY, medalTier, theme) => {
  if (medalTier === 'bronze') {
    drawBronzeMedal(context, centerX, centerY, theme);
    return;
  }

  if (medalTier === 'silver') {
    drawSilverMedal(context, centerX, centerY, theme);
    return;
  }

  if (medalTier === 'special') {
    drawSpecialMedal(context, centerX, centerY, theme);
    return;
  }

  if (medalTier === 'encourage') {
    drawEncourageMedal(context, centerX, centerY, theme);
    return;
  }

  drawGoldMedal(context, centerX, centerY, theme);
};

const drawPosterBackground = (context, theme) => {
  const backgroundGradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  backgroundGradient.addColorStop(0, '#04101f');
  backgroundGradient.addColorStop(0.45, '#071a31');
  backgroundGradient.addColorStop(1, '#041324');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawGlow(context, 150, 120, 220, theme.cyan, 0.09);
  drawGlow(context, 760, 220, 260, theme.cyan, 0.08);
  drawGlow(context, 680, 900, 300, theme.cyan, 0.08);

  context.save();
  context.strokeStyle = 'rgba(109, 171, 220, 0.08)';
  context.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += 46) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, CANVAS_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 46) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(CANVAS_WIDTH, y);
    context.stroke();
  }
  context.restore();

  context.save();
  context.beginPath();
  context.moveTo(66, 72);
  context.lineTo(724, 72);
  context.lineTo(834, 150);
  context.lineTo(834, 1126);
  context.lineTo(172, 1126);
  context.lineTo(66, 1040);
  context.closePath();
  context.fillStyle = 'rgba(5, 18, 36, 0.72)';
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = 'rgba(120, 206, 255, 0.16)';
  context.stroke();
  context.restore();

  context.save();
  context.strokeStyle = withAlpha(theme.cyan, 0.24);
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(98, 134);
  context.lineTo(278, 134);
  context.lineTo(318, 174);
  context.stroke();
  context.beginPath();
  context.moveTo(804, 1008);
  context.lineTo(640, 1008);
  context.lineTo(602, 1046);
  context.stroke();
  context.restore();
};

const drawPosterText = (context, theme, username, awardTitle, correctCount, totalQuestions, awardedAt) => {
  const safeAwardTitle = String(awardTitle || '').trim();
  const safeUserName = String(username || '').trim();

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';

  context.fillStyle = withAlpha(theme.cyan, 0.92);
  context.font = `700 20px ${FONT_FAMILY}`;
  context.fillText('密码安全宣传活动', 110, 134);

  context.fillStyle = '#f4fbff';
  context.font = `700 44px ${FONT_FAMILY}`;
  context.fillText('电子荣誉奖牌', 110, 198);

  const titleSize = fitFontSize(context, safeAwardTitle, 40, 26, 680);
  context.font = `700 ${titleSize}px ${FONT_FAMILY}`;
  context.fillStyle = theme.text;
  const awardLines = wrapText(context, safeAwardTitle, 680).slice(0, 2);
  awardLines.forEach((line, index) => {
    context.fillText(line, 110, 860 + index * 48);
  });

  context.fillStyle = withAlpha(theme.text, 0.68);
  context.font = `500 24px ${FONT_FAMILY}`;
  context.fillText('密码安全知识挑战', 110, 954);

  context.save();
  drawRoundedRect(context, 110, 986, 680, 144, 28);
  context.fillStyle = 'rgba(8, 23, 46, 0.74)';
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = 'rgba(120, 206, 255, 0.14)';
  context.stroke();
  context.restore();

  context.fillStyle = '#f5fbff';
  context.font = `700 30px ${FONT_FAMILY}`;
  context.fillText(`获奖人：${safeUserName}`, 140, 1046);

  context.fillStyle = withAlpha(theme.text, 0.78);
  context.font = `500 22px ${FONT_FAMILY}`;
  context.fillText(`答题成绩：${correctCount} / ${totalQuestions}`, 140, 1088);
  context.fillText(`颁发日期：${formatAwardDate(awardedAt)}`, 470, 1088);

  context.font = `400 19px ${FONT_FAMILY}`;
  context.fillStyle = withAlpha(theme.text, 0.72);
  const copyLines = wrapText(context, buildMedalCopy({ awardTitle: safeAwardTitle, correctCount, totalQuestions }), 680).slice(0, 3);
  copyLines.forEach((line, index) => {
    context.fillText(line, 110, 1158 + index * 28);
  });
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
  const theme = MEDAL_THEMES[medalTier] || MEDAL_THEMES.gold;

  drawPosterBackground(context, theme);
  drawMedalByTier(context, CANVAS_WIDTH / 2 + 88, 506, medalTier, theme);
  drawPosterText(context, theme, username, awardTitle, correctCount, totalQuestions, awardedAt);

  return canvas.toDataURL('image/png');
};
