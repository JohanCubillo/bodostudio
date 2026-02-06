const { Pool } = require('pg');

const pool = new Pool({
    host: '18.215.154.82',
    port: 5432,
    database: 'ia_analytics',
    user: 'db_2_readwrite',
    password: '0AQRT0wGfsora3ld5udN5NhfssQbr9oZ',
    ssl: false
});

async function checkTables() {
    try {
        // Listar todas las tablas disponibles
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('Tablas disponibles:');
        console.log('==================');
        result.rows.forEach(row => {
            console.log('- ' + row.table_name);
        });
        
        // Verificar si existen las tablas de bodo
        const bodoTables = result.rows.filter(r => r.table_name.startsWith('bodo'));
        if (bodoTables.length > 0) {
            console.log('\nTablas de Bodo encontradas:');
            bodoTables.forEach(t => console.log('  ✓ ' + t.table_name));
        } else {
            console.log('\nNo se encontraron tablas de Bodo.');
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}

checkTables();
