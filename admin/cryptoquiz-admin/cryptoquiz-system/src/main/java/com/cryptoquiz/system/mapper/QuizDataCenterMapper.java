package com.cryptoquiz.system.mapper;

import java.util.List;
import java.util.Map;
import com.cryptoquiz.system.domain.QuizBusinessUser;
import com.cryptoquiz.system.domain.QuizCompetition;
import com.cryptoquiz.system.domain.QuizDataTableStat;
import com.cryptoquiz.system.domain.QuizLeaderboardEntry;

public interface QuizDataCenterMapper
{
    Map<String, Object> selectCoreMetrics();

    List<QuizDataTableStat> selectTableStats();

    List<QuizCompetition> selectRecentCompetitions();

    List<QuizBusinessUser> selectPendingReviews();

    List<QuizLeaderboardEntry> selectTopUsers();
}
