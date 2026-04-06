#!/usr/bin/env node
// ============================================================
// Script tạo icons cho VibeTok PWA (ES Module Version)
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Polyfill cho __dirname trong ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo 'require' để hỗ trợ cài đặt dynamic nếu cần
const require = createRequire(import.meta.url);

const SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a1e"/>
      <stop offset="100%" style="stop-color:#0a0a0f"/>
    </linearGradient>
    <linearGradient id="vGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff2d78"/>
      <stop offset="100%" style="stop-color:#ff6b35"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#ff2d7815" stroke-width="1"/>
  <text 
    x="256" 
    y="340" 
    font-family="Georgia, serif" 
    font-size="300" 
    font-weight="900"
    text-anchor="middle" 
    fill="url(#vGrad)"
    letter-spacing="-10"
  >V</text>
  <circle cx="380" cy="160" r="18" fill="#ff2d78" opacity="0.8"/>
</svg>`;

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('⚠️ sharp chưa được cài. Đang cài...');
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
    sharp = (await import('sharp')).default;
  }

  const iconsDir = path.join(__dirname, 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('📁 Tạo thư mục public/icons');
  }

  const svgBuffer = Buffer.from(SVG_ICON);

  for (const size of SIZES) {
    const outputPath = path.join(iconsDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✅ Tạo icon-${size}.png`);
  }

  console.log('\n🎉 Tạo xong tất cả icons!');
  console.log('📂 Icons nằm trong: frontend/public/icons/');
}

generateIcons().catch(console.error);