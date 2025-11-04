import { Context, Next } from 'koa';

export default async (ctx: Context, next: Next) => {
  const user = ctx.state.user;

  // Only apply filtering for tenant-based users (not superadmin)
  if (user && user.tenant) {
    const tenantId = user.tenant.id || user.tenant;

    // Ensure we have a predictable object to spread for filters
    let existingFilters: Record<string, any> = {};

    if (ctx.request.query && typeof ctx.request.query.filters === 'object' && ctx.request.query.filters !== null) {
      existingFilters = ctx.request.query.filters as Record<string, any>;
    } else if (ctx.request.query && typeof ctx.request.query.filters === 'string') {
      try {
        existingFilters = JSON.parse(ctx.request.query.filters);
      } catch {
        existingFilters = {};
      }
    }

    // Merge with existing filters
    ctx.request.query = ctx.request.query || {};
    ctx.request.query.filters = {
      ...existingFilters,
      tenant: tenantId,
    };
  }

  await next();
};
