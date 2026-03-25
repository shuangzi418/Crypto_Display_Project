package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.QuizCompetition;
import com.ruoyi.system.domain.QuizLeaderboardEntry;

public interface QuizLeaderboardMapper
{
    List<QuizLeaderboardEntry> selectOverallLeaderboardList(QuizLeaderboardEntry query);

    List<QuizLeaderboardEntry> selectCompetitionLeaderboardList(QuizLeaderboardEntry query);

    List<QuizCompetition> selectLeaderboardCompetitionOptions();
}
