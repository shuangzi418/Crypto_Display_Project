import { GET_QUESTIONS, GET_QUESTION, QUESTION_ERROR } from '../actions/types';

const initialState = {
  questions: [],
  question: null,
  loading: true,
  error: null
};

const questionReducer = function(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_QUESTIONS:
      return {
        ...state,
        questions: payload,
        loading: false
      };
    case GET_QUESTION:
      return {
        ...state,
        question: payload,
        loading: false
      };
    case QUESTION_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
};

export default questionReducer;