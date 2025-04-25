const generateRandomPassword = (length) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  password += charset.match(/[A-Z]/)[0];
  password += charset.match(/[a-z]/)[0];
  password += charset.match(/[0-9]/)[0];
  password += charset.match(/[!@#$%^&*]/)[0];
  
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

module.exports = {
  generateRandomPassword
}; 