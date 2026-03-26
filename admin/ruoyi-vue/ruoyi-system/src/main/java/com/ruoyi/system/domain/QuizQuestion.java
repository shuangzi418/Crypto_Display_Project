package com.ruoyi.system.domain;

import java.util.ArrayList;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import com.alibaba.fastjson2.JSON;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import com.ruoyi.common.utils.StringUtils;

/**
 * 竞赛题目对象 questions
 */
public class QuizQuestion extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long id;

    @Excel(name = "题目标题")
    @NotBlank(message = "题目标题不能为空")
    private String title;

    @Excel(name = "题目内容")
    @NotBlank(message = "题目内容不能为空")
    private String content;

    @JsonIgnore
    private String optionsJson;

    @NotEmpty(message = "题目选项不能为空")
    private List<String> options = new ArrayList<>();

    @Excel(name = "正确答案")
    @NotNull(message = "正确答案不能为空")
    private Integer correctAnswer;

    @Excel(name = "难度")
    @NotBlank(message = "题目难度不能为空")
    private String difficulty;

    @Excel(name = "题目分类")
    @NotBlank(message = "题目分类不能为空")
    private String category;

    @Excel(name = "分值")
    @NotNull(message = "题目分值不能为空")
    private Integer points;

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

    public String getContent()
    {
        return content;
    }

    public void setContent(String content)
    {
        this.content = content;
    }

    public String getOptionsJson()
    {
        if (StringUtils.isEmpty(optionsJson) && !options.isEmpty())
        {
            optionsJson = JSON.toJSONString(options);
        }
        return optionsJson;
    }

    public void setOptionsJson(String optionsJson)
    {
        this.optionsJson = optionsJson;
        if (StringUtils.isBlank(optionsJson))
        {
            this.options = new ArrayList<>();
        }
        else
        {
            try
            {
                this.options = JSON.parseArray(optionsJson, String.class);
                if (this.options == null)
                {
                    this.options = new ArrayList<>();
                }
            }
            catch (Exception ex)
            {
                this.options = new ArrayList<>();
            }
        }
    }

    public List<String> getOptions()
    {
        if ((options == null || options.isEmpty()) && StringUtils.isNotBlank(optionsJson))
        {
            try
            {
                options = JSON.parseArray(optionsJson, String.class);
                if (options == null)
                {
                    options = new ArrayList<>();
                }
            }
            catch (Exception ex)
            {
                options = new ArrayList<>();
            }
        }
        if (options == null)
        {
            options = new ArrayList<>();
        }
        return options;
    }

    public void setOptions(List<String> options)
    {
        this.options = options == null ? new ArrayList<>() : new ArrayList<>(options);
        this.optionsJson = JSON.toJSONString(this.options);
    }

    public Integer getCorrectAnswer()
    {
        return correctAnswer;
    }

    public void setCorrectAnswer(Integer correctAnswer)
    {
        this.correctAnswer = correctAnswer;
    }

    public String getDifficulty()
    {
        return difficulty;
    }

    public void setDifficulty(String difficulty)
    {
        this.difficulty = difficulty;
    }

    public String getCategory()
    {
        return category;
    }

    public void setCategory(String category)
    {
        this.category = category;
    }

    public Integer getPoints()
    {
        return points;
    }

    public void setPoints(Integer points)
    {
        this.points = points;
    }
}
