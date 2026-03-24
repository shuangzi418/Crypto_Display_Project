import api from '../axios';
import { SUBMIT_ANSWER, SUBMISSION_ERROR, GET_SUBMISSIONS } from './types';

const getErrorMessage = (err, fallbackMessage) => {
  if (err && err.response && err.response.data && err.response.data.message) {
    return err.response.data.message;
  }

  return fallbackMessage;
};

// 提交答案
export const submitAnswer = (questionId, answer) => async dispatch => {
  try {
    const res = await api.post('/submissions', { questionId, answer });

    dispatch({
      type: SUBMIT_ANSWER,
      payload: res.data
    });

    return res.data;
  } catch (err) {
    const errorMessage = getErrorMessage(err, 'Submit answer failed');

    dispatch({
      type: SUBMISSION_ERROR,
      payload: errorMessage
    });

    throw new Error(errorMessage);
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
    const errorMessage = getErrorMessage(err, 'Load submissions failed');

    dispatch({
      type: SUBMISSION_ERROR,
      payload: errorMessage
    });
  }
};
