import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = join(__dirname, '../public');
const targetDir = join(__dirname, '../../public_html/newsite');

// Copy main .htaccess
const mainHtaccess = join(sourceDir, '.htaccess');
const targetMainHtaccess = join(targetDir, '.htaccess');

if (existsSync(mainHtaccess)) {
  copyFileSync(mainHtaccess, targetMainHtaccess);
  console.log('✅ Copied .htaccess to', targetMainHtaccess);
} else {
  console.warn('⚠️  Source .htaccess not found:', mainHtaccess);
}

// Copy API .htaccess
const apiHtaccess = join(sourceDir, 'api/.htaccess');
const targetApiDir = join(targetDir, 'api');
const targetApiHtaccess = join(targetApiDir, '.htaccess');

if (existsSync(apiHtaccess)) {
  // Ensure target directory exists
  if (!existsSync(targetApiDir)) {
    mkdirSync(targetApiDir, { recursive: true });
  }
  copyFileSync(apiHtaccess, targetApiHtaccess);
  console.log('✅ Copied api/.htaccess to', targetApiHtaccess);
} else {
  console.warn('⚠️  Source api/.htaccess not found:', apiHtaccess);
}

console.log('✅ .htaccess files copied successfully!');

