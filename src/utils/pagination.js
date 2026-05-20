function getPagination(query, defaultLimit = 10) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.max(parseInt(query.limit) || defaultLimit, 1);
  return { page, limit };
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

function buildPaginatedResponse(data, page, limit, total) {
  return {
    data,
    pagination: buildPagination(page, limit, total),
  };
}

module.exports = {
  getPagination,
  buildPagination,
  buildPaginatedResponse,
};
