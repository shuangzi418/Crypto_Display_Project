import api from '../axios';
import { GET_COMPETITIONS, GET_COMPETITION, COMPETITION_ERROR, JOIN_COMPETITION, SUBMIT_COMPETITION_ANSWER, GET_COMPETITION_RANKING } from './types';

const getErrorMessage = (err, fallbackMessage) => {
  if (err && err.response && err.response.data && err.response.data.message) {
    return err.response.data.message;
  }

  return fallbackMessage;
};

// 获取竞赛列表
export const getCompetitions = (filters = {}) => async dispatch => {
  try {
    const params = new URLSearchParams();

    if (typeof filters === 'string') {
      params.append('status', filters);
    } else {
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
    }

    const queryString = params.toString();
    const res = await api.get(`/competitions${queryString ? `?${queryString}` : ''}`);

    dispatch({
      type: GET_COMPETITIONS,
      payload: res.data
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err, 'Load competitions failed');

    dispatch({
      type: COMPETITION_ERROR,
      payload: errorMessage
    });
  }
};

// 获取单个竞赛
export const getCompetition = (id) => async dispatch => {
  try {
    const res = await api.get(`/competitions/${id}`);

    dispatch({
      type: GET_COMPETITION,
      payload: res.data
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err, 'Load competition failed');

    dispatch({
      type: COMPETITION_ERROR,
      payload: errorMessage
    });
  }
};

// 参加竞赛
export const joinCompetition = (competitionId) => async dispatch => {
  try {
    const res = await api.post('/submissions/competition/join', { competitionId });

    dispatch({
      type: JOIN_COMPETITION,
      payload: res.data
    });

    return res.data;
  } catch (err) {
    const errorMessage = getErrorMessage(err, 'Join competition failed');

    dispatch({
      type: COMPETITION_ERROR,
      payload: errorMessage
    });

    throw new Error(errorMessage);
  }
};

// 提交竞赛答案
export const submitCompetitionAnswer = (competitionId, questionId, answer) => async dispatch => {
  try {
    const res = await api.post('/submissions/competition/submit', { competitionId, questionId, answer });

    dispatch({
      type: SUBMIT_COMPETITION_ANSWER,
      payload: res.data
    });

    return res.data;
  } catch (err) {
    const errorMessage = getErrorMessage(err, 'Submit competition answer failed');

    dispatch({
      type: COMPETITION_ERROR,
      payload: errorMessage
    });

    throw new Error(errorMessage);
  }
};

// 获取竞赛排行榜
export const getCompetitionRanking = (competitionId) => async dispatch => {
  try {
    const res = await api.get(`/submissions/competition/${competitionId}/ranking`);

    dispatch({
      type: GET_COMPETITION_RANKING,
      payload: res.data
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err, 'Load competition ranking failed');

    dispatch({
      type: COMPETITION_ERROR,
      payload: errorMessage
    });
  }
};
