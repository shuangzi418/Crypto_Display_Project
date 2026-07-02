package com.cryptoquiz.web.controller.quiz;

import java.util.List;
import jakarta.servlet.http.HttpServletResponse;
import java.io.File;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;
import com.cryptoquiz.common.annotation.Log;
import com.cryptoquiz.common.core.controller.BaseController;
import com.cryptoquiz.common.core.domain.AjaxResult;
import com.cryptoquiz.common.core.page.TableDataInfo;
import com.cryptoquiz.common.enums.BusinessType;
import com.cryptoquiz.common.utils.file.FileUtils;
import com.cryptoquiz.system.domain.QuizQuestion;
import com.cryptoquiz.system.domain.QuizQuestionImportRow;
import com.cryptoquiz.common.utils.poi.ExcelUtil;
import com.cryptoquiz.system.service.IQuizQuestionService;

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

    @PreAuthorize("@ss.hasPermi('quiz:question:import')")
    @Log(title = "题目管理", businessType = BusinessType.IMPORT)
    @PostMapping("/importData")
    public AjaxResult importData(MultipartFile file) throws Exception
    {
        ExcelUtil<QuizQuestionImportRow> util = new ExcelUtil<QuizQuestionImportRow>(QuizQuestionImportRow.class);
        List<QuizQuestionImportRow> importRows = util.importExcel(file.getInputStream());
        String message = quizQuestionService.importQuestion(importRows, getUsername());
        return success(message);
    }

    @PreAuthorize("@ss.hasPermi('quiz:question:import')")
    @PostMapping("/importTemplate")
    public void importTemplate(HttpServletResponse response)
    {
        try
        {
            File templateFile = new File("/usr/share/nginx/html/templates/question-import-template.xlsx");
            if (templateFile.exists())
            {
                response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
                FileUtils.setAttachmentResponseHeader(response, "question-import-template.xlsx");
                FileUtils.writeBytes(templateFile.getAbsolutePath(), response.getOutputStream());
                return;
            }
        }
        catch (Exception ignored)
        {
        }

        ExcelUtil<QuizQuestionImportRow> util = new ExcelUtil<QuizQuestionImportRow>(QuizQuestionImportRow.class);
        util.importTemplateExcel(response, "赛题导入模板");
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
