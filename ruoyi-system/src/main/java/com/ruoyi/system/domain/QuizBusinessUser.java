package com.ruoyi.system.domain;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 业务用户对象 users
 */
public class QuizBusinessUser extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long id;

    @Excel(name = "用户名")
    private String username;

    @Excel(name = "昵称")
    private String nickname;

    private String avatar;

    @Excel(name = "头像审核状态")
    private String avatarStatus;

    @Excel(name = "昵称审核状态")
    private String nicknameStatus;

    @Excel(name = "邮箱")
    private String email;

    @Excel(name = "积分")
    private Integer score;

    @Excel(name = "角色")
    private String role;

    private String keyword;

    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
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

    public String getNicknameStatus()
    {
        return nicknameStatus;
    }

    public void setNicknameStatus(String nicknameStatus)
    {
        this.nicknameStatus = nicknameStatus;
    }

    public String getEmail()
    {
        return email;
    }

    public void setEmail(String email)
    {
        this.email = email;
    }

    public Integer getScore()
    {
        return score;
    }

    public void setScore(Integer score)
    {
        this.score = score;
    }

    public String getRole()
    {
        return role;
    }

    public void setRole(String role)
    {
        this.role = role;
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
