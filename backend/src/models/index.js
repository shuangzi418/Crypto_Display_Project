const sequelize = require('../config/database');
const User = require('./User');
const Question = require('./Question');
const Competition = require('./Competition');
const Submission = require('./Submission');
const Message = require('./Message');
const CompetitionParticipant = require('./CompetitionParticipant');
const CompetitionQuestion = require('./CompetitionQuestion');

User.hasMany(Submission, { foreignKey: 'userId', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Question.hasMany(Submission, { foreignKey: 'questionId', as: 'submissions' });
Submission.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

User.hasMany(Message, { foreignKey: 'userId', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Competition.belongsToMany(Question, {
  through: CompetitionQuestion,
  foreignKey: 'competitionId',
  otherKey: 'questionId',
  as: 'questions'
});
Question.belongsToMany(Competition, {
  through: CompetitionQuestion,
  foreignKey: 'questionId',
  otherKey: 'competitionId',
  as: 'competitions'
});

Competition.belongsToMany(User, {
  through: CompetitionParticipant,
  foreignKey: 'competitionId',
  otherKey: 'userId',
  as: 'participants'
});
User.belongsToMany(Competition, {
  through: CompetitionParticipant,
  foreignKey: 'userId',
  otherKey: 'competitionId',
  as: 'joinedCompetitions'
});

Competition.hasMany(CompetitionParticipant, {
  foreignKey: 'competitionId',
  as: 'participantRecords'
});
CompetitionParticipant.belongsTo(Competition, {
  foreignKey: 'competitionId',
  as: 'competition'
});

User.hasMany(CompetitionParticipant, {
  foreignKey: 'userId',
  as: 'competitionEntries'
});
CompetitionParticipant.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  sequelize,
  User,
  Question,
  Competition,
  Submission,
  Message,
  CompetitionParticipant,
  CompetitionQuestion
};
