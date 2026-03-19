import { SUBMIT_ANSWER, SUBMISSION_ERROR, GET_SUBMISSIONS } from '../actions/types';

const initialState = {
  submissions: [],
  currentSubmission: null,
  loading: true,
  error: null
};

const submissionReducer = function(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case SUBMIT_ANSWER:
      return {
        ...state,
        currentSubmission: payload,
        loading: false
      };
    case GET_SUBMISSIONS:
      return {
        ...state,
        submissions: payload,
        loading: false
      };
    case SUBMISSION_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
};

export default submissionReducer;