import type { Context, Next } from 'koa';

export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: Context, next: Next) => {
    const slug = ctx.request.header['x-tenant'] as string;

    if (!slug) return await next();

    const tenant = await strapi.db.query('api::tenant.tenant').findOne({
      where: { slug },
    });

    if (!tenant) {
      ctx.throw(404, `Tenant "${slug}" not found`);
      return;
    }

    ctx.state.tenant = tenant; // 🧩 store tenant in context
    await next();
  };
};
