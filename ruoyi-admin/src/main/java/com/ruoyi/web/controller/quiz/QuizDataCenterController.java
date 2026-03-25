package com.ruoyi.web.controller.quiz;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.service.IQuizDataCenterService;

@RestController
@RequestMapping("/quiz/data")
public class QuizDataCenterController extends BaseController
{
    @Autowired
    private IQuizDataCenterService dataCenterService;

    @PreAuthorize("@ss.hasPermi('quiz:data:view')")
    @GetMapping("/overview")
    public AjaxResult overview()
    {
        return success(dataCenterService.selectOverview());
    }
}
