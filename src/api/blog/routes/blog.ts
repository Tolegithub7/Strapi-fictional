import { factories } from '@strapi/strapi';

// Use the core router factory so Strapi attaches the correct apiName/type
// metadata to routes and handlers can be resolved (e.g. "blog.findOne").
export default factories.createCoreRouter('api::blog.blog');
