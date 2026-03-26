package com.ruoyi.system.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.domain.QuizCompetition;
import com.ruoyi.system.domain.QuizQuestion;
import com.ruoyi.system.mapper.QuizCompetitionMapper;
import com.ruoyi.system.mapper.QuizQuestionMapper;
import com.ruoyi.system.service.IQuizCompetitionService;

@Service
public class QuizCompetitionServiceImpl implements IQuizCompetitionService
{
    @Autowired
    private QuizCompetitionMapper competitionMapper;

    @Autowired
    private QuizQuestionMapper questionMapper;

    @Override
    public List<QuizCompetition> selectCompetitionList(QuizCompetition competition)
    {
        return competitionMapper.selectCompetitionList(competition);
    }

    @Override
    public QuizCompetition selectCompetitionById(Long id)
    {
        QuizCompetition competition = competitionMapper.selectCompetitionById(id);
        if (competition == null)
        {
            return null;
        }

        List<Long> questionIds = competitionMapper.selectCompetitionQuestionIds(id);
        List<QuizQuestion> questions = competitionMapper.selectCompetitionQuestions(id);
        competition.setQuestionIds(questionIds);
        competition.setQuestions(questions);
        competition.setQuestionCount(questionIds.size());
        return competition;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int insertCompetition(QuizCompetition competition)
    {
        prepareCompetition(competition);
        int rows = competitionMapper.insertCompetition(competition);
        if (rows > 0)
        {
            competitionMapper.insertCompetitionQuestions(competition.getId(), competition.getQuestionIds());
        }
        return rows;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateCompetition(QuizCompetition competition)
    {
        QuizCompetition dbCompetition = competitionMapper.selectCompetitionById(competition.getId());
        if (dbCompetition == null)
        {
            throw new ServiceException("竞赛不存在");
        }

        prepareCompetition(competition);
        competitionMapper.deleteCompetitionQuestionsByCompetitionId(competition.getId());
        competitionMapper.insertCompetitionQuestions(competition.getId(), competition.getQuestionIds());
        return competitionMapper.updateCompetition(competition);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int deleteCompetitionByIds(Long[] ids)
    {
        competitionMapper.deleteCompetitionParticipantsByCompetitionIds(ids);
        competitionMapper.deleteCompetitionQuestionsByCompetitionIds(ids);
        return competitionMapper.deleteCompetitionByIds(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int syncCompetitionStatus()
    {
        int updated = 0;
        Date now = DateUtils.getNowDate();
        List<QuizCompetition> competitions = competitionMapper.selectAllCompetitions();
        for (QuizCompetition competition : competitions)
        {
            String nextStatus = resolveStatus(competition.getStartDate(), competition.getEndDate(), now);
            if (!StringUtils.equals(nextStatus, competition.getStatus()))
            {
                updated += competitionMapper.updateCompetitionStatus(competition.getId(), nextStatus);
            }
        }
        return updated;
    }

    private void prepareCompetition(QuizCompetition competition)
    {
        String title = StringUtils.trim(competition.getTitle());
        String description = StringUtils.trim(competition.getDescription());

        if (StringUtils.isBlank(title))
        {
            throw new ServiceException("竞赛标题不能为空");
        }
        if (StringUtils.isBlank(description))
        {
            throw new ServiceException("竞赛描述不能为空");
        }
        if (competition.getStartDate() == null || competition.getEndDate() == null)
        {
            throw new ServiceException("竞赛时间不能为空");
        }
        if (competition.getEndDate().getTime() <= competition.getStartDate().getTime())
        {
            throw new ServiceException("竞赛结束时间必须晚于开始时间");
        }

        List<Long> questionIds = normalizeQuestionIds(competition.getQuestionIds());
        if (questionIds.isEmpty())
        {
            throw new ServiceException("请至少选择一道题目");
        }

        List<QuizQuestion> questions = questionMapper.selectQuestionsByIds(questionIds);
        if (questions.size() != questionIds.size())
        {
            throw new ServiceException("包含不存在的题目");
        }

        Map<Long, QuizQuestion> questionMap = new HashMap<>();
        for (QuizQuestion question : questions)
        {
            questionMap.put(question.getId(), question);
        }

        int totalPoints = 0;
        List<QuizQuestion> orderedQuestions = new ArrayList<>();
        for (Long questionId : questionIds)
        {
            QuizQuestion question = questionMap.get(questionId);
            if (question == null)
            {
                throw new ServiceException("包含不存在的题目");
            }
            orderedQuestions.add(question);
            totalPoints += question.getPoints() == null ? 0 : question.getPoints();
        }

        String status = StringUtils.trim(competition.getStatus());
        if (StringUtils.isBlank(status))
        {
            status = resolveStatus(competition.getStartDate(), competition.getEndDate(), DateUtils.getNowDate());
        }
        else if (!isValidStatus(status))
        {
            throw new ServiceException("竞赛状态仅支持 upcoming、active、ended");
        }

        competition.setTitle(title);
        competition.setDescription(description);
        competition.setStatus(status);
        competition.setQuestionIds(questionIds);
        competition.setQuestions(orderedQuestions);
        competition.setQuestionCount(questionIds.size());
        competition.setTotalPoints(totalPoints);
    }

    private List<Long> normalizeQuestionIds(List<Long> sourceQuestionIds)
    {
        List<Long> questionIds = new ArrayList<>();
        if (sourceQuestionIds == null)
        {
            return questionIds;
        }

        for (Long questionId : sourceQuestionIds)
        {
            if (questionId != null && !questionIds.contains(questionId))
            {
                questionIds.add(questionId);
            }
        }
        return questionIds;
    }

    private boolean isValidStatus(String status)
    {
        return StringUtils.equalsAny(status, "upcoming", "active", "ended");
    }

    private String resolveStatus(Date startDate, Date endDate, Date now)
    {
        if (startDate.after(now))
        {
            return "upcoming";
        }
        if (endDate.before(now))
        {
            return "ended";
        }
        return "active";
    }
}
