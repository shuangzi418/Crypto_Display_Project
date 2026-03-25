import request from '@/utils/request'

export function listQuestion(query) {
  return request({
    url: '/quiz/question/list',
    method: 'get',
    params: query
  })
}

export function getQuestion(id) {
  return request({
    url: '/quiz/question/' + id,
    method: 'get'
  })
}

export function addQuestion(data) {
  return request({
    url: '/quiz/question',
    method: 'post',
    data: data
  })
}

export function updateQuestion(data) {
  return request({
    url: '/quiz/question',
    method: 'put',
    data: data
  })
}

export function delQuestion(id) {
  return request({
    url: '/quiz/question/' + id,
    method: 'delete'
  })
}

export function optionselectQuestion() {
  return request({
    url: '/quiz/question/optionselect',
    method: 'get'
  })
}
