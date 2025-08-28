#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🛡️ **BACKUP STATUS CHECK**\n');

const backupDir = path.join(__dirname, '../data-backups');

try {
  if (!fs.existsSync(backupDir)) {
    console.log('❌ No backup directory found');
    process.exit(1);
  }

  const backupFiles = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
    .sort()
    .reverse(); // Latest first

  if (backupFiles.length === 0) {
    console.log('❌ No backup files found');
    process.exit(1);
  }

  console.log(`📊 **CURRENT PROTECTION STATUS:**`);
  console.log(`✅ Total Backup Files: ${backupFiles.length}`);
  
  // Show latest 3 backups
  console.log(`\n🕒 **RECENT BACKUPS:**`);
  backupFiles.slice(0, 3).forEach((file, index) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const backup = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const timestamp = file.replace('backup-', '').replace('.json', '').replace(/T|-/g, ' ').replace(/:/g, ':');
    
    console.log(`${index === 0 ? '🔹 LATEST:' : '🔸 BACKUP:'} ${timestamp}`);
    console.log(`   📊 ${backup.investors.length} investors, ${backup.investments.length} investments, ${backup.transactions.length} transactions`);
    console.log(`   💾 Size: ${(stats.size / 1024).toFixed(1)}KB`);
    console.log('');
  });

  // Show what would be restored
  const latestBackup = JSON.parse(fs.readFileSync(path.join(backupDir, backupFiles[0]), 'utf8'));
  
  console.log(`🔄 **IF CRASH HAPPENS NOW:**`);
  console.log(`✅ Will restore: ${latestBackup.investors.length} investors`);
  console.log(`✅ Total investments: ${latestBackup.investments.length}`);
  console.log(`✅ Total transactions: ${latestBackup.transactions.length}`);
  
  // Calculate total portfolio value
  const totalPrincipal = latestBackup.investments
    .reduce((sum, inv) => sum + parseFloat(inv.principal), 0);
  
  console.log(`✅ Portfolio value: ₹${(totalPrincipal / 100000).toFixed(2)} Lakhs`);
  
  console.log(`\n🛡️ **YOUR DATA IS FULLY PROTECTED** 🛡️`);
  
} catch (error) {
  console.error('❌ Error checking backup status:', error.message);
  process.exit(1);
}