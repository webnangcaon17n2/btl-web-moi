const { query } = require('./db');

async function inspect() {
  try {
    const cols = await query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);
    
    const tables = {};
    for (const row of cols.recordset) {
      if (!tables[row.TABLE_NAME]) tables[row.TABLE_NAME] = [];
      tables[row.TABLE_NAME].push(`${row.COLUMN_NAME} (${row.DATA_TYPE}${row.CHARACTER_MAXIMUM_LENGTH ? `(${row.CHARACTER_MAXIMUM_LENGTH})` : ''}, ${row.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    }

    for (const [tbl, columns] of Object.entries(tables)) {
      console.log(`\n=== [${tbl}] ===`);
      console.log(columns.join(', '));
    }
  } catch (err) {
    console.error('Error inspecting:', err);
  } finally {
    process.exit(0);
  }
}

inspect();
