package com.cryptoquiz.framework.web.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.cryptoquiz.common.constant.CacheConstants;
import com.cryptoquiz.common.constant.Constants;
import com.cryptoquiz.common.constant.UserConstants;
import com.cryptoquiz.common.core.domain.entity.SysUser;
import com.cryptoquiz.common.core.domain.model.RegisterBody;
import com.cryptoquiz.common.core.redis.RedisCache;
import com.cryptoquiz.common.exception.user.CaptchaException;
import com.cryptoquiz.common.exception.user.CaptchaExpireException;
import com.cryptoquiz.common.utils.DateUtils;
import com.cryptoquiz.common.utils.MessageUtils;
import com.cryptoquiz.common.utils.PasswordPolicyUtils;
import com.cryptoquiz.common.utils.SecurityUtils;
import com.cryptoquiz.common.utils.StringUtils;
import com.cryptoquiz.framework.manager.AsyncManager;
import com.cryptoquiz.framework.manager.factory.AsyncFactory;
import com.cryptoquiz.system.service.ISysConfigService;
import com.cryptoquiz.system.service.ISysUserService;

/**
 * 注册校验方法
 * 
 * @author ruoyi
 */
@Component
public class SysRegisterService
{
    @Autowired
    private ISysUserService userService;

    @Autowired
    private ISysConfigService configService;

    @Autowired
    private RedisCache redisCache;

    /**
     * 注册
     */
    public String register(RegisterBody registerBody)
    {
        String msg = "", username = registerBody.getUsername(), password = registerBody.getPassword();
        SysUser sysUser = new SysUser();
        sysUser.setUserName(username);

        // 验证码开关
        boolean captchaEnabled = configService.selectCaptchaEnabled();
        if (captchaEnabled)
        {
            validateCaptcha(username, registerBody.getCode(), registerBody.getUuid());
        }

        if (StringUtils.isEmpty(username))
        {
            msg = "用户名不能为空";
        }
        else if (StringUtils.isEmpty(password))
        {
            msg = "用户密码不能为空";
        }
        else if (username.length() < UserConstants.USERNAME_MIN_LENGTH
                || username.length() > UserConstants.USERNAME_MAX_LENGTH)
        {
            msg = "账户长度必须在2到20个字符之间";
        }
        else if (password.length() < UserConstants.PASSWORD_MIN_LENGTH
                || password.length() > UserConstants.PASSWORD_MAX_LENGTH)
        {
            msg = "密码长度必须在5到20个字符之间";
        }
        else
        {
            try
            {
                PasswordPolicyUtils.validatePassword(username, password);
            }
            catch (Exception ex)
            {
                msg = ex.getMessage();
            }
        }
        if (StringUtils.isEmpty(msg) && !userService.checkUserNameUnique(sysUser))
        {
            msg = "保存用户'" + username + "'失败，注册账号已存在";
        }
        else if (StringUtils.isEmpty(msg))
        {
            sysUser.setNickName(username);
            sysUser.setPwdUpdateDate(DateUtils.getNowDate());
            sysUser.setPassword(SecurityUtils.encryptPassword(password));
            boolean regFlag = userService.registerUser(sysUser);
            if (!regFlag)
            {
                msg = "注册失败,请联系系统管理人员";
            }
            else
            {
                AsyncManager.me().execute(AsyncFactory.recordLogininfor(username, Constants.REGISTER, MessageUtils.message("user.register.success")));
            }
        }
        return msg;
    }

    /**
     * 校验验证码
     * 
     * @param username 用户名
     * @param code 验证码
     * @param uuid 唯一标识
     * @return 结果
     */
    public void validateCaptcha(String username, String code, String uuid)
    {
        String verifyKey = CacheConstants.CAPTCHA_CODE_KEY + StringUtils.nvl(uuid, "");
        String captcha = redisCache.getCacheObject(verifyKey);
        redisCache.deleteObject(verifyKey);
        if (captcha == null)
        {
            throw new CaptchaExpireException();
        }
        if (!code.equalsIgnoreCase(captcha))
        {
            throw new CaptchaException();
        }
    }
}
