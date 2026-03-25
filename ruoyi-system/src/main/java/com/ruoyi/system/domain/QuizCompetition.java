package com.ruoyi.system.domain;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 竞赛对象 competitions
 */
public class QuizCompetition extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long id;

    @Excel(name = "竞赛标题")
    @NotBlank(message = "竞赛标题不能为空")
    private String title;

    @Excel(name = "竞赛描述")
    @NotBlank(message = "竞赛描述不能为空")
    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @NotNull(message = "开始时间不能为空")
    private Date startDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @NotNull(message = "结束时间不能为空")
    private Date endDate;

    @Excel(name = "状态")
    private String status;

    @Excel(name = "总分")
    private Integer totalPoints;

    private Integer questionCount;

    private String questionTitles;

    private List<Long> questionIds = new ArrayList<>();

    private List<QuizQuestion> questions = new ArrayList<>();

    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public String getTitle()
    {
        return title;
    }

    public void setTitle(String title)
    {
        this.title = title;
    }

    public String getDescription()
    {
        return description;
    }

    public void setDescription(String description)
    {
        this.description = description;
    }

    public Date getStartDate()
    {
        return startDate;
    }

    public void setStartDate(Date startDate)
    {
        this.startDate = startDate;
    }

    public Date getEndDate()
    {
        return endDate;
    }

    public void setEndDate(Date endDate)
    {
        this.endDate = endDate;
    }

    public String getStatus()
    {
        return status;
    }

    public void setStatus(String status)
    {
        this.status = status;
    }

    public Integer getTotalPoints()
    {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints)
    {
        this.totalPoints = totalPoints;
    }

    public Integer getQuestionCount()
    {
        return questionCount;
    }

    public void setQuestionCount(Integer questionCount)
    {
        this.questionCount = questionCount;
    }

    public String getQuestionTitles()
    {
        return questionTitles;
    }

    public void setQuestionTitles(String questionTitles)
    {
        this.questionTitles = questionTitles;
    }

    public List<Long> getQuestionIds()
    {
        return questionIds;
    }

    public void setQuestionIds(List<Long> questionIds)
    {
        this.questionIds = questionIds == null ? new ArrayList<>() : new ArrayList<>(questionIds);
    }

    public List<QuizQuestion> getQuestions()
    {
        return questions;
    }

    public void setQuestions(List<QuizQuestion> questions)
    {
        this.questions = questions == null ? new ArrayList<>() : questions;
    }
}
