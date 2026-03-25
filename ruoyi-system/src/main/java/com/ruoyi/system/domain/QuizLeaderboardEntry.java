package com.ruoyi.system.domain;

import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 排行榜条目对象
 */
public class QuizLeaderboardEntry extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long rank;

    private Long userId;

    private String username;

    private String nickname;

    private String nicknameStatus;

    private String avatar;

    private String avatarStatus;

    private Integer score;

    private Boolean completed;

    private Long competitionId;

    private String competitionTitle;

    private String keyword;

    public Long getRank()
    {
        return rank;
    }

    public void setRank(Long rank)
    {
        this.rank = rank;
    }

    public Long getUserId()
    {
        return userId;
    }

    public void setUserId(Long userId)
    {
        this.userId = userId;
    }

    public String getUsername()
    {
        return username;
    }

    public void setUsername(String username)
    {
        this.username = username;
    }

    public String getNickname()
    {
        return nickname;
    }

    public void setNickname(String nickname)
    {
        this.nickname = nickname;
    }

    public String getNicknameStatus()
    {
        return nicknameStatus;
    }

    public void setNicknameStatus(String nicknameStatus)
    {
        this.nicknameStatus = nicknameStatus;
    }

    public String getAvatar()
    {
        return avatar;
    }

    public void setAvatar(String avatar)
    {
        this.avatar = avatar;
    }

    public String getAvatarStatus()
    {
        return avatarStatus;
    }

    public void setAvatarStatus(String avatarStatus)
    {
        this.avatarStatus = avatarStatus;
    }

    public Integer getScore()
    {
        return score;
    }

    public void setScore(Integer score)
    {
        this.score = score;
    }

    public Boolean getCompleted()
    {
        return completed;
    }

    public void setCompleted(Boolean completed)
    {
        this.completed = completed;
    }

    public Long getCompetitionId()
    {
        return competitionId;
    }

    public void setCompetitionId(Long competitionId)
    {
        this.competitionId = competitionId;
    }

    public String getCompetitionTitle()
    {
        return competitionTitle;
    }

    public void setCompetitionTitle(String competitionTitle)
    {
        this.competitionTitle = competitionTitle;
    }

    public String getKeyword()
    {
        return keyword;
    }

    public void setKeyword(String keyword)
    {
        this.keyword = keyword;
    }
}
