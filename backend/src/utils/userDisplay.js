const buildDisplayName = (user) => {
  if (user && user.nickname && user.nicknameStatus === 'approved') {
    return user.nickname;
  }

  return user && user.username ? user.username : '-';
};

const buildAvatarFallbackText = (user) => {
  const displayName = buildDisplayName(user);
  const source = displayName && displayName !== '-' ? displayName : (user && user.username ? user.username : '?');
  const trimmed = String(source || '').trim();

  if (!trimmed) {
    return '?';
  }

  return trimmed.charAt(0).toUpperCase();
};

const buildDisplayAvatarUrl = (user) => {
  if (user && user.avatar && user.avatarStatus === 'approved') {
    return user.avatar;
  }

  return null;
};

module.exports = {
  buildDisplayName,
  buildAvatarFallbackText,
  buildDisplayAvatarUrl
};
