package com.ruoyi.web.controller.quiz;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.QuizBusinessUser;
import com.ruoyi.system.service.IQuizBusinessUserService;

@RestController
@RequestMapping("/quiz/user")
public class QuizBusinessUserController extends BaseController
{
    @Autowired
    private IQuizBusinessUserService quizBusinessUserService;

    @PreAuthorize("@ss.hasPermi('quiz:user:list')")
    @GetMapping("/list")
    public TableDataInfo list(QuizBusinessUser user)
    {
        startPage();
        List<QuizBusinessUser> list = quizBusinessUserService.selectBusinessUserList(user);
        return getDataTable(list);
    }

    @PreAuthorize("@ss.hasPermi('quiz:user:query')")
    @GetMapping("/{id}")
    public AjaxResult getInfo(@PathVariable Long id)
    {
        return success(quizBusinessUserService.selectBusinessUserById(id));
    }

    @PreAuthorize("@ss.hasPermi('quiz:user:edit')")
    @Log(title = "业务用户管理", businessType = BusinessType.UPDATE)
    @PutMapping("/changeRole")
    public AjaxResult changeRole(@RequestBody QuizBusinessUser user)
    {
        user.setUpdateBy(getUsername());
        return toAjax(quizBusinessUserService.updateBusinessUserRole(user));
    }

    @PreAuthorize("@ss.hasPermi('quiz:user:audit')")
    @GetMapping("/nickname/pending")
    public TableDataInfo pendingNicknames(QuizBusinessUser user)
    {
        startPage();
        List<QuizBusinessUser> list = quizBusinessUserService.selectPendingNicknames(user);
        return getDataTable(list);
    }

    @PreAuthorize("@ss.hasPermi('quiz:user:audit')")
    @Log(title = "昵称审核", businessType = BusinessType.UPDATE)
    @PutMapping("/nickname/review")
    public AjaxResult reviewNickname(@RequestBody QuizBusinessUser user)
    {
        user.setUpdateBy(getUsername());
        return toAjax(quizBusinessUserService.reviewNickname(user));
    }

    @PreAuthorize("@ss.hasPermi('quiz:user:audit')")
    @GetMapping("/avatar/pending")
    public TableDataInfo pendingAvatars(QuizBusinessUser user)
    {
        startPage();
        List<QuizBusinessUser> list = quizBusinessUserService.selectPendingAvatars(user);
        return getDataTable(list);
    }

    @PreAuthorize("@ss.hasPermi('quiz:user:audit')")
    @Log(title = "头像审核", businessType = BusinessType.UPDATE)
    @PutMapping("/avatar/review")
    public AjaxResult reviewAvatar(@RequestBody QuizBusinessUser user)
    {
        user.setUpdateBy(getUsername());
        return toAjax(quizBusinessUserService.reviewAvatar(user));
    }
}
