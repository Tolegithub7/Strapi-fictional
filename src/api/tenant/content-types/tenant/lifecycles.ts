import path from 'path';
import fs from 'fs';
import knex from 'knex';

async function buildTenantSchema(slug: string, strapi: any) {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, `${slug}.db`);
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '');

  const tempKnex = knex({
    client: 'better-sqlite3',
    connection: { filename: dbPath },
    useNullAsDefault: true,
  });

  try {
    const models = (strapi.db.metadata as Map<string, any>);

    for (const [uid, model] of models.entries()) {
      try {
        if (!uid || uid.startsWith('api::tenant.') || uid.startsWith('admin::') || uid.startsWith('plugin::')) continue;

        const tableName = model?.tableName || uid.replace(/[:.]/g, '_');

        const exists = await tempKnex.schema.hasTable(tableName);
        if (exists) continue; // skip existing tables for now

        await tempKnex.schema.createTable(tableName, (table) => {
          table.increments('id').primary();

          const attrs: Record<string, any> = model?.attributes || {};
          for (const [attrName, attr] of Object.entries(attrs)) {
            const type = (attr as any)?.type;
            switch (type) {
              case 'string':
              case 'uid':
              case 'email':
              case 'password':
              case 'enumeration':
                table.string(attrName);
                break;
              case 'text':
              case 'richtext':
                table.text(attrName);
                break;
              case 'integer':
              case 'biginteger':
                table.integer(attrName);
                break;
              case 'float':
              case 'decimal':
                table.specificType(attrName, 'REAL');
                break;
              case 'json':
              case 'blocks':
              case 'dynamiczone':
                table.json(attrName);
                break;
              case 'boolean':
                table.boolean(attrName);
                break;
              case 'date':
                table.date(attrName);
                break;
              case 'datetime':
              case 'timestamp':
                table.timestamp(attrName);
                break;
              case 'time':
                table.time(attrName);
                break;
              case 'component':
                if (attr.repeatable) {
                  console.warn(`Repeatable component ${attrName} - manual setup needed`);
                } else {
                  table.json(attrName);
                }
                break;
              case 'media':
                table.integer(`${attrName}_id`).unsigned();
                if (attr.target && !attr.target.startsWith('api::tenant.')) {
                  const targetMeta = strapi.db.metadata.get(attr.target);
                  if (targetMeta?.tableName) table.foreign(`${attrName}_id`).references('id').inTable(targetMeta.tableName);
                }
                break;
              case 'relation': {
                const relCol = attr.relation === 'oneToOne' || attr.relation === 'manyToOne' ? `${attrName}_id` : null;
                if (relCol) table.integer(relCol).unsigned();
                if (attr.target && relCol && !attr.target.startsWith('api::tenant.')) {
                  const targetMeta = strapi.db.metadata.get(attr.target);
                  if (targetMeta?.tableName) table.foreign(relCol).references('id').inTable(targetMeta.tableName);
                }
                break;
              }
              default:
                // Fallback to string for unknown/simple types
                table.string(attrName);
            }
          }

          table.timestamp('created_at').defaultTo(tempKnex.fn.now());
          table.timestamp('updated_at').defaultTo(tempKnex.fn.now());
          if (model?.options?.draftAndPublish) {
            table.timestamp('published_at').nullable();
          }
        });
      } catch (err) {
        console.warn(`Failed to create table for model ${uid}:`, err);
      }
    }
  } finally {
    await tempKnex.destroy();
  }

  console.log(`Schema migrated to ${slug}.db`);
}

export default {
  async afterCreate(event: any) {
    const { result, strapi } = event;
    if (!result?.slug) return;
    try {
      await buildTenantSchema(result.slug, strapi);
    } catch (err) {
      console.error('afterCreate tenant lifecycle error:', err);
    }
  },

  async afterUpdate(event: any) {
    const { result, strapi } = event;
    if (!result?.slug) return;
    try {
      // On update, ensure the tenant DB exists/migrated for the (possibly new) slug
      await buildTenantSchema(result.slug, strapi);
    } catch (err) {
      console.error('afterUpdate tenant lifecycle error:', err);
    }
  },
};