const { sequelize, Competition, Question } = require('./src/models');

async function checkCompetitionStructure() {
  try {
    await sequelize.authenticate();

    const competition = await Competition.findOne({
      include: [
        {
          model: Question,
          as: 'questions',
          through: { attributes: [] }
        }
      ]
    });

    if (!competition) {
      console.log('No competition found');
      return;
    }

    console.log('Competition structure:');
    console.log('Title:', competition.title);
    console.log('Description:', competition.description);
    console.log('Start Date:', competition.startDate);
    console.log('End Date:', competition.endDate);
    console.log('Status:', competition.status);
    console.log('Questions type:', typeof competition.questions);
    console.log('Questions is array:', Array.isArray(competition.questions));

    if (Array.isArray(competition.questions)) {
      console.log('Questions length:', competition.questions.length);

      if (competition.questions.length > 0) {
        console.log('First question type:', typeof competition.questions[0]);
        console.log('First question structure:', competition.questions[0].toJSON());
      }
    }
  } catch (error) {
    console.error('Error finding competition:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkCompetitionStructure();
