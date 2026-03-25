-- 清理 RuoYi 默认品牌残留

delete from sys_role_menu where menu_id = 4;
delete from sys_menu where menu_id = 4;

update sys_user set nick_name = '平台管理员' where user_name = 'admin';
update sys_user set nick_name = '演示账号' where user_name = 'ry';
