package com.ruoyi.system.mapper;

import java.util.List;
import java.util.Map;
import com.ruoyi.system.domain.QuizBusinessUser;
import com.ruoyi.system.domain.QuizCompetition;
import com.ruoyi.system.domain.QuizDataTableStat;
import com.ruoyi.system.domain.QuizLeaderboardEntry;

public interface QuizDataCenterMapper
{
    Map<String, Object> selectCoreMetrics();

    List<QuizDataTableStat> selectTableStats();

    List<QuizCompetition> selectRecentCompetitions();

    List<QuizBusinessUser> selectPendingReviews();

    List<QuizLeaderboardEntry> selectTopUsers();
}
