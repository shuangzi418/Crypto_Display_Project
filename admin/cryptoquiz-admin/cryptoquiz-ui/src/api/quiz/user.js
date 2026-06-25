import request from '@/utils/request'

export function listBusinessUser(query) {
  return request({
    url: '/quiz/user/list',
    method: 'get',
    params: query
  })
}

export function getBusinessUser(id) {
  return request({
    url: '/quiz/user/' + id,
    method: 'get'
  })
}

export function changeBusinessUserRole(data) {
  return request({
    url: '/quiz/user/changeRole',
    method: 'put',
    data: data
  })
}

export function listPendingNicknames(query) {
  return request({
    url: '/quiz/user/nickname/pending',
    method: 'get',
    params: query
  })
}

export function reviewNickname(data) {
  return request({
    url: '/quiz/user/nickname/review',
    method: 'put',
    data: data
  })
}

export function listPendingAvatars(query) {
  return request({
    url: '/quiz/user/avatar/pending',
    method: 'get',
    params: query
  })
}

export function reviewAvatar(data) {
  return request({
    url: '/quiz/user/avatar/review',
    method: 'put',
    data: data
  })
}
