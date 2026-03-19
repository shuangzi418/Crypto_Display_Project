import api from '../axios';
import { GET_COMPETITIONS, GET_COMPETITION, COMPETITION_ERROR, JOIN_COMPETITION, SUBMIT_COMPETITION_ANSWER, GET_COMPETITION_RANKING } from './types';

// 获取竞赛列表
export const getCompetitions = (status) => async dispatch => {
  try {
    const params = status ? `?status=${status}` : '';
    const res = await api.get(`/competitions${params}`);

    dispatch({
      type: GET_COMPETITIONS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: COMPETITION_ERROR,
      payload: err.response.data.message
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
    dispatch({
      type: COMPETITION_ERROR,
      payload: err.response.data.message
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
  } catch (err) {
    dispatch({
      type: COMPETITION_ERROR,
      payload: err.response.data.message
    });
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
  } catch (err) {
    dispatch({
      type: COMPETITION_ERROR,
      payload: err.response.data.message
    });
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
    dispatch({
      type: COMPETITION_ERROR,
      payload: err.response.data.message
    });
  }
};