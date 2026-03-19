const mongoose = require('mongoose');
const Competition = require('./src/models/Competition');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crypto-quiz', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Check competition structure
Competition.findOne({}, (err, competition) => {
  if (err) {
    console.error('Error finding competition:', err);
  } else {
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
        if (typeof competition.questions[0] === 'object') {
          console.log('First question structure:', competition.questions[0]);
        } else {
          console.log('First question:', competition.questions[0]);
        }
      }
    }
  }
  mongoose.disconnect();
  process.exit();
});
