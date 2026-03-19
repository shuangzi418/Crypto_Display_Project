import React, { useState } from 'react';
import api from '../axios';
import { useSelector } from 'react-redux';

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const { user: reduxUser, isAuthenticated } = useSelector(state => state.user);

  if (!isAuthenticated || !reduxUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ fontSize: '18px', color: '#ff4d4f' }}>无法获取用户信息</div>
      </div>
    );
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      if (currentPassword && newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
          setMessage('新密码和确认密码不匹配');
          setTimeout(() => setMessage(''), 3000);
          return;
        }
        await api.put('/users/profile', {
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
      setMessage('密码修改失败，请重试');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>个人安全设置</h2>
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
        <form onSubmit={handlePasswordChange}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>密码修改</h3>
            <div style={styles.formGroup}>
              <label htmlFor="currentPassword" style={styles.label}>当前密码：</label>
              <input 
                type="password" 
                id="currentPassword" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="newPassword" style={styles.label}>新密码：</label>
              <input 
                type="password" 
                id="newPassword" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="confirmPassword" style={styles.label}>确认新密码：</label>
              <input 
                type="password" 
                id="confirmPassword" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请确认新密码"
                style={styles.input}
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
      </div>
    </div>
  );
};

// 样式
const styles = {
  container: {
    maxWidth: '95%',
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
    paddingBottom: '15px',
    borderBottom: '1px solid #f0f0f0',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#333',
    margin: '0 0 12px 0',
    fontWeight: 'bold',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '15px',
  },
  label: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    padding: '10px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    maxWidth: '100%',
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    margin: '10px 0 0 0',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
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
};

export default SecuritySettings;