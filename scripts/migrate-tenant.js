#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const knex = require('knex');

async function migrateTenant(slug) {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, `${slug}.db`);
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '');

  const tenantKnex = knex({
    client: 'better-sqlite3',
    connection: { filename: dbPath },
    useNullAsDefault: true,
  });

  try {
    const apiDir = path.resolve(process.cwd(), 'src', 'api');
    if (!fs.existsSync(apiDir)) {
      console.error('No src/api directory found. Nothing to migrate.');
      return;
    }

    const apis = fs.readdirSync(apiDir).filter((d) => fs.statSync(path.join(apiDir, d)).isDirectory());

    for (const apiName of apis) {
      const ctBase = path.join(apiDir, apiName, 'content-types');
      if (!fs.existsSync(ctBase)) continue;

      const ctDirs = fs.readdirSync(ctBase).filter((d) => fs.statSync(path.join(ctBase, d)).isDirectory());
      for (const ctName of ctDirs) {
        const schemaPath = path.join(ctBase, ctName, 'schema.json');
        if (!fs.existsSync(schemaPath)) continue;

        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const tableName = schema.collectionName || schema.info?.pluralName || `${ctName}s`;

        const exists = await tenantKnex.schema.hasTable(tableName);
        if (exists) {
          console.log(`Table ${tableName} already exists — skipping.`);
          continue;
        }

        console.log(`Creating table ${tableName}`);
        await tenantKnex.schema.createTable(tableName, (table) => {
          table.increments('id').primary();

          const attrs = schema.attributes || {};
          for (const [attrName, attr] of Object.entries(attrs)) {
            const type = attr.type;
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
                break;
              case 'relation':
                if (attr.relation === 'oneToOne' || attr.relation === 'manyToOne') {
                  table.integer(`${attrName}_id`).unsigned();
                } else {
                  // manyToMany / oneToMany -> skip (join table required)
                }
                break;
              default:
                table.string(attrName);
            }
          }

          table.timestamp('created_at').defaultTo(tenantKnex.fn.now());
          table.timestamp('updated_at').defaultTo(tenantKnex.fn.now());
          if (schema.options?.draftAndPublish) table.timestamp('published_at').nullable();
        });
      }
    }
  } finally {
    await tenantKnex.destroy();
  }

  console.log(`Migration completed for tenant ${slug} -> ${dbPath}`);
}

const slugArg = process.argv[2] || process.env.SLUG || 'anfield';
migrateTenant(slugArg).catch((err) => { console.error(err); process.exit(1); });
