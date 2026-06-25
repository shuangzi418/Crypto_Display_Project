SET NAMES utf8mb4;

-- 清理 RuoYi 默认品牌残留与无关菜单

delete from sys_notice_read;
delete from sys_notice;

delete from sys_role_menu where menu_id in (
    4,
    1004, 1005, 1006, 1011,
    2, 3, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 500, 501,
    1016, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029,
    1030, 1031, 1032, 1033, 1034, 1035, 1036, 1037, 1038, 1039, 1040, 1041, 1042, 1043,
    1044, 1045, 1046, 1047, 1048, 1049, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057,
    1058, 1059, 1060
);

delete from sys_menu where menu_id in (
    4,
    1004, 1005, 1006, 1011,
    2, 3, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 500, 501,
    1016, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029,
    1030, 1031, 1032, 1033, 1034, 1035, 1036, 1037, 1038, 1039, 1040, 1041, 1042, 1043,
    1044, 1045, 1046, 1047, 1048, 1049, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057,
    1058, 1059, 1060
);

update sys_menu set menu_name = '权限管理' where menu_id = 1;
update sys_menu set menu_name = '管理员账号' where menu_id = 100;
update sys_menu set menu_name = '权限角色' where menu_id = 101;
update sys_menu set menu_name = '菜单权限' where menu_id = 102;

update sys_role set role_name = '超级管理员' where role_id = 1;
update sys_role set role_name = '普通角色' where role_id = 2;
update sys_role set role_name = '竞赛平台管理员' where role_key = 'platform_super_admin';
update sys_role set role_name = '题库管理员' where role_key = 'question_admin';
update sys_role set role_name = '竞赛管理员' where role_key = 'competition_admin';
update sys_role set role_name = '审核管理员' where role_key = 'audit_admin';

update sys_dict_type set dict_name = '菜单状态' where dict_type = 'sys_show_hide';
update sys_dict_type set dict_name = '系统开关' where dict_type = 'sys_normal_disable';
update sys_dict_data set dict_label = '显示' where dict_type = 'sys_show_hide' and dict_value = '0';
update sys_dict_data set dict_label = '隐藏' where dict_type = 'sys_show_hide' and dict_value = '1';
update sys_dict_data set dict_label = '正常' where dict_type = 'sys_normal_disable' and dict_value = '0';
update sys_dict_data set dict_label = '停用' where dict_type = 'sys_normal_disable' and dict_value = '1';

update sys_config set config_value = 'true' where config_key = 'sys.account.captchaEnabled';

update sys_user set nick_name = '平台管理员' where user_name = 'admin';
update sys_user set nick_name = '演示账号' where user_name = 'ry';
