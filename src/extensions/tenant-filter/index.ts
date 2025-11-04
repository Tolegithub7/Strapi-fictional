// Removed typed Strapi import because the package does not export a 'Strapi' type.
// We will use a loose 'any' type for the runtime strapi instance below.
export default {
  register({ strapi }: { strapi: any }) {
    // This runs when Strapi starts up
    // This runs when Strapi starts up
    const models = Object.keys(strapi.contentTypes);

    models.forEach((uid) => {
      const model = strapi.contentTypes[uid];

      // Only apply to models with a 'tenant' relation
      if (model.attributes.tenant) {
        strapi.db.lifecycles.subscribe({
          models: [uid],

          // 🧠 Automatically filter reads
          async beforeFindMany(event) {
            const { params, state } = event;
            const tenant = state?.tenant;
            if (tenant) {
              params.where = {
                ...(params.where || {}),
                tenant: tenant.id,
              };
            }
          },

          async beforeFindOne(event) {
            const { params, state } = event;
            const tenant = state?.tenant;
            if (tenant) {
              params.where = {
                ...(params.where || {}),
                tenant: tenant.id,
              };
            }
          },

          // 🏗️ Automatically assign tenant when creating
          async beforeCreate(event) {
            const { data, state } = event;
            const tenant = state?.tenant;
            if (tenant) {
              data.tenant = tenant.id;
            }
          },
        });
      }
    });
  },
};
