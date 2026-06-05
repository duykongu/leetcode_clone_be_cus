const BaseRepository = require("./base.repository");

class problemsRepository extends BaseRepository {
  constructor() {
    super("problem");
  }

  async getProblems(params = {}) {
    return this.findPaginated(params);
  }

  async getProblemDetail(params = {}) {
    const { where, select, include } = params;
    return await this.prisma.problem.findUnique({
      where,
      ...(select && { select }),
      ...(include && { include }),
    });
  }

  async upsertProblem(params = {}) {
    const { where, update, create, select, include } = params;
    return await this.prisma.problem.upsert({
      where,
      update,
      create,
      ...(select && { select }),
      ...(include && { include }),
    });
  }

  async updateProblem(params = {}) {
    const { where, data, select, include } = params;
    return await this.prisma.problem.update({
      where,
      data,
      ...(select && { select }),
      ...(include && { include }),
    });
  }

  async deleteProblem(where) {
    return await this.prisma.problem.delete({ where });
  }
}

module.exports = new problemsRepository();
