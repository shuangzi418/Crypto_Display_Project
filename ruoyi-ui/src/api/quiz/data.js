import request from '@/utils/request'

export function getQuizDataOverview() {
  return request({
    url: '/quiz/data/overview',
    method: 'get'
  })
}
