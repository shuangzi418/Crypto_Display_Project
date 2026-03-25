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
import com.ruoyi.system.domain.QuizCompetition;
import com.ruoyi.system.service.IQuizCompetitionService;

@RestController
@RequestMapping("/quiz/competition")
public class QuizCompetitionController extends BaseController
{
    @Autowired
    private IQuizCompetitionService quizCompetitionService;

    @PreAuthorize("@ss.hasPermi('quiz:competition:list')")
    @GetMapping("/list")
    public TableDataInfo list(QuizCompetition competition)
    {
        startPage();
        List<QuizCompetition> list = quizCompetitionService.selectCompetitionList(competition);
        return getDataTable(list);
    }

    @PreAuthorize("@ss.hasPermi('quiz:competition:query')")
    @GetMapping("/{id}")
    public AjaxResult getInfo(@PathVariable Long id)
    {
        return success(quizCompetitionService.selectCompetitionById(id));
    }

    @PreAuthorize("@ss.hasPermi('quiz:competition:add')")
    @Log(title = "竞赛管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody QuizCompetition competition)
    {
        competition.setCreateBy(getUsername());
        return toAjax(quizCompetitionService.insertCompetition(competition));
    }

    @PreAuthorize("@ss.hasPermi('quiz:competition:edit')")
    @Log(title = "竞赛管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody QuizCompetition competition)
    {
        competition.setUpdateBy(getUsername());
        return toAjax(quizCompetitionService.updateCompetition(competition));
    }

    @PreAuthorize("@ss.hasPermi('quiz:competition:remove')")
    @Log(title = "竞赛管理", businessType = BusinessType.DELETE)
    @DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(quizCompetitionService.deleteCompetitionByIds(ids));
    }

    @PreAuthorize("@ss.hasPermi('quiz:competition:edit')")
    @Log(title = "竞赛管理", businessType = BusinessType.UPDATE)
    @PutMapping("/syncStatus")
    public AjaxResult syncStatus()
    {
        return AjaxResult.success("竞赛状态同步完成", quizCompetitionService.syncCompetitionStatus());
    }
}
