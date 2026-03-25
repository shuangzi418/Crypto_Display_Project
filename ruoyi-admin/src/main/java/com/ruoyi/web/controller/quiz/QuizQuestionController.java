package com.ruoyi.web.controller.quiz;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.QuizQuestion;
import com.ruoyi.system.service.IQuizQuestionService;

@RestController
@RequestMapping("/quiz/question")
public class QuizQuestionController extends BaseController
{
    @Autowired
    private IQuizQuestionService quizQuestionService;

    @PreAuthorize("@ss.hasPermi('quiz:question:list')")
    @GetMapping("/list")
    public TableDataInfo list(QuizQuestion question)
    {
        startPage();
        List<QuizQuestion> list = quizQuestionService.selectQuestionList(question);
        return getDataTable(list);
    }

    @PreAuthorize("@ss.hasPermi('quiz:question:list')")
    @GetMapping("/optionselect")
    public AjaxResult optionselect()
    {
        return success(quizQuestionService.selectQuestionOptionList());
    }

    @PreAuthorize("@ss.hasPermi('quiz:question:query')")
    @GetMapping("/{id}")
    public AjaxResult getInfo(@PathVariable Long id)
    {
        return success(quizQuestionService.selectQuestionById(id));
    }

    @PreAuthorize("@ss.hasPermi('quiz:question:add')")
    @Log(title = "题目管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody QuizQuestion question)
    {
        question.setCreateBy(getUsername());
        return toAjax(quizQuestionService.insertQuestion(question));
    }

    @PreAuthorize("@ss.hasPermi('quiz:question:edit')")
    @Log(title = "题目管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody QuizQuestion question)
    {
        question.setUpdateBy(getUsername());
        return toAjax(quizQuestionService.updateQuestion(question));
    }

    @PreAuthorize("@ss.hasPermi('quiz:question:remove')")
    @Log(title = "题目管理", businessType = BusinessType.DELETE)
    @DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(quizQuestionService.deleteQuestionByIds(ids));
    }
}
