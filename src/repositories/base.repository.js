const prisma = require("../config/database");
const { buildPaginatedResponse } = require("../utils/pagination");

class BaseRepository {
  constructor(modelName) {
    this.prisma = prisma;
    this.model = modelName ? prisma[modelName] : null;
  }

  async findPaginated(options = {}) {
    if (!this.model) {
      throw new Error("Model not initialized in BaseRepository");
    }

    const {
      page = 1,
      limit = 50,
      select,
      where = {},
      orderBy = { createdAt: "desc" },
    } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        skip,
        take: limit,
        where,
        ...(select && { select }),
        orderBy,
      }),
      this.model.count({ where }),
    ]);

    return buildPaginatedResponse(data, page, limit, total);
  }

  async count(where = {}) {
    if (!this.model) {
      throw new Error("Model not initialized in BaseRepository");
    }
    return this.model.count({ where });
  }
}

module.exports = BaseRepository;
