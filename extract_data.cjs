const { Client } = require('pg');
const fs = require('fs');

const OLD_DB_URL = 'postgresql://postgres:1om6L7vrCVnXpA3o@db.theaotengnvtxlsyudmz.supabase.co:5432/postgres';

async function extractData() {
  const client = new Client({ connectionString: OLD_DB_URL });
  await client.connect();

  const tables = [
    'auth.users',
    'auth.identities',
    'public.companies',
    'public.profiles',
    'public.user_roles',
    'public.company_settings',
    'public.company_features',
    'public.attendance',
    'public.attendance_corrections',
    'public.tasks',
    'public.loan_targets',
    'public.leave_requests',
    'public.kudos',
    'public.helpdesk_tickets',
    'public.chat_channels',
    'public.chat_messages',
    'public.admin_permissions',
    'public.audit_logs',
    'public.notifications',
    'public.employee_moods'
  ];

  let sqlFile = `-- Data Migration Script
-- Run this in your NEW Supabase project's SQL Editor

SET session_replication_role = 'replica';\n\n`;

  for (const table of tables) {
    console.log(`Extracting data from ${table}...`);
    try {
      const [schema, tableName] = table.split('.');
      const colRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2 AND is_generated = 'NEVER'
      `, [schema, tableName]);
      
      const validColumns = colRes.rows.map(r => r.column_name);

      const res = await client.query(`SELECT * FROM ${table}`);
      if (res.rows.length === 0) continue;
      
      const columnNames = validColumns.map(c => `"${c}"`).join(', ');
      
      sqlFile += `-- Data for ${table}\n`;
      
      for (const row of res.rows) {
        const values = validColumns.map(col => {
          let val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') {
            return "'" + val.replace(/'/g, "''") + "'";
          }
          if (typeof val === 'object') {
             if (val instanceof Date) {
               return "'" + val.toISOString() + "'";
             }
             return "'" + JSON.stringify(val).replace(/'/g, "''") + "'";
          }
          return val;
        });
        
        sqlFile += `INSERT INTO ${table} (${columnNames}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      sqlFile += `\n`;
    } catch (e) {
      console.log(`Error reading table ${table}:`, e.message);
    }
  }

  sqlFile += `SET session_replication_role = 'origin';\n`;

  fs.writeFileSync('data_migration.sql', sqlFile);
  console.log('Extraction complete! Data written to data_migration.sql');
  await client.end();
}

extractData();
