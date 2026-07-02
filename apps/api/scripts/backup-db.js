// Backup database menggunakan pg_dump via Node.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Baca DATABASE_URL dari .env
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('DATABASE_URL tidak ditemukan di .env');
    process.exit(1);
}

// Parse DATABASE_URL
// Format: postgresql://user:password@host:port/database
const url = new URL(databaseUrl);
const user = url.username;
const password = url.password;
const host = url.hostname;
const port = url.port || '5432';
const database = url.pathname.slice(1); // Remove leading /

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupDir = path.join(__dirname, '..', 'backups');
const backupFile = path.join(backupDir, `backup_${timestamp}.dump`);

// Buat folder backups jika belum ada
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

console.log('🔄 Memulai backup database...');
console.log(`📁 Database: ${database}`);
console.log(`💾 File: ${backupFile}`);

try {
    // Set PGPASSWORD environment variable
    const env = { ...process.env, PGPASSWORD: password };

    // Jalankan pg_dump
    execSync(
        `pg_dump -U ${user} -h ${host} -p ${port} -Fc ${database} > "${backupFile}"`,
        { env, stdio: 'inherit', shell: true }
    );

    console.log('✅ Backup berhasil!');
    console.log(`📦 File: ${backupFile}`);

    // Tampilkan ukuran file
    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Ukuran: ${fileSizeMB} MB`);

} catch (error) {
    console.error('❌ Backup gagal:', error.message);
    process.exit(1);
}
