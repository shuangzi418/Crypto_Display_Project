package com.ruoyi.system.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import com.ruoyi.system.domain.QuizBusinessUser;

public interface QuizBusinessUserMapper
{
    List<QuizBusinessUser> selectBusinessUserList(QuizBusinessUser user);

    QuizBusinessUser selectBusinessUserById(Long id);

    List<QuizBusinessUser> selectPendingNicknames(QuizBusinessUser user);

    List<QuizBusinessUser> selectPendingAvatars(QuizBusinessUser user);

    int updateBusinessUserRole(QuizBusinessUser user);

    int updateNicknameStatus(QuizBusinessUser user);

    int updateAvatarStatus(QuizBusinessUser user);

    int insertReviewMessage(@Param("userId") Long userId, @Param("title") String title,
            @Param("content") String content, @Param("type") String type);
}
