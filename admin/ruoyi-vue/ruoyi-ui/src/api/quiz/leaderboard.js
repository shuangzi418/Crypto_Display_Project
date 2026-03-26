import request from '@/utils/request'

export function listOverallLeaderboard(query) {
  return request({
    url: '/quiz/leaderboard/overall/list',
    method: 'get',
    params: query
  })
}

export function listCompetitionLeaderboard(query) {
  return request({
    url: '/quiz/leaderboard/competition/list',
    method: 'get',
    params: query
  })
}

export function listLeaderboardCompetitionOptions() {
  return request({
    url: '/quiz/leaderboard/competition/options',
    method: 'get'
  })
}
