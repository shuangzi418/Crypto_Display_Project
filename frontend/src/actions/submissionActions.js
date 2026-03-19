import api from '../axios';
import { SUBMIT_ANSWER, SUBMISSION_ERROR, GET_SUBMISSIONS } from './types';

// 提交答案
export const submitAnswer = (questionId, answer) => async dispatch => {
  try {
    const res = await api.post('/submissions', { questionId, answer });

    dispatch({
      type: SUBMIT_ANSWER,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: SUBMISSION_ERROR,
      payload: err.response.data.message
    });
  }
};

// 获取用户答题历史
export const getSubmissions = () => async dispatch => {
  try {
    const res = await api.get('/submissions/history');

    dispatch({
      type: GET_SUBMISSIONS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: SUBMISSION_ERROR,
      payload: err.response.data.message
    });
  }
};