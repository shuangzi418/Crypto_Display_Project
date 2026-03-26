package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.QuizCompetition;

public interface IQuizCompetitionService
{
    List<QuizCompetition> selectCompetitionList(QuizCompetition competition);

    QuizCompetition selectCompetitionById(Long id);

    int insertCompetition(QuizCompetition competition);

    int updateCompetition(QuizCompetition competition);

    int deleteCompetitionByIds(Long[] ids);

    int syncCompetitionStatus();
}
