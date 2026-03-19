const mongoose = require('mongoose');
const Question = require('./src/models/Question');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crypto-quiz', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Check question count
Question.countDocuments({}, (err, count) => {
  if (err) {
    console.error('Error counting questions:', err);
  } else {
    console.log('Total questions in database:', count);
  }
  mongoose.disconnect();
  process.exit();
});
