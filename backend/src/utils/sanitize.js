const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
};

const sanitizePlainText = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input.replace(/[\$\{\}]/g, '').trim();
};

module.exports = {
  sanitizeInput,
  sanitizePlainText
};
