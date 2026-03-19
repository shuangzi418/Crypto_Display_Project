import api from '../axios';
import { GET_QUESTIONS, GET_QUESTION, QUESTION_ERROR } from './types';

// 获取题目列表
export const getQuestions = (filters = {}) => async dispatch => {
  try {
    const params = new URLSearchParams();
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.category) params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit);

    const res = await api.get(`/questions?${params.toString()}`);

    dispatch({
      type: GET_QUESTIONS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: QUESTION_ERROR,
      payload: err.response.data.message
    });
  }
};

// 获取单个题目
export const getQuestion = (id) => async dispatch => {
  try {
    const res = await api.get(`/questions/${id}`);

    dispatch({
      type: GET_QUESTION,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: QUESTION_ERROR,
      payload: err.response.data.message
    });
  }
};