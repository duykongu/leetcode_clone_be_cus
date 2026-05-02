const problemsRepository = require("../repositories/problemsRepository");

class problemsService {
  async getProblems(page = 1, limit = 10) {
    const result = await problemsRepository.getProblems({
      select: {
        id: true,
        title: true,
        acceptanceRate: true,
        difficulty: true,
        createdAt: true,
      },
      page,
      limit,
    });

    return {
      message: "Problems retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    };
  }
}

module.exports = new problemsService();
