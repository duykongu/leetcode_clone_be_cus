const prisma = require('../config/database');

class problemsRepository {
  async getProblems(params = {}) {
    const { select, where, orderBy, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    // Get paginated data
    const data = await prisma.problem.findMany({
      where: where,
      select: select,
      orderBy: orderBy || { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count for pagination info
    const total = await prisma.problem.count({ where });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProblemDetail(params = {}) {
    const { where, select, include } = params;
    return await prisma.problem.findUnique({
      where,
      select,
      include,
    });
  }
}

module.exports = new problemsRepository();
