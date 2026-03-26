package com.ruoyi.system.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import com.ruoyi.system.domain.QuizCompetition;
import com.ruoyi.system.domain.QuizQuestion;

public interface QuizCompetitionMapper
{
    List<QuizCompetition> selectCompetitionList(QuizCompetition competition);

    List<QuizCompetition> selectAllCompetitions();

    QuizCompetition selectCompetitionById(Long id);

    int insertCompetition(QuizCompetition competition);

    int updateCompetition(QuizCompetition competition);

    int updateCompetitionStatus(@Param("id") Long id, @Param("status") String status);

    int deleteCompetitionByIds(Long[] ids);

    int deleteCompetitionQuestionsByCompetitionId(Long id);

    int deleteCompetitionQuestionsByCompetitionIds(Long[] ids);

    int deleteCompetitionParticipantsByCompetitionIds(Long[] ids);

    int insertCompetitionQuestions(@Param("competitionId") Long competitionId, @Param("questionIds") List<Long> questionIds);

    List<Long> selectCompetitionQuestionIds(Long competitionId);

    List<QuizQuestion> selectCompetitionQuestions(Long competitionId);
}
