package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.system.domain.QuizCompetition;
import com.ruoyi.system.domain.QuizLeaderboardEntry;
import com.ruoyi.system.mapper.QuizLeaderboardMapper;
import com.ruoyi.system.service.IQuizLeaderboardService;

@Service
public class QuizLeaderboardServiceImpl implements IQuizLeaderboardService
{
    @Autowired
    private QuizLeaderboardMapper leaderboardMapper;

    @Override
    public List<QuizLeaderboardEntry> selectOverallLeaderboardList(QuizLeaderboardEntry query)
    {
        return leaderboardMapper.selectOverallLeaderboardList(query);
    }

    @Override
    public List<QuizLeaderboardEntry> selectCompetitionLeaderboardList(QuizLeaderboardEntry query)
    {
        if (query.getCompetitionId() == null)
        {
            throw new ServiceException("请选择竞赛后再查看竞赛排行榜");
        }
        return leaderboardMapper.selectCompetitionLeaderboardList(query);
    }

    @Override
    public List<QuizCompetition> selectCompetitionOptions()
    {
        return leaderboardMapper.selectLeaderboardCompetitionOptions();
    }
}
