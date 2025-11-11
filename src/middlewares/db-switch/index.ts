import type { Context, Next } from 'koa';  
import knex from 'knex';  
import path from 'path';  

export default (config: any, { strapi }: { strapi: any }) => {  
  return async (ctx: Context, next: Next) => {  
    // Skip for public routes or no user  
    if (!ctx.state.user && !ctx.state.admin_user) return await next();  

    let tenantSlug: string | undefined;  

    // Admin panel user (admin::user)  
    if (ctx.session?.passport?.user) {
      const adminId = ctx.session.passport.user;
      const admin = await strapi.entityService.findOne('admin::user', adminId, {
        populate: ['tenant'],
      });
      tenantSlug = admin?.tenant?.slug;
    } 

    // API user (users-permissions)  
    else if (ctx.state.user) {  
      tenantSlug = ctx.state.user.tenant?.slug; // From relation  
    }  

    // Fallback to x-tenant header (for API)  
    if (!tenantSlug) {  
      tenantSlug = ctx.request.header['x-tenant'] as string;  
    }  

    if (!tenantSlug) {  
      ctx.throw(403, 'No tenant assigned');  
      return;  
    }  

    // Validate tenant exists (use default DB)  
    const defaultKnex = knex({  
      client: 'sqlite3',  
      connection: { filename: path.resolve(__dirname, '../../data/default.db') },  
      useNullAsDefault: true,  
    });  
    const tenant = await defaultKnex('tenants').where({ slug: tenantSlug }).first();  
    await defaultKnex.destroy();  
    if (!tenant) {  
      ctx.throw(404, `Tenant "${tenantSlug}" not found`);  
      return;  
    }  

    // Switch DB  
    const dbPath = path.resolve(__dirname, '../../data', `${tenantSlug}.db`);  
    const oldConn = strapi.db.connection;  
    if (oldConn) await oldConn.destroy();  

    const newKnex = knex({  
      client: 'sqlite3',  
      connection: { filename: dbPath },  
      useNullAsDefault: true,  
    });  
    strapi.db.connection = newKnex;  
    strapi.db.query = newKnex; // For queries  

    console.log(`Switched to DB: ${tenantSlug}.db`);  

    await next();  

    // Optional: Reset to default after request (for safety)  
    await newKnex.destroy();  
    const resetKnex = knex({  
      client: 'sqlite3',  
      connection: { filename: path.resolve(__dirname, '../../data/default.db') },  
      useNullAsDefault: true,  
    });  
    strapi.db.connection = resetKnex;  
    strapi.db.query = resetKnex;  
  };  
};  