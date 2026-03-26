package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.QuizCompetition;
import com.ruoyi.system.domain.QuizLeaderboardEntry;

public interface IQuizLeaderboardService
{
    List<QuizLeaderboardEntry> selectOverallLeaderboardList(QuizLeaderboardEntry query);

    List<QuizLeaderboardEntry> selectCompetitionLeaderboardList(QuizLeaderboardEntry query);

    List<QuizCompetition> selectCompetitionOptions();
}
