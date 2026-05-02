const prisma = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class UserRepository {
  // Create a new user account
  async createAccount(data, options = {}) {
    const { select, ...otherOptions } = options;
    return prisma.user.create({
      data,
      ...(select && { select }),
      ...otherOptions,
    });
  }

  // Find a user by email
  async findByEmail(email, options = {}) {
    const { select, ...otherOptions } = options;
    return prisma.user.findUnique({
      where: { email },
      ...(select && { select }),
      ...otherOptions,
    });
  }

  // Find a user by id
  async findById(id, options = {}) {
    const { select, ...otherOptions } = options;
    return prisma.user.findUnique({
      where: { id },
      ...(select && { select }),
      ...otherOptions,
    });
  }

  // Check if email is already taken
  async isEmailTaken(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return !!user;
  }

  // Check if username is already taken
  async isUsernameTaken(username) {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    return !!user;
  }

  // Create a new refresh token
  async createRefreshToken(userId, tokenHash, expiresAt) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  // Find refresh token by token hash
  async findRefreshToken(tokenHash) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  // Revoke refresh token by token hash
  async revokeRefreshToken(tokenHash) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  // Revoke all refresh tokens for a user
  async revokeAllRefreshTokens(userId) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: { revoked: true },
    });
  }

  // Clean up expired tokens
  async cleanupExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

module.exports = new UserRepository();
