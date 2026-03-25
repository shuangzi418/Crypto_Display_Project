package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.QuizBusinessUser;

public interface IQuizBusinessUserService
{
    List<QuizBusinessUser> selectBusinessUserList(QuizBusinessUser user);

    QuizBusinessUser selectBusinessUserById(Long id);

    List<QuizBusinessUser> selectPendingNicknames(QuizBusinessUser user);

    List<QuizBusinessUser> selectPendingAvatars(QuizBusinessUser user);

    int updateBusinessUserRole(QuizBusinessUser user);

    int reviewNickname(QuizBusinessUser user);

    int reviewAvatar(QuizBusinessUser user);
}
