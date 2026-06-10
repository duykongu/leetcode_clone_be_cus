const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { tokenRepository: tokenRepo } = require("../repositories");
const { HTTP_STATUS } = require("../constants");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'leetcode-jwt-secret-dev';
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'leetcode-refresh-secret-dev';
}

class TokenService {
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: "15m" }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      getRefreshSecret(),
      { expiresIn: "7d" }
    );
  }

  async storeRefreshToken(userId, refreshToken) {
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await tokenRepo.createRefreshToken(userId, tokenHash, expiresAt);
    return refreshToken;
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: "Refresh token is required" };
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await tokenRepo.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: "Invalid refresh token", code: "INVALID_REFRESH_TOKEN" };
    }

    if (storedToken.revoked) {
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: "Refresh token has been revoked", code: "REFRESH_TOKEN_REVOKED" };
    }

    if (storedToken.expiresAt < new Date()) {
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: "Refresh token expired", code: "REFRESH_TOKEN_EXPIRED" };
    }

    await tokenRepo.revokeRefreshToken(tokenHash);

    const user = storedToken.user;
    const newAccessToken = this.generateToken(user);
    const newRefreshToken = await this.storeRefreshToken(user.id, this.generateRefreshToken(user));

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60,
    };
  }

  verifyToken(token) {
    return jwt.verify(token, getJwtSecret());
  }

  async revokeRefreshToken(token) {
    if (!token) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: "Refresh token is required" };
    }

    const tokenHash = hashToken(token);
    const storedToken = await tokenRepo.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: "Refresh token not found" };
    }

    await tokenRepo.revokeRefreshToken(tokenHash);
    return { message: "Refresh token revoked successfully" };
  }
}

module.exports = TokenService;
