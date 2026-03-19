import { GET_COMPETITIONS, GET_COMPETITION, COMPETITION_ERROR, JOIN_COMPETITION, SUBMIT_COMPETITION_ANSWER, GET_COMPETITION_RANKING } from '../actions/types';

const initialState = {
  competitions: [],
  competition: null,
  ranking: [],
  loading: true,
  error: null
};

const competitionReducer = function(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_COMPETITIONS:
      return {
        ...state,
        competitions: payload,
        loading: false
      };
    case GET_COMPETITION:
      return {
        ...state,
        competition: payload,
        loading: false
      };
    case GET_COMPETITION_RANKING:
      return {
        ...state,
        ranking: payload,
        loading: false
      };
    case JOIN_COMPETITION:
    case SUBMIT_COMPETITION_ANSWER:
      return {
        ...state,
        loading: false
      };
    case COMPETITION_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
};

export default competitionReducer;