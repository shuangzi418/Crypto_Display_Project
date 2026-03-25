package com.ruoyi.web.controller.quiz;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.PageDomain;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.core.page.TableSupport;
import com.ruoyi.system.domain.QuizLeaderboardEntry;
import com.ruoyi.system.service.IQuizLeaderboardService;

@RestController
@RequestMapping("/quiz/leaderboard")
public class QuizLeaderboardController extends BaseController
{
    @Autowired
    private IQuizLeaderboardService leaderboardService;

    @PreAuthorize("@ss.hasPermi('quiz:leaderboard:list')")
    @GetMapping("/overall/list")
    public TableDataInfo overallList(QuizLeaderboardEntry query)
    {
        startPage();
        List<QuizLeaderboardEntry> list = leaderboardService.selectOverallLeaderboardList(query);
        fillRank(list);
        return getDataTable(list);
    }

    @PreAuthorize("@ss.hasPermi('quiz:leaderboard:list')")
    @GetMapping("/competition/list")
    public TableDataInfo competitionList(QuizLeaderboardEntry query)
    {
        startPage();
        List<QuizLeaderboardEntry> list = leaderboardService.selectCompetitionLeaderboardList(query);
        fillRank(list);
        return getDataTable(list);
    }

    @PreAuthorize("@ss.hasPermi('quiz:leaderboard:list')")
    @GetMapping("/competition/options")
    public AjaxResult competitionOptions()
    {
        return success(leaderboardService.selectCompetitionOptions());
    }

    private void fillRank(List<QuizLeaderboardEntry> list)
    {
        PageDomain pageDomain = TableSupport.buildPageRequest();
        int pageNum = pageDomain.getPageNum() == null || pageDomain.getPageNum() <= 0 ? 1 : pageDomain.getPageNum();
        int pageSize = pageDomain.getPageSize() == null || pageDomain.getPageSize() <= 0 ? list.size() : pageDomain.getPageSize();
        long startRank = (long) (pageNum - 1) * pageSize;

        for (int index = 0; index < list.size(); index++)
        {
            list.get(index).setRank(startRank + index + 1);
        }
    }
}
