package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.domain.QuizBusinessUser;
import com.ruoyi.system.mapper.QuizBusinessUserMapper;
import com.ruoyi.system.service.IQuizBusinessUserService;

@Service
public class QuizBusinessUserServiceImpl implements IQuizBusinessUserService
{
    @Autowired
    private QuizBusinessUserMapper businessUserMapper;

    @Override
    public List<QuizBusinessUser> selectBusinessUserList(QuizBusinessUser user)
    {
        return businessUserMapper.selectBusinessUserList(user);
    }

    @Override
    public QuizBusinessUser selectBusinessUserById(Long id)
    {
        return businessUserMapper.selectBusinessUserById(id);
    }

    @Override
    public List<QuizBusinessUser> selectPendingNicknames(QuizBusinessUser user)
    {
        return businessUserMapper.selectPendingNicknames(user);
    }

    @Override
    public List<QuizBusinessUser> selectPendingAvatars(QuizBusinessUser user)
    {
        return businessUserMapper.selectPendingAvatars(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateBusinessUserRole(QuizBusinessUser user)
    {
        QuizBusinessUser dbUser = requireBusinessUser(user.getId());
        String role = StringUtils.trim(user.getRole());
        if (!StringUtils.equalsAny(role, "user", "admin"))
        {
            throw new ServiceException("业务用户角色仅支持 user、admin");
        }
        dbUser.setRole(role);
        return businessUserMapper.updateBusinessUserRole(dbUser);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int reviewNickname(QuizBusinessUser user)
    {
        requireBusinessUser(user.getId());
        String status = normalizeAuditStatus(user.getNicknameStatus());
        user.setNicknameStatus(status);
        int rows = businessUserMapper.updateNicknameStatus(user);
        if (rows > 0)
        {
            insertAuditMessage(user.getId(),
                    StringUtils.equals(status, "approved") ? "昵称审核通过" : "昵称审核拒绝",
                    StringUtils.equals(status, "approved") ? "您的排行榜昵称已通过审核。" : "您的排行榜昵称未通过审核，请重新提交。");
        }
        return rows;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int reviewAvatar(QuizBusinessUser user)
    {
        requireBusinessUser(user.getId());
        String status = normalizeAuditStatus(user.getAvatarStatus());
        user.setAvatarStatus(status);
        int rows = businessUserMapper.updateAvatarStatus(user);
        if (rows > 0)
        {
            insertAuditMessage(user.getId(),
                    StringUtils.equals(status, "approved") ? "头像审核通过" : "头像审核拒绝",
                    StringUtils.equals(status, "approved") ? "您的头像已通过审核。" : "您的头像未通过审核，请重新上传。");
        }
        return rows;
    }

    private QuizBusinessUser requireBusinessUser(Long id)
    {
        QuizBusinessUser user = businessUserMapper.selectBusinessUserById(id);
        if (user == null)
        {
            throw new ServiceException("业务用户不存在");
        }
        return user;
    }

    private String normalizeAuditStatus(String status)
    {
        String normalizedStatus = StringUtils.trim(status);
        if (!StringUtils.equalsAny(normalizedStatus, "approved", "rejected"))
        {
            throw new ServiceException("审核状态仅支持 approved、rejected");
        }
        return normalizedStatus;
    }

    private void insertAuditMessage(Long userId, String title, String content)
    {
        businessUserMapper.insertReviewMessage(userId, title, content, "notification");
    }
}
