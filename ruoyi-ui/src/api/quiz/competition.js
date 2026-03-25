import request from '@/utils/request'

export function listCompetition(query) {
  return request({
    url: '/quiz/competition/list',
    method: 'get',
    params: query
  })
}

export function getCompetition(id) {
  return request({
    url: '/quiz/competition/' + id,
    method: 'get'
  })
}

export function addCompetition(data) {
  return request({
    url: '/quiz/competition',
    method: 'post',
    data: data
  })
}

export function updateCompetition(data) {
  return request({
    url: '/quiz/competition',
    method: 'put',
    data: data
  })
}

export function delCompetition(id) {
  return request({
    url: '/quiz/competition/' + id,
    method: 'delete'
  })
}

export function syncCompetitionStatus() {
  return request({
    url: '/quiz/competition/syncStatus',
    method: 'put'
  })
}
