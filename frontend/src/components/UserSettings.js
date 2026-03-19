import React, { useState, useEffect } from 'react';
import api from '../axios';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../actions/userActions';
import { Tabs, Input } from 'antd';

const getErrorMessage = (error, fallbackMessage) => {
  if (error && error.response && error.response.data) {
    if (error.response.data.message) {
      return error.response.data.message;
    }

    if (Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
      return error.response.data.errors[0].msg || fallbackMessage;
    }
  }

  return fallbackMessage;
};

const UserSettings = () => {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const dispatch = useDispatch();
  const { user: reduxUser, isAuthenticated, loading: reduxLoading } = useSelector(state => state.user);

  useEffect(() => {
    // 确保用户已登录
    if (!isAuthenticated || !reduxUser) {
      dispatch(loadUser());
    } else {
      setNickname(reduxUser.nickname || '');
      setAvatar(reduxUser.avatar || '');
      setUsername(reduxUser.username || '');
      setEmail(reduxUser.email || '');
      setLoading(false);
    }
  }, [dispatch, isAuthenticated, reduxUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('请选择图片文件');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setMessage('头像文件不能超过 2MB');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!username.trim()) {
        setMessage('用户名不能为空');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      if (!email.trim()) {
        setMessage('邮箱不能为空');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // 更新设置（头像和昵称）
      const settingsPayload = { avatar };
      if (reduxUser.role !== 'admin') {
        settingsPayload.nickname = nickname.trim();
      }
      await api.put('/users/settings', settingsPayload);
      
      // 更新账号信息（用户名和邮箱）
      await api.put('/users/profile', {
        username: username.trim(),
        email: email.trim()
      });
      
      setMessage('设置更新成功！');
      // 重新加载用户信息以更新 Redux 状态
      dispatch(loadUser());
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('更新设置失败:', error);
      setMessage(getErrorMessage(error, '更新设置失败，请重试'));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      if (currentPassword && newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
          setMessage('新密码和确认密码不匹配');
          setTimeout(() => setMessage(''), 3000);
          return;
        }

        if (newPassword.length < 6) {
          setMessage('新密码长度至少为6位');
          setTimeout(() => setMessage(''), 3000);
          return;
        }

        await api.put('/users/profile', {
          currentPassword,
          password: newPassword
        });
        // 重置密码表单
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('密码修改成功！');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('请填写所有密码字段');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('密码修改失败:', error);
      setMessage(getErrorMessage(error, '密码修改失败，请重试'));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading || reduxLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated || !reduxUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ fontSize: '18px', color: '#ff4d4f' }}>无法获取用户信息</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>设置</h2>
      </div>
      
      {message && (
        <div style={{ 
          ...styles.message, 
          ...(message.includes('成功') ? styles.successMessage : styles.errorMessage) 
        }}>
          {message}
        </div>
      )}
      
      <div style={styles.formContainer}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="个人设置" key="1">
            <form onSubmit={handleSubmit}>
              {/* 头像设置和账号信息 */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>个人信息</h3>
                <div style={styles.profileSection}>
                  {/* 头像设置 */}
                  <div style={styles.avatarSection}>
                    <div style={styles.avatarPreview}>
                    <img 
                      src={avatar || 'https://via.placeholder.com/150'} 
                      alt="头像" 
                      style={styles.avatar}
                    />
                    {uploading && (
                      <div style={styles.uploadingOverlay}>
                        <div style={styles.uploadingText}>上传中...</div>
                      </div>
                    )}
                    {/* 头像审核状态标签 */}
                    {reduxUser.avatarStatus && reduxUser.role !== 'admin' && (
                      <div style={{
                        ...styles.avatarStatusBadge,
                        ...styles[`avatarStatus${reduxUser.avatarStatus.charAt(0).toUpperCase() + reduxUser.avatarStatus.slice(1)}`]
                      }}>
                        {reduxUser.avatarStatus === 'pending' ? '审核中' : 
                         reduxUser.avatarStatus === 'approved' ? '已通过' : '已拒绝'}
                      </div>
                    )}
                  </div>
                    <div style={styles.avatarUpload}>
                      <label style={styles.uploadButton}>
                        选择文件
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleAvatarChange}
                          style={styles.fileInput}
                        />
                      </label>
                      <p style={styles.hint}>支持 JPG、PNG 格式，建议大小不超过 2MB</p>
                    </div>
                  </div>
                  
                  {/* 账号信息 */}
                  <div style={styles.accountSection}>
                    <div style={styles.formGroup}>
                      <label htmlFor="username" style={styles.label}>用户名：</label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="请输入新的用户名"
                        style={styles.input}
                        maxLength={30}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label htmlFor="email" style={styles.label}>邮箱：</label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="请输入新的邮箱"
                        style={styles.input}
                        maxLength={100}
                      />
                    </div>
                    {/* 昵称设置 */}
                    {reduxUser.role !== 'admin' && (
                      <div style={styles.formGroup}>
                        <label htmlFor="nickname" style={styles.label}>排行榜昵称：</label>
                        <div style={styles.inputWithStatus}>
                          <input 
                            type="text" 
                            id="nickname" 
                            value={nickname} 
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="请输入排行榜昵称"
                            style={styles.input}
                            maxLength={20}
                          />
                          {reduxUser.nicknameStatus && (
                            <div style={{
                              ...styles.inputStatusBadge,
                              ...styles[`status${reduxUser.nicknameStatus.charAt(0).toUpperCase() + reduxUser.nicknameStatus.slice(1)}`]
                            }}>
                              {reduxUser.nicknameStatus === 'pending' ? '审核中' : 
                               reduxUser.nicknameStatus === 'approved' ? '已通过' : '已拒绝'}
                            </div>
                          )}
                        </div>
                        <p style={styles.hint}>
                          昵称变更后需要管理员审核，审核通过后将在排行榜上显示
                        </p>
                      </div>
                    )}
                    <div style={styles.accountInfo}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>角色：</span>
                        <span style={styles.infoValue}>{reduxUser.role === 'admin' ? '管理员' : '普通用户'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>



              <div style={styles.buttonContainer}>
                <button type="submit" style={styles.submitButton}>
                  保存设置
                </button>
              </div>
            </form>
          </Tabs.TabPane>
          <Tabs.TabPane tab="个人安全设置" key="2">
            <form onSubmit={handlePasswordChange}>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>密码修改</h3>
                <div style={styles.formGroup}>
                  <label htmlFor="currentPassword" style={styles.label}>当前密码：</label>
                  <Input.Password 
                    id="currentPassword" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="请输入当前密码"
                    style={styles.input}
                    maxLength={30}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="newPassword" style={styles.label}>新密码：</label>
                  <Input.Password 
                    id="newPassword" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码"
                    style={styles.input}
                    maxLength={30}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="confirmPassword" style={styles.label}>确认新密码：</label>
                  <Input.Password 
                    id="confirmPassword" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请确认新密码"
                    style={styles.input}
                    maxLength={30}
                  />
                  <p style={styles.hint}>
                    留空则不修改密码
                  </p>
                </div>
                <div style={styles.buttonContainer}>
                  <button type="submit" style={styles.submitButton}>
                    修改密码
                  </button>
                </div>
              </div>
            </form>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

// 样式
const styles = {
  container: {
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
    padding: '15px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '20px',
    color: '#333',
    margin: 0,
    paddingBottom: '8px',
    borderBottom: '2px solid #1890ff',
  },
  message: {
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  successMessage: {
    backgroundColor: '#f6ffed',
    border: '1px solid #b7eb8f',
    color: '#52c41a',
  },
  errorMessage: {
    backgroundColor: '#fff2f0',
    border: '1px solid #ffccc7',
    color: '#ff4d4f',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '20px',
  },
  section: {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#333',
    margin: '0 0 12px 0',
    fontWeight: 'bold',
  },
  profileSection: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'center',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  accountSection: {
    flex: 1,
    minWidth: '250px',
    maxWidth: '400px',
  },
  avatarPreview: {
    position: 'relative',
    marginBottom: '15px',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e8e8e8',
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarStatusPending: {
    backgroundColor: '#faad14',
  },
  avatarStatusApproved: {
    backgroundColor: '#52c41a',
  },
  avatarStatusRejected: {
    backgroundColor: '#ff4d4f',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: '12px',
  },
  avatarUpload: {
    display: 'flex',
    flexDirection: 'column',
  },
  uploadButton: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#1890ff',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '10px',
    textAlign: 'center',
  },
  uploadButtonHover: {
    backgroundColor: '#40a9ff',
  },
  fileInput: {
    display: 'none',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    padding: '10px 40px 10px 10px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    maxWidth: '400px',
  },
  inputWithStatus: {
    position: 'relative',
    display: 'inline-block',
    width: '300px',
    maxWidth: '100%',
  },
  inputStatusBadge: {
    position: 'absolute',
    right: '5px',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#fff',
    zIndex: 1,
  },
  passwordToggleButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#1890ff',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px',
    zIndex: 1,
  },
  inputFocus: {
    borderColor: '#1890ff',
    boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    margin: '0 0 10px 0',
  },
  status: {
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    display: 'inline-block',
  },
  statusPending: {
    backgroundColor: '#fffbe6',
    border: '1px solid #ffe58f',
    color: '#faad14',
  },
  statusApproved: {
    backgroundColor: '#f6ffed',
    border: '1px solid #b7eb8f',
    color: '#52c41a',
  },
  statusRejected: {
    backgroundColor: '#fff2f0',
    border: '1px solid #ffccc7',
    color: '#ff4d4f',
  },
  statusLabel: {
    fontWeight: 'bold',
  },
  accountInfo: {
    backgroundColor: '#fafafa',
    padding: '15px',
    borderRadius: '4px',
    width: '300px',
  },
  infoItem: {
    marginBottom: '10px',
    fontSize: '14px',
  },
  infoLabel: {
    display: 'inline-block',
    width: '80px',
    color: '#666',
  },
  infoValue: {
    color: '#333',
  },

  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: '20px',
  },
  submitButton: {
    padding: '8px 24px',
    backgroundColor: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  submitButtonHover: {
    backgroundColor: '#40a9ff',
  },
  submitButtonDisabled: {
    backgroundColor: '#d9d9d9',
    cursor: 'not-allowed',
  },

};

export default UserSettings;
