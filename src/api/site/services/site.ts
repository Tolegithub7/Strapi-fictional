const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::site.site', ({ strapi }) => ({
  async find(params, populate) {
    const { ctx } = strapi; // not always available; prefer passing tenantId
    const tenantId = (ctx && ctx.state && ctx.state.tenant) ? ctx.state.tenant.id : null;

    const filters = params?.filters || {};
    if (tenantId) {
      filters.tenant = tenantId;
      params.filters = filters;
    }
    return await super.find(params, populate);
  },
  async create(data) {
    const tenantId = strapi?.ctx?.state?.tenant?.id;
    if (tenantId) data.tenant = tenantId;
    return await super.create({ data });
  }
}));
