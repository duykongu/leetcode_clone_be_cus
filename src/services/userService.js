const userRepo = require("../repositories/userRepository");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class UserService {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateRegister(data) {
    if (!data) {
      throw { statusCode: 400, message: "Thiếu dữ liệu request body" };
    }

    const { email, username, password, confirmPassword } = data;

    if (!username || username.length < 3) {
      throw { statusCode: 400, message: "Username >= 3 ký tự" };
    }

    if (!email || !email.includes("@")) {
      throw { statusCode: 400, message: "Email không hợp lệ" };
    }

    if (!password || password.length < 6) {
      throw { statusCode: 400, message: "Password >= 6 ký tự" };
    }

    if (password !== confirmPassword) {
      throw { statusCode: 400, message: "Password không khớp" };
    }
  }

  validateLogin(data) {
    if (!data) {
      throw { statusCode: 400, message: "Thiếu dữ liệu request body" };
    }
    const { email, password } = data;
    if (!email || !password) {
      throw { statusCode: 400, message: "Thiếu email hoặc password" };
    }
  }

  async register(data) {
    this.validateRegister(data);
    const { username, email, password } = data;
    const [userNameExists, emailExists] = await Promise.all([
      userRepo.isUsernameTaken(username),
      userRepo.isEmailTaken(email),
    ]);

    if (userNameExists) {
      throw { statusCode: 409, message: "Username đã tồn tại" };
    }
    if (emailExists) {
      throw { statusCode: 409, message: "Email đã tồn tại" };
    }

    const passWordHash = await bcrypt.hash(password, 10);
    const user = await userRepo.createAccount(
      {
        username,
        email,
        passwordHash: passWordHash,
      },
      {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
    );

    const token = this.generateToken(user);

    return { message: "User created successfully", data: { user, token } };
  }

  async login(data) {
    this.validateLogin(data);
    const { email, password } = data;
    const user = await userRepo.findByEmail(email, {
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        role: true,
        passwordHash: true,
      },
    });
    if (!user) {
      throw { statusCode: 401, message: "Email hoặc password không đúng" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: "Email hoặc password không đúng" };
    }

    const token = this.generateToken(user);

    return { message: "Login successful", data: { user, token } };
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
  }

  generateRefreshToken(user) {
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh_secret',
      { expiresIn: '7d' }
    );
    return refreshToken;
  }

  async storeRefreshToken(userId, refreshToken) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await userRepo.createRefreshToken(userId, tokenHash, expiresAt);

    return refreshToken;
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw { statusCode: 400, message: 'Refresh token is required' };
    }

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const storedToken = await userRepo.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw { statusCode: 401, message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' };
    }

    if (storedToken.revoked) {
      throw { statusCode: 401, message: 'Refresh token has been revoked', code: 'REFRESH_TOKEN_REVOKED' };
    }

    if (storedToken.expiresAt < new Date()) {
      throw { statusCode: 401, message: 'Refresh token expired', code: 'REFRESH_TOKEN_EXPIRED' };
    }

    // Revoke the used refresh token (rotate)
    await userRepo.revokeRefreshToken(tokenHash);

    const user = storedToken.user;
    const newAccessToken = this.generateToken(user);
    const newRefreshToken = await this.storeRefreshToken(user.id, this.generateRefreshToken(user));

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  async logout(userId) {
    if (!userId) {
      throw { statusCode: 400, message: 'User ID is required' };
    }

    await userRepo.revokeAllRefreshTokens(userId);
    return { message: 'Logged out successfully' };
  }

  async revokeRefreshToken(token) {
    if (!token) {
      throw { statusCode: 400, message: 'Refresh token is required' };
    }

    const tokenHash = await bcrypt.hash(token, 10);
    const storedToken = await userRepo.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw { statusCode: 404, message: 'Refresh token not found' };
    }

    await userRepo.revokeRefreshToken(tokenHash);
    return { message: 'Refresh token revoked successfully' };
  }

  async revokeAllUserTokens(userId) {
    await userRepo.revokeAllRefreshTokens(userId);
    return { message: 'All refresh tokens revoked successfully' };
  }

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  }

  async getProfile(userId) {
    const user = await userRepo.findById(userId, {
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
        solvedCount: true,
        streakDays: true,
        lastActive: true,
      },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return user;
  }
}

module.exports = new UserService();
