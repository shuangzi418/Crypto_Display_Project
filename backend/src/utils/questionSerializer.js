const toPlainObject = (value) => {
  if (!value) {
    return value;
  }

  if (typeof value.toJSON === 'function') {
    return value.toJSON();
  }

  return { ...value };
};

const serializeQuestion = (question, options = {}) => {
  const { includeCorrectAnswer = false } = options;
  const plainQuestion = toPlainObject(question);

  if (!plainQuestion) {
    return plainQuestion;
  }

  if (!includeCorrectAnswer) {
    delete plainQuestion.correctAnswer;
  }

  return plainQuestion;
};

const serializeQuestions = (questions, options = {}) => {
  return (questions || []).map((question) => serializeQuestion(question, options));
};

const serializeSubmission = (submission, options = {}) => {
  const { includeQuestionCorrectAnswer = false } = options;
  const plainSubmission = toPlainObject(submission);

  if (!plainSubmission) {
    return plainSubmission;
  }

  if (plainSubmission.question) {
    plainSubmission.question = serializeQuestion(plainSubmission.question, {
      includeCorrectAnswer: includeQuestionCorrectAnswer
    });
  }

  return plainSubmission;
};

module.exports = {
  serializeQuestion,
  serializeQuestions,
  serializeSubmission
};
