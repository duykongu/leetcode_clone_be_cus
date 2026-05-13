const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { tokenRepository: tokenRepo } = require("../repositories");
const { HTTP_STATUS } = require("../constants");

class TokenService {
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

    await tokenRepo.createRefreshToken(userId, tokenHash, expiresAt);

    return refreshToken;
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Refresh token is required' };
    }

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const storedToken = await tokenRepo.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' };
    }

    if (storedToken.revoked) {
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Refresh token has been revoked', code: 'REFRESH_TOKEN_REVOKED' };
    }

    if (storedToken.expiresAt < new Date()) {
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Refresh token expired', code: 'REFRESH_TOKEN_EXPIRED' };
    }

    // Revoke the used refresh token (rotate)
    await tokenRepo.revokeRefreshToken(tokenHash);

    const user = storedToken.user;
    const newAccessToken = this.generateToken(user);
    const newRefreshToken = await this.storeRefreshToken(user.id, this.generateRefreshToken(user));

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  }

  async revokeRefreshToken(token) {
    if (!token) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Refresh token is required' };
    }

    const tokenHash = await bcrypt.hash(token, 10);
    const storedToken = await tokenRepo.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Refresh token not found' };
    }

    await tokenRepo.revokeRefreshToken(tokenHash);
    return { message: 'Refresh token revoked successfully' };
  }
}

module.exports = new TokenService();
