package com.ruoyi.system.service.impl;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.domain.QuizQuestion;
import com.ruoyi.system.mapper.QuizQuestionMapper;
import com.ruoyi.system.service.IQuizQuestionService;

@Service
public class QuizQuestionServiceImpl implements IQuizQuestionService
{
    private static final String[] VALID_DIFFICULTIES = { "easy", "medium", "hard" };

    @Autowired
    private QuizQuestionMapper questionMapper;

    @Override
    public List<QuizQuestion> selectQuestionList(QuizQuestion question)
    {
        return questionMapper.selectQuestionList(question);
    }

    @Override
    public QuizQuestion selectQuestionById(Long id)
    {
        return questionMapper.selectQuestionById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int insertQuestion(QuizQuestion question)
    {
        normalizeQuestion(question);
        return questionMapper.insertQuestion(question);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateQuestion(QuizQuestion question)
    {
        normalizeQuestion(question);
        return questionMapper.updateQuestion(question);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int deleteQuestionByIds(Long[] ids)
    {
        return questionMapper.deleteQuestionByIds(ids);
    }

    @Override
    public List<QuizQuestion> selectQuestionOptionList()
    {
        return questionMapper.selectQuestionOptionList();
    }

    private void normalizeQuestion(QuizQuestion question)
    {
        String title = StringUtils.trim(question.getTitle());
        String content = StringUtils.trim(question.getContent());
        String difficulty = StringUtils.trim(question.getDifficulty());
        String category = StringUtils.trim(question.getCategory());

        if (StringUtils.isBlank(title))
        {
            throw new ServiceException("题目标题不能为空");
        }
        if (StringUtils.isBlank(content))
        {
            throw new ServiceException("题目内容不能为空");
        }
        if (StringUtils.isBlank(category))
        {
            throw new ServiceException("题目分类不能为空");
        }
        if (!isValidDifficulty(difficulty))
        {
            throw new ServiceException("题目难度仅支持 easy、medium、hard");
        }
        if (question.getPoints() == null || question.getPoints() <= 0)
        {
            throw new ServiceException("题目分值必须大于 0");
        }

        List<String> normalizedOptions = new ArrayList<>();
        for (String option : question.getOptions())
        {
            String normalizedOption = StringUtils.trim(option);
            if (StringUtils.isNotBlank(normalizedOption))
            {
                normalizedOptions.add(normalizedOption);
            }
        }

        if (normalizedOptions.size() < 2)
        {
            throw new ServiceException("至少需要两个有效选项");
        }
        if (question.getCorrectAnswer() == null || question.getCorrectAnswer() < 0
                || question.getCorrectAnswer() >= normalizedOptions.size())
        {
            throw new ServiceException("正确答案索引超出选项范围");
        }

        question.setTitle(title);
        question.setContent(content);
        question.setCategory(category);
        question.setDifficulty(difficulty);
        question.setOptions(normalizedOptions);
    }

    private boolean isValidDifficulty(String difficulty)
    {
        for (String validDifficulty : VALID_DIFFICULTIES)
        {
            if (validDifficulty.equals(difficulty))
            {
                return true;
            }
        }
        return false;
    }
}
