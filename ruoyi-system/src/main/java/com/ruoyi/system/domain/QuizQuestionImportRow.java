package com.ruoyi.system.domain;

import com.ruoyi.common.annotation.Excel;

/**
 * 赛题 Excel 导入行对象
 */
public class QuizQuestionImportRow
{
    @Excel(name = "题目标题", prompt = "必填；建议简洁描述题目主题", type = Excel.Type.IMPORT)
    private String title;

    @Excel(name = "题目内容", prompt = "必填；填写完整题干", type = Excel.Type.IMPORT)
    private String content;

    @Excel(name = "选项A", prompt = "至少填写两个选项", type = Excel.Type.IMPORT)
    private String optionA;

    @Excel(name = "选项B", type = Excel.Type.IMPORT)
    private String optionB;

    @Excel(name = "选项C", type = Excel.Type.IMPORT)
    private String optionC;

    @Excel(name = "选项D", type = Excel.Type.IMPORT)
    private String optionD;

    @Excel(name = "选项E", type = Excel.Type.IMPORT)
    private String optionE;

    @Excel(name = "选项F", type = Excel.Type.IMPORT)
    private String optionF;

    @Excel(name = "正确答案", prompt = "支持填写 A/B/C/D/E/F、1/2/3(第几个选项) 或 0/1/2(选项索引)", type = Excel.Type.IMPORT)
    private String correctAnswer;

    @Excel(name = "题目难度", combo = { "简单", "中等", "困难", "easy", "medium", "hard" }, prompt = "支持中文或 easy/medium/hard", type = Excel.Type.IMPORT)
    private String difficulty;

    @Excel(name = "题目分类", prompt = "必填；例如 古典密码、哈希算法、公钥密码", type = Excel.Type.IMPORT)
    private String category;

    @Excel(name = "分值", prompt = "必填；填写正整数", type = Excel.Type.IMPORT)
    private String points;

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

    public String getOptionA()
    {
        return optionA;
    }

    public void setOptionA(String optionA)
    {
        this.optionA = optionA;
    }

    public String getOptionB()
    {
        return optionB;
    }

    public void setOptionB(String optionB)
    {
        this.optionB = optionB;
    }

    public String getOptionC()
    {
        return optionC;
    }

    public void setOptionC(String optionC)
    {
        this.optionC = optionC;
    }

    public String getOptionD()
    {
        return optionD;
    }

    public void setOptionD(String optionD)
    {
        this.optionD = optionD;
    }

    public String getOptionE()
    {
        return optionE;
    }

    public void setOptionE(String optionE)
    {
        this.optionE = optionE;
    }

    public String getOptionF()
    {
        return optionF;
    }

    public void setOptionF(String optionF)
    {
        this.optionF = optionF;
    }

    public String getCorrectAnswer()
    {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer)
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

    public String getPoints()
    {
        return points;
    }

    public void setPoints(String points)
    {
        this.points = points;
    }
}
