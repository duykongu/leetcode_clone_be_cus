const BaseRepository = require("./base.repository");

class TokenRepository extends BaseRepository {
  // Create a new refresh token
  async createRefreshToken(userId, tokenHash, expiresAt) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  // Find refresh token by token hash
  async findRefreshToken(tokenHash) {
    return this.prisma.refreshToken.findFirst({
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
    return this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  // Revoke all refresh tokens for a user
  async revokeAllRefreshTokens(userId) {
    return this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: { revoked: true },
    });
  }

  // Clean up expired tokens
  async cleanupExpiredTokens() {
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

module.exports = new TokenRepository();
