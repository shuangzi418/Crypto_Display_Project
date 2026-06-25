package com.cryptoquiz.system.service;

import java.util.List;
import com.cryptoquiz.system.domain.QuizQuestion;
import com.cryptoquiz.system.domain.QuizQuestionImportRow;

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
