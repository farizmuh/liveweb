// Entry point for cPanel Node.js (Phusion Passenger)
// Passenger menggunakan file ini sebagai startup file.

// Pastikan environment variables tersedia
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env sebelum import apapun
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import dan jalankan server
import('./dist/index.js');
