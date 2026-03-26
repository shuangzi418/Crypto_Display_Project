package com.ruoyi.system.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import com.ruoyi.system.domain.QuizQuestion;

public interface QuizQuestionMapper
{
    List<QuizQuestion> selectQuestionList(QuizQuestion question);

    QuizQuestion selectQuestionById(Long id);

    int insertQuestion(QuizQuestion question);

    int updateQuestion(QuizQuestion question);

    int deleteQuestionByIds(Long[] ids);

    List<QuizQuestion> selectQuestionsByIds(@Param("ids") List<Long> ids);

    List<QuizQuestion> selectQuestionOptionList();
}
