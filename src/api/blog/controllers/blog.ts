import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::blog.blog', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user; // Logged-in user
    const tenant = ctx.state.tenant; // Tenant from your middleware

    if (!user) {
      return ctx.unauthorized('You must be logged in to create a blog');
    }

    const data = ctx.request.body.data;

    // Automatically set author and tenant
    data.author = user.id;
    if (tenant) data.tenant = tenant.id;

    const blog = await strapi.db.query('api::blog.blog').create({ data });

    return blog;
  },

  async find(ctx) {
    const user = ctx.state.user;
    const tenant = ctx.state.tenant;

    // Return only blogs for the current tenant and author
    const where: any = {};
    if (tenant) where.tenant = tenant.id;
    if (user) where.author = user.id;

    const blogs = await strapi.db.query('api::blog.blog').findMany({ where });
    return blogs;
  },
}));
