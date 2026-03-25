-- 密码知识竞赛管理平台菜单

delete from sys_role_menu where menu_id in (2000,2001,2002,2003,2004,2005,2100,2101,2102,2103,2104,2105,2106,2107,2108,2109,2110);
delete from sys_menu where menu_id in (2000,2001,2002,2003,2004,2005,2100,2101,2102,2103,2104,2105,2106,2107,2108,2109,2110);

insert into sys_menu values('2000', '竞赛运营', '0', '4', 'quiz', '', '', 'Quiz', 1, 0, 'M', '0', '0', '', 'education', 'admin', sysdate(), '', null, '密码知识竞赛业务目录');
insert into sys_menu values('2001', '题目管理', '2000', '1', 'question', 'quiz/question/index', '', 'QuizQuestion', 1, 0, 'C', '0', '0', 'quiz:question:list', 'question', 'admin', sysdate(), '', null, '题目管理菜单');
insert into sys_menu values('2002', '竞赛管理', '2000', '2', 'competition', 'quiz/competition/index', '', 'QuizCompetition', 1, 0, 'C', '0', '0', 'quiz:competition:list', 'date', 'admin', sysdate(), '', null, '竞赛管理菜单');
insert into sys_menu values('2003', '业务用户', '2000', '3', 'user', 'quiz/user/index', '', 'QuizUser', 1, 0, 'C', '0', '0', 'quiz:user:list', 'peoples', 'admin', sysdate(), '', null, '业务用户菜单');
insert into sys_menu values('2004', '昵称审核', '2000', '4', 'nickname-audit', 'quiz/audit/nickname', '', 'QuizNicknameAudit', 1, 0, 'C', '0', '0', 'quiz:user:audit', 'message', 'admin', sysdate(), '', null, '昵称审核菜单');
insert into sys_menu values('2005', '头像审核', '2000', '5', 'avatar-audit', 'quiz/audit/avatar', '', 'QuizAvatarAudit', 1, 0, 'C', '0', '0', 'quiz:user:audit', 'user', 'admin', sysdate(), '', null, '头像审核菜单');

insert into sys_menu values('2100', '题目查询', '2001', '1', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:question:query', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2101', '题目新增', '2001', '2', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:question:add', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2102', '题目修改', '2001', '3', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:question:edit', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2103', '题目删除', '2001', '4', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:question:remove', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2104', '竞赛查询', '2002', '1', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:competition:query', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2105', '竞赛新增', '2002', '2', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:competition:add', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2106', '竞赛修改', '2002', '3', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:competition:edit', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2107', '竞赛删除', '2002', '4', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:competition:remove', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2108', '业务用户查询', '2003', '1', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:user:query', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2109', '业务用户修改', '2003', '2', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:user:edit', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('2110', '资料审核处理', '2004', '1', '', '', '', '', 1, 0, 'F', '0', '0', 'quiz:user:audit', '#', 'admin', sysdate(), '', null, '');

insert into sys_role_menu values ('1', '2000');
insert into sys_role_menu values ('1', '2001');
insert into sys_role_menu values ('1', '2002');
insert into sys_role_menu values ('1', '2003');
insert into sys_role_menu values ('1', '2004');
insert into sys_role_menu values ('1', '2005');
insert into sys_role_menu values ('1', '2100');
insert into sys_role_menu values ('1', '2101');
insert into sys_role_menu values ('1', '2102');
insert into sys_role_menu values ('1', '2103');
insert into sys_role_menu values ('1', '2104');
insert into sys_role_menu values ('1', '2105');
insert into sys_role_menu values ('1', '2106');
insert into sys_role_menu values ('1', '2107');
insert into sys_role_menu values ('1', '2108');
insert into sys_role_menu values ('1', '2109');
insert into sys_role_menu values ('1', '2110');
