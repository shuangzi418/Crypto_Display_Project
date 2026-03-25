-- 密码知识竞赛管理平台角色分级方案

delete from sys_role_menu where role_id in (200,201,202,203);
delete from sys_role where role_id in (200,201,202,203);

insert into sys_role values('200', '竞赛平台管理员', 'platform_super_admin', 10, 1, 1, 1, '0', '0', 'admin', sysdate(), '', null, '拥有竞赛业务全量权限');
insert into sys_role values('201', '题库管理员', 'question_admin', 11, 1, 1, 1, '0', '0', 'admin', sysdate(), '', null, '负责题库维护与题目管理');
insert into sys_role values('202', '竞赛管理员', 'competition_admin', 12, 1, 1, 1, '0', '0', 'admin', sysdate(), '', null, '负责竞赛创建、调整与状态同步');
insert into sys_role values('203', '审核管理员', 'audit_admin', 13, 1, 1, 1, '0', '0', 'admin', sysdate(), '', null, '负责业务用户查看与昵称头像审核');

-- 竞赛平台管理员：全部业务菜单
insert into sys_role_menu values ('200', '2000');
insert into sys_role_menu values ('200', '2001');
insert into sys_role_menu values ('200', '2002');
insert into sys_role_menu values ('200', '2003');
insert into sys_role_menu values ('200', '2004');
insert into sys_role_menu values ('200', '2005');
insert into sys_role_menu values ('200', '2006');
insert into sys_role_menu values ('200', '2007');
insert into sys_role_menu values ('200', '2100');
insert into sys_role_menu values ('200', '2101');
insert into sys_role_menu values ('200', '2102');
insert into sys_role_menu values ('200', '2103');
insert into sys_role_menu values ('200', '2111');
insert into sys_role_menu values ('200', '2104');
insert into sys_role_menu values ('200', '2105');
insert into sys_role_menu values ('200', '2106');
insert into sys_role_menu values ('200', '2107');
insert into sys_role_menu values ('200', '2108');
insert into sys_role_menu values ('200', '2109');
insert into sys_role_menu values ('200', '2110');
insert into sys_role_menu values ('200', '2112');

-- 题库管理员：题库相关
insert into sys_role_menu values ('201', '2000');
insert into sys_role_menu values ('201', '2001');
insert into sys_role_menu values ('201', '2007');
insert into sys_role_menu values ('201', '2100');
insert into sys_role_menu values ('201', '2101');
insert into sys_role_menu values ('201', '2102');
insert into sys_role_menu values ('201', '2103');
insert into sys_role_menu values ('201', '2111');

-- 竞赛管理员：竞赛相关
insert into sys_role_menu values ('202', '2000');
insert into sys_role_menu values ('202', '2002');
insert into sys_role_menu values ('202', '2006');
insert into sys_role_menu values ('202', '2007');
insert into sys_role_menu values ('202', '2104');
insert into sys_role_menu values ('202', '2105');
insert into sys_role_menu values ('202', '2106');
insert into sys_role_menu values ('202', '2107');
insert into sys_role_menu values ('202', '2112');

-- 审核管理员：业务用户查看 + 昵称头像审核
insert into sys_role_menu values ('203', '2000');
insert into sys_role_menu values ('203', '2003');
insert into sys_role_menu values ('203', '2004');
insert into sys_role_menu values ('203', '2005');
insert into sys_role_menu values ('203', '2007');
insert into sys_role_menu values ('203', '2108');
insert into sys_role_menu values ('203', '2110');

-- 建议在 RuoYi 用户管理页面中为具体管理员账号分配以上角色；
-- 如需直接绑定，可按实际 user_id 执行：
-- insert into sys_user_role values (<user_id>, 200);
