const prisma = require("../config/database");

class BaseRepository {
  constructor() {
    this.prisma = prisma;
  }
}

module.exports = BaseRepository;
