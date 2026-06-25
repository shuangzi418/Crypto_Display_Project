package com.cryptoquiz.system.mapper;

import java.util.List;
import com.cryptoquiz.system.domain.QuizCompetition;
import com.cryptoquiz.system.domain.QuizLeaderboardEntry;

public interface QuizLeaderboardMapper
{
    List<QuizLeaderboardEntry> selectOverallLeaderboardList(QuizLeaderboardEntry query);

    List<QuizLeaderboardEntry> selectCompetitionLeaderboardList(QuizLeaderboardEntry query);

    List<QuizCompetition> selectLeaderboardCompetitionOptions();
}
