const BaseRepository = require("./base.repository");

class UserRepository extends BaseRepository {
  constructor() {
    super("user");
  }

  // Create a new user account
  async createAccount(data, options = {}) {
    const { select, ...otherOptions } = options;
    return this.prisma.user.create({
      data,
      ...(select && { select }),
      ...otherOptions,
    });
  }

  // Find a user by email
  async findByEmail(email, options = {}) {
    const { select, ...otherOptions } = options;
    return this.prisma.user.findUnique({
      where: { email },
      ...(select && { select }),
      ...otherOptions,
    });
  }

  // Find a user by id
  async findById(id, options = {}) {
    const { select, ...otherOptions } = options;
    return this.prisma.user.findUnique({
      where: { id },
      ...(select && { select }),
      ...otherOptions,
    });
  }

  // Check if email is already taken
  async isEmailTaken(email) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return !!user;
  }

  // Check if username is already taken
  async isUsernameTaken(username) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return !!user;
  }

  // Update last active time
  async updateLastActive(userId) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });
  }

  // Find all users (for admin)
  async findAll(options = {}) {
    return this.findPaginated(options);
  }
}

module.exports = new UserRepository();
