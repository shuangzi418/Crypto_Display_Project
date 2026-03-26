package com.ruoyi.common.utils;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import com.ruoyi.common.exception.ServiceException;

/**
 * 密码策略工具
 */
public class PasswordPolicyUtils
{
    private static final int MIN_LENGTH = 8;

    private static final int MAX_LENGTH = 20;

    private static final Set<String> COMMON_WEAK_PASSWORDS = new HashSet<String>(Arrays.asList(
            "12345678", "123456789", "1234567890", "password", "password123", "admin123", "admin123456",
            "qwerty123", "11111111", "00000000", "abc12345"));

    private PasswordPolicyUtils()
    {
    }

    public static void validatePassword(String username, String password)
    {
        if (StringUtils.isBlank(password))
        {
            throw new ServiceException("密码不能为空");
        }

        if (password.length() < MIN_LENGTH || password.length() > MAX_LENGTH)
        {
            throw new ServiceException("密码长度必须在 8 到 20 个字符之间");
        }

        if (containsIllegalChar(password))
        {
            throw new ServiceException("密码不能包含非法字符：< > \" ' \\ |");
        }

        if (COMMON_WEAK_PASSWORDS.contains(password.toLowerCase(Locale.ROOT)))
        {
            throw new ServiceException("密码过于简单，请使用更强的密码组合");
        }

        if (StringUtils.isNotBlank(username) && password.toLowerCase(Locale.ROOT).contains(username.toLowerCase(Locale.ROOT)))
        {
            throw new ServiceException("密码不能包含账号名");
        }

        int typeCount = 0;
        if (password.matches(".*[A-Z].*"))
        {
            typeCount++;
        }
        if (password.matches(".*[a-z].*"))
        {
            typeCount++;
        }
        if (password.matches(".*\\d.*"))
        {
            typeCount++;
        }
        if (password.matches(".*[^A-Za-z0-9].*"))
        {
            typeCount++;
        }

        if (typeCount < 3)
        {
            throw new ServiceException("密码必须至少包含大写字母、小写字母、数字、特殊字符中的三种");
        }
    }

    public static String getPasswordRuleTip()
    {
        return "密码需为 8-20 位，至少包含大写字母、小写字母、数字、特殊字符中的三种，且不能包含账号名或常见弱密码";
    }

    private static boolean containsIllegalChar(String password)
    {
        return password.contains("<") || password.contains(">") || password.contains("\"") || password.contains("'")
                || password.contains("\\") || password.contains("|");
    }
}
