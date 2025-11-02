import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::site.site', ({ strapi }) => ({
  async find(ctx) {
    const tenant = ctx.state.tenant;

    if (!tenant) {
      return ctx.badRequest('Tenant header (x-tenant) missing');
    }

    // Filter sites that belong only to this tenant
    const entities = await strapi.db.query('api::site.site').findMany({
      where: { tenant: tenant.id },
    });

    return entities;
  },

  async create(ctx) {
    const tenant = ctx.state.tenant;

    if (!tenant) {
      return ctx.badRequest('Tenant header (x-tenant) missing');
    }

    // Automatically assign tenant when creating
    const body = ctx.request.body.data;
    body.tenant = tenant.id;

    const entity = await strapi.db.query('api::site.site').create({ data: body });
    return entity;
  },
}));
