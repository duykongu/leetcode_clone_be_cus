const { userRepository: userRepo, tokenRepository: tokenRepo } = require("../repositories");
const bcrypt = require("bcryptjs");
const validator = require("../utils/validator");
const tokenService = require("./token.service");
const { HTTP_STATUS } = require("../constants");

class AuthService {
  async register(data) {
    validator.validateRegister(data);
    const { username, email, password } = data;
    const [userNameExists, emailExists] = await Promise.all([
      userRepo.isUsernameTaken(username),
      userRepo.isEmailTaken(email),
    ]);

    if (userNameExists) {
      throw { statusCode: HTTP_STATUS.CONFLICT, message: "Username đã tồn tại" };
    }
    if (emailExists) {
      throw { statusCode: HTTP_STATUS.CONFLICT, message: "Email đã tồn tại" };
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

    const token = tokenService.generateToken(user);

    return { message: "User created successfully", data: { user, token } };
  }

  async login(data) {
    validator.validateLogin(data);
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
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: "Email hoặc password không đúng" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: "Email hoặc password không đúng" };
    }

    const token = tokenService.generateToken(user);
    await userRepo.updateLastActive(user.id);

    return { message: "Login successful", data: { user, token } };
  }

  async logout(userId) {
    if (!userId) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'User ID is required' };
    }

    await tokenRepo.revokeAllRefreshTokens(userId);
    return { message: 'Logged out successfully' };
  }

  async getUsers(page = 1, limit = 10) {
    const result = await userRepo.findAll({
      page,
      limit,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        lastActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      ...result,
    };
  }
}

module.exports = new AuthService();
