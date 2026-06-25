package com.cryptoquiz.system.service;

import java.util.List;
import com.cryptoquiz.system.domain.QuizCompetition;
import com.cryptoquiz.system.domain.QuizLeaderboardEntry;

public interface IQuizLeaderboardService
{
    List<QuizLeaderboardEntry> selectOverallLeaderboardList(QuizLeaderboardEntry query);

    List<QuizLeaderboardEntry> selectCompetitionLeaderboardList(QuizLeaderboardEntry query);

    List<QuizCompetition> selectCompetitionOptions();
}
