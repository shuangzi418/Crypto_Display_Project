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
  const {
    includeCorrectAnswer = false,
    includeExplanation = false
  } = options;
  const plainQuestion = toPlainObject(question);

  if (!plainQuestion) {
    return plainQuestion;
  }

  if (!includeCorrectAnswer) {
    delete plainQuestion.correctAnswer;
  }

  if (!includeExplanation) {
    delete plainQuestion.explanation;
  }

  return plainQuestion;
};

const serializeQuestions = (questions, options = {}) => {
  return (questions || []).map((question) => serializeQuestion(question, options));
};

const serializeSubmission = (submission, options = {}) => {
  const {
    includeQuestionCorrectAnswer = false,
    includeQuestionExplanation = false
  } = options;
  const plainSubmission = toPlainObject(submission);

  if (!plainSubmission) {
    return plainSubmission;
  }

  if (plainSubmission.question) {
    plainSubmission.question = serializeQuestion(plainSubmission.question, {
      includeCorrectAnswer: includeQuestionCorrectAnswer,
      includeExplanation: includeQuestionExplanation
    });
  }

  return plainSubmission;
};

module.exports = {
  serializeQuestion,
  serializeQuestions,
  serializeSubmission
};
