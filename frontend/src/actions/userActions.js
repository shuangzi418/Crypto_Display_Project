import api from '../axios';
import { REGISTER_SUCCESS, REGISTER_FAIL, LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT, USER_LOADED, AUTH_ERROR } from './types';

const getErrorMessage = (err, fallbackMessage) => {
  if (err && err.response && err.response.data) {
    if (err.response.data.message) {
      return err.response.data.message;
    }

    if (Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
      return err.response.data.errors[0].msg || fallbackMessage;
    }
  }

  return fallbackMessage;
};

const persistToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

const clearToken = () => {
  localStorage.removeItem('token');
};

// 加载用户信息
export const loadUser = () => async dispatch => {
  try {
    const res = await api.get('/users/profile');

    dispatch({
      type: USER_LOADED,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR
    });
  }
};

// 注册用户
export const register = ({ username, email, password }) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = JSON.stringify({ username, email, password });

  try {
    const res = await api.post('/users/register', body, config);
    persistToken(res.data.token);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    clearToken();
    dispatch({
      type: REGISTER_FAIL
    });
    throw new Error(getErrorMessage(err, 'Registration failed'));
  }
};

// 登录用户
export const login = ({ email, password }) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = JSON.stringify({ email, password });

  try {
    const res = await api.post('/users/login', body, config);
    persistToken(res.data.token);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    clearToken();
    dispatch({
      type: LOGIN_FAIL
    });
    throw new Error(getErrorMessage(err, 'Login failed'));
  }
};

// 登出用户
export const logout = () => async dispatch => {
  try {
    await api.post('/users/logout');
  } finally {
    clearToken();
    dispatch({
      type: LOGOUT
    });
  }
};



// 刷新令牌
export const refreshToken = () => async dispatch => {
  try {
    const res = await api.post('/users/refresh-token');
    persistToken(res.data.token);
    
    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    clearToken();
    dispatch({
      type: LOGOUT
    });
  }
};
