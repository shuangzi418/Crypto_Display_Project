const { sequelize, Question } = require('./src/models');

async function checkQuestionCount() {
  try {
    await sequelize.authenticate();
    const count = await Question.count();
    console.log('Total questions in database:', count);
  } catch (error) {
    console.error('Error counting questions:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkQuestionCount();
