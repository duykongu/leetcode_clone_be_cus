const jwt = require('jsonwebtoken');
const { userRepository: userRepo } = require('../repositories');
const { HTTP_STATUS } = require('../constants');
const { can } = require("../utils/access-control");
const { PERMISSIONS } = require("../constants/permissions");

class AuthMiddleware {
  async authenticate(req, res, next) {
    try {
      let token = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.query?.token) {
        token = req.query.token;       
      }
      
      if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false, message: 'No token provided', code: 'MISSING_TOKEN',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      const user = await userRepo.findById(decoded.id, {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      console.error('Auth middleware error:', err);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  async optionalAuth(req, res, next) {
    try {
      let token = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.query?.token) {
        token = req.query.token; // ← fallback cho SSE EventSource
      }
      
      // SỬA TẠI ĐÂY: Vì là optional, nếu KHÔNG có token thì cho đi tiếp luôn chứ không trả lỗi 401
      if (!token) {
        return next();
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      const user = await userRepo.findById(decoded.id, {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          avatarUrl: true,
        },
      });

      if (user) {
        req.user = user;
      }
      
      next(); // Đưa next() vào trong khối try để chạy tuần tự sau khi lấy xong user
    } catch (err) {
      // For optional auth, just continue even if token is invalid
      next();
    }
  }

  requirePermission(permission) {
    return (req, res, next) => {
      if (!can(req.user, permission)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: `Forbidden: You do not have the required permission (${permission})`,
          code: "FORBIDDEN_PERMISSION_REQUIRED",
        });
      }
      next();
    };
  }
}

module.exports = new AuthMiddleware();