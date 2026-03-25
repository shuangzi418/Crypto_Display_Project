package com.ruoyi.system.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;
import org.apache.commons.lang3.math.NumberUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.domain.QuizQuestion;
import com.ruoyi.system.domain.QuizQuestionImportRow;
import com.ruoyi.system.mapper.QuizQuestionMapper;
import com.ruoyi.system.service.IQuizQuestionService;

@Service
public class QuizQuestionServiceImpl implements IQuizQuestionService
{
    private static final String[] VALID_DIFFICULTIES = { "easy", "medium", "hard" };

    private static final Logger log = LoggerFactory.getLogger(QuizQuestionServiceImpl.class);

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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String importQuestion(List<QuizQuestionImportRow> importRows, String operName)
    {
        if (importRows == null || importRows.isEmpty())
        {
            throw new ServiceException("导入题目数据不能为空");
        }

        int successNum = 0;
        int failureNum = 0;
        StringBuilder successMsg = new StringBuilder();
        StringBuilder failureMsg = new StringBuilder();

        for (int index = 0; index < importRows.size(); index++)
        {
            QuizQuestionImportRow row = importRows.get(index);
            int excelRowNum = index + 2;
            try
            {
                QuizQuestion question = buildQuestionFromImportRow(row, excelRowNum);
                question.setCreateBy(operName);
                questionMapper.insertQuestion(question);
                successNum++;
                successMsg.append("<br/>").append(successNum).append("、第 ").append(excelRowNum)
                        .append(" 行导入成功：").append(question.getTitle());
            }
            catch (Exception ex)
            {
                failureNum++;
                String message = "<br/>" + failureNum + "、第 " + excelRowNum + " 行导入失败：" + ex.getMessage();
                failureMsg.append(message);
                log.warn("导入题目失败，行号 {}", excelRowNum, ex);
            }
        }

        StringBuilder result = new StringBuilder();
        result.append("本次共处理 ").append(importRows.size()).append(" 条数据");
        result.append("<br/>成功：").append(successNum).append(" 条");
        result.append("<br/>失败：").append(failureNum).append(" 条");
        if (successNum > 0)
        {
            result.append("<br/><br/><strong>成功明细</strong>").append(successMsg);
        }
        if (failureNum > 0)
        {
            result.append("<br/><br/><strong>失败明细</strong>").append(failureMsg);
        }
        return result.toString();
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

    private QuizQuestion buildQuestionFromImportRow(QuizQuestionImportRow row, int excelRowNum)
    {
        QuizQuestion question = new QuizQuestion();
        question.setTitle(StringUtils.trim(row.getTitle()));
        question.setContent(StringUtils.trim(row.getContent()));
        question.setCategory(StringUtils.trim(row.getCategory()));
        question.setDifficulty(normalizeDifficulty(row.getDifficulty()));
        question.setPoints(parsePoints(row.getPoints(), excelRowNum));
        question.setOptions(buildOptions(row));
        question.setCorrectAnswer(parseCorrectAnswer(row.getCorrectAnswer(), question.getOptions(), excelRowNum));
        normalizeQuestion(question);
        return question;
    }

    private List<String> buildOptions(QuizQuestionImportRow row)
    {
        List<String> options = new ArrayList<>();
        addOption(options, row.getOptionA());
        addOption(options, row.getOptionB());
        addOption(options, row.getOptionC());
        addOption(options, row.getOptionD());
        addOption(options, row.getOptionE());
        addOption(options, row.getOptionF());
        return options;
    }

    private void addOption(List<String> options, String value)
    {
        String normalized = StringUtils.trim(value);
        if (StringUtils.isNotBlank(normalized))
        {
            options.add(normalized);
        }
    }

    private Integer parseCorrectAnswer(String answer, List<String> options, int excelRowNum)
    {
        String normalizedAnswer = StringUtils.trim(answer);
        if (StringUtils.isBlank(normalizedAnswer))
        {
            throw new ServiceException("第 " + excelRowNum + " 行正确答案不能为空");
        }

        String upperValue = normalizedAnswer.toUpperCase();
        if (upperValue.length() == 1 && upperValue.charAt(0) >= 'A' && upperValue.charAt(0) <= 'Z')
        {
            return upperValue.charAt(0) - 'A';
        }

        if (NumberUtils.isCreatable(upperValue))
        {
            int numericValue = NumberUtils.toInt(upperValue, -1);
            if (numericValue >= 0 && numericValue < options.size())
            {
                return numericValue;
            }
            if (numericValue > 0 && numericValue <= options.size())
            {
                return numericValue - 1;
            }
        }

        for (int index = 0; index < options.size(); index++)
        {
            if (StringUtils.equals(options.get(index), normalizedAnswer))
            {
                return index;
            }
        }
        throw new ServiceException("第 " + excelRowNum + " 行正确答案无法识别");
    }

    private String normalizeDifficulty(String difficulty)
    {
        String normalized = StringUtils.trim(difficulty);
        if (StringUtils.isBlank(normalized))
        {
            return normalized;
        }
        if (StringUtils.equalsAnyIgnoreCase(normalized, "easy", "简单"))
        {
            return "easy";
        }
        if (StringUtils.equalsAnyIgnoreCase(normalized, "medium", "中等"))
        {
            return "medium";
        }
        if (StringUtils.equalsAnyIgnoreCase(normalized, "hard", "困难"))
        {
            return "hard";
        }
        return normalized.toLowerCase();
    }

    private Integer parsePoints(String points, int excelRowNum)
    {
        String normalized = StringUtils.trim(points);
        if (StringUtils.isBlank(normalized))
        {
            throw new ServiceException("第 " + excelRowNum + " 行分值不能为空");
        }
        if (!NumberUtils.isCreatable(normalized))
        {
            throw new ServiceException("第 " + excelRowNum + " 行分值必须是数字");
        }
        BigDecimal value = NumberUtils.createBigDecimal(normalized);
        if (value.stripTrailingZeros().scale() > 0)
        {
            throw new ServiceException("第 " + excelRowNum + " 行分值必须是整数");
        }
        return value.intValue();
    }
}
