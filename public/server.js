const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'bodo_studio_secret_key_2024';

// Configuración de PostgreSQL
const pool = new Pool({
    host: '18.215.154.82',
    port: 5432,
    database: 'ia_analytics',
    user: 'db_2_readwrite',
    password: '0AQRT0wGfsora3ld5udN5NhfssQbr9oZ',
    ssl: false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Verificar conexión a la base de datos
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error conectando a PostgreSQL:', err.message);
    } else {
        console.log('Conectado a PostgreSQL correctamente');
        release();
        // Crear tablas si no existen
        initDatabase();
    }
});

// Inicializar base de datos
async function initDatabase() {
    try {
        // Tabla de usuarios admin
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bodo_admin_users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nombre VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de cotizaciones/pedidos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bodo_cotizaciones (
                id SERIAL PRIMARY KEY,
                cliente_nombre VARCHAR(100),
                cliente_telefono VARCHAR(20),
                cliente_email VARCHAR(100),
                servicios JSONB,
                fecha_evento DATE,
                lugar_evento TEXT,
                notas TEXT,
                estado VARCHAR(20) DEFAULT 'pendiente',
                total DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de servicios/productos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bodo_servicios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                categoria VARCHAR(50),
                descripcion TEXT,
                precio DECIMAL(10,2),
                disponible BOOLEAN DEFAULT true,
                imagen_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de reservas de inflables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bodo_reservas_inflables (
                id SERIAL PRIMARY KEY,
                inflable_id INTEGER,
                inflable_nombre VARCHAR(100),
                fecha_reserva DATE,
                cliente_nombre VARCHAR(100),
                cliente_telefono VARCHAR(20),
                direccion TEXT,
                hora_entrega TIME,
                hora_recogida TIME,
                estado VARCHAR(20) DEFAULT 'reservado',
                notas TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear usuario admin por defecto si no existe
        const adminExists = await pool.query("SELECT * FROM bodo_admin_users WHERE username = 'admin'");
        if (adminExists.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO bodo_admin_users (username, password, nombre) VALUES ($1, $2, $3)",
                ['admin', hashedPassword, 'Administrador']
            );
            console.log('Usuario admin creado: admin / admin123');
        }

        // Insertar servicios de ejemplo si no existen
        const serviciosExist = await pool.query("SELECT COUNT(*) FROM bodo_servicios");
        if (parseInt(serviciosExist.rows[0].count) === 0) {
            const servicios = [
                ['Retratos', 'Fotografía', 'Sesión de retratos profesional', 50000, true],
                ['Bodas', 'Fotografía', 'Cobertura completa de bodas', 250000, true],
                ['Eventos', 'Fotografía', 'Fotografía de eventos sociales', 80000, true],
                ['Bebés', 'Fotografía', 'Sesión fotográfica para bebés', 45000, true],
                ['Cámara 360°', 'Extra Evento', 'Videos 360 para eventos', 60000, true],
                ['PhotoRoom', 'Extra Evento', 'Cabina de fotos instantáneas', 55000, true],
                ['Castillo Pequeño', 'Inflables', 'Inflable para niños pequeños', 35000, true],
                ['Castillo Deportivo', 'Inflables', 'Inflable con área de juegos', 45000, true],
                ['Tobogán de Agua', 'Inflables', 'Inflable acuático', 55000, true],
                ['Doble Túnel', 'Inflables', 'Inflable con doble recorrido', 50000, true],
                ['Máquina de Copos', 'Snacks', 'Máquina de raspados', 25000, true],
                ['Máquina de Palomitas', 'Snacks', 'Máquina de popcorn', 20000, true],
                ['Algodón de Azúcar', 'Snacks', 'Máquina de algodón', 22000, true]
            ];
            
            for (const s of servicios) {
                await pool.query(
                    "INSERT INTO bodo_servicios (nombre, categoria, descripcion, precio, disponible) VALUES ($1, $2, $3, $4, $5)",
                    s
                );
            }
            console.log('Servicios de ejemplo creados');
        }

        console.log('Base de datos inicializada correctamente');
    } catch (err) {
        console.error('Error inicializando base de datos:', err.message);
    }
}

// Middleware de autenticación
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// ============ RUTAS DE AUTENTICACIÓN ============

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query("SELECT * FROM bodo_admin_users WHERE username = $1", [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, nombre: user.nombre } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ RUTAS DE COTIZACIONES ============

// Obtener todas las cotizaciones
app.get('/api/cotizaciones', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM bodo_cotizaciones ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear cotización (desde el sitio web)
app.post('/api/cotizaciones', async (req, res) => {
    try {
        const { cliente_nombre, cliente_telefono, cliente_email, servicios, fecha_evento, lugar_evento, notas } = req.body;
        const result = await pool.query(
            `INSERT INTO bodo_cotizaciones (cliente_nombre, cliente_telefono, cliente_email, servicios, fecha_evento, lugar_evento, notas)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [cliente_nombre, cliente_telefono, cliente_email, JSON.stringify(servicios), fecha_evento, lugar_evento, notas]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar estado de cotización
app.put('/api/cotizaciones/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, total, notas } = req.body;
        const result = await pool.query(
            `UPDATE bodo_cotizaciones SET estado = $1, total = $2, notas = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
            [estado, total, notas, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar cotización
app.delete('/api/cotizaciones/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM bodo_cotizaciones WHERE id = $1", [id]);
        res.json({ message: 'Cotización eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ RUTAS DE SERVICIOS ============

// Obtener todos los servicios
app.get('/api/servicios', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM bodo_servicios ORDER BY categoria, nombre");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear servicio
app.post('/api/servicios', authenticateToken, async (req, res) => {
    try {
        const { nombre, categoria, descripcion, precio, disponible } = req.body;
        const result = await pool.query(
            `INSERT INTO bodo_servicios (nombre, categoria, descripcion, precio, disponible) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nombre, categoria, descripcion, precio, disponible]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar servicio
app.put('/api/servicios/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria, descripcion, precio, disponible } = req.body;
        const result = await pool.query(
            `UPDATE bodo_servicios SET nombre = $1, categoria = $2, descripcion = $3, precio = $4, disponible = $5 WHERE id = $6 RETURNING *`,
            [nombre, categoria, descripcion, precio, disponible, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar servicio
app.delete('/api/servicios/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM bodo_servicios WHERE id = $1", [id]);
        res.json({ message: 'Servicio eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ RUTAS DE RESERVAS ============

// Obtener reservas
app.get('/api/reservas', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM bodo_reservas_inflables ORDER BY fecha_reserva DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear reserva
app.post('/api/reservas', authenticateToken, async (req, res) => {
    try {
        const { inflable_nombre, fecha_reserva, cliente_nombre, cliente_telefono, direccion, hora_entrega, hora_recogida, notas } = req.body;
        const result = await pool.query(
            `INSERT INTO bodo_reservas_inflables (inflable_nombre, fecha_reserva, cliente_nombre, cliente_telefono, direccion, hora_entrega, hora_recogida, notas)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [inflable_nombre, fecha_reserva, cliente_nombre, cliente_telefono, direccion, hora_entrega, hora_recogida, notas]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar reserva
app.put('/api/reservas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, notas } = req.body;
        const result = await pool.query(
            `UPDATE bodo_reservas_inflables SET estado = $1, notas = $2 WHERE id = $3 RETURNING *`,
            [estado, notas, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ ESTADÍSTICAS ============

app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const cotizaciones = await pool.query("SELECT COUNT(*) as total, estado FROM bodo_cotizaciones GROUP BY estado");
        const servicios = await pool.query("SELECT COUNT(*) as total FROM bodo_servicios WHERE disponible = true");
        const reservasHoy = await pool.query("SELECT COUNT(*) as total FROM bodo_reservas_inflables WHERE fecha_reserva = CURRENT_DATE");
        const reservasMes = await pool.query("SELECT COUNT(*) as total FROM bodo_reservas_inflables WHERE EXTRACT(MONTH FROM fecha_reserva) = EXTRACT(MONTH FROM CURRENT_DATE)");
        
        res.json({
            cotizaciones: cotizaciones.rows,
            serviciosActivos: parseInt(servicios.rows[0].total),
            reservasHoy: parseInt(reservasHoy.rows[0].total),
            reservasMes: parseInt(reservasMes.rows[0].total)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Servir el panel de admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
    res.redirect('/admin');
});

app.listen(PORT, () => {
    console.log(`Panel Admin corriendo en http://localhost:${PORT}/admin`);
});
