const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRegister = (data) => {
  if (!data) {
    throw { statusCode: 400, message: "Thiếu dữ liệu request body" };
  }

  const { email, username, password, confirmPassword } = data;

  if (!username || username.length < 3) {
    throw { statusCode: 400, message: "Username >= 3 ký tự" };
  }

  if (!email || !validateEmail(email)) {
    throw { statusCode: 400, message: "Email không hợp lệ" };
  }

  if (!password || password.length < 6) {
    throw { statusCode: 400, message: "Password >= 6 ký tự" };
  }

  if (password !== confirmPassword) {
    throw { statusCode: 400, message: "Password không khớp" };
  }
};

const validateLogin = (data) => {
  if (!data) {
    throw { statusCode: 400, message: "Thiếu dữ liệu request body" };
  }
  const { email, password } = data;
  if (!email || !password) {
    throw { statusCode: 400, message: "Thiếu email hoặc password" };
  }
};

module.exports = {
  validateEmail,
  validateRegister,
  validateLogin,
};
