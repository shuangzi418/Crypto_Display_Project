package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.QuizQuestion;
import com.ruoyi.system.domain.QuizQuestionImportRow;

public interface IQuizQuestionService
{
    List<QuizQuestion> selectQuestionList(QuizQuestion question);

    QuizQuestion selectQuestionById(Long id);

    int insertQuestion(QuizQuestion question);

    int updateQuestion(QuizQuestion question);

    int deleteQuestionByIds(Long[] ids);

    List<QuizQuestion> selectQuestionOptionList();

    String importQuestion(List<QuizQuestionImportRow> importRows, String operName);
}
