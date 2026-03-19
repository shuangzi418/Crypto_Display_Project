import { combineReducers } from 'redux';
import userReducer from './userReducer';
import questionReducer from './questionReducer';
import submissionReducer from './submissionReducer';
import competitionReducer from './competitionReducer';

const rootReducer = combineReducers({
  user: userReducer,
  question: questionReducer,
  submission: submissionReducer,
  competition: competitionReducer
});

export default rootReducer;