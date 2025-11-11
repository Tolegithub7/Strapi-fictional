export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',  // ← MUST BE BEFORE db-switch
  { resolve: './src/middlewares/db-switch' },  // ← NOW AFTER session
  { resolve: './src/middlewares/tenant' },
  { resolve: './src/middlewares/tenant-filter' },
  'strapi::favicon',
  'strapi::public',
];