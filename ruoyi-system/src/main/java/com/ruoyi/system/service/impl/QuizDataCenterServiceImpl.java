package com.ruoyi.system.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.domain.QuizBusinessUser;
import com.ruoyi.system.domain.QuizCompetition;
import com.ruoyi.system.domain.QuizDataTableStat;
import com.ruoyi.system.domain.QuizLeaderboardEntry;
import com.ruoyi.system.mapper.QuizDataCenterMapper;
import com.ruoyi.system.service.IQuizDataCenterService;

@Service
public class QuizDataCenterServiceImpl implements IQuizDataCenterService
{
    @Autowired
    private QuizDataCenterMapper dataCenterMapper;

    @Override
    public Map<String, Object> selectOverview()
    {
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> metrics = dataCenterMapper.selectCoreMetrics();
        List<QuizDataTableStat> tableStats = dataCenterMapper.selectTableStats();
        List<QuizCompetition> recentCompetitions = dataCenterMapper.selectRecentCompetitions();
        List<QuizBusinessUser> pendingReviews = dataCenterMapper.selectPendingReviews();
        List<QuizLeaderboardEntry> topUsers = dataCenterMapper.selectTopUsers();

        for (int index = 0; index < topUsers.size(); index++)
        {
            topUsers.get(index).setRank((long) index + 1);
        }

        result.put("metrics", metrics);
        result.put("tableStats", tableStats);
        result.put("recentCompetitions", recentCompetitions);
        result.put("pendingReviews", pendingReviews);
        result.put("topUsers", topUsers);
        return result;
    }
}
