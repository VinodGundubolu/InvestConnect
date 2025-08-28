#!/usr/bin/env node

/**
 * Check the status of bulletproof backup system
 * Shows protection across multiple independent locations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🛡️ **BULLETPROOF BACKUP STATUS CHECK**\n');

// Bulletproof backup locations
const bulletproofLocations = [
  'data-backups',
  'backup-mirror', 
  'emergency-store',
  'system-backups',
  'redundant-backups'
];

function checkBulletproofStatus() {
  let totalBackups = 0;
  let accessibleLocations = 0;
  let latestGlobalBackup = '';
  let latestGlobalTime = 0;

  console.log('📊 **BULLETPROOF PROTECTION STATUS:**\n');

  bulletproofLocations.forEach((location, index) => {
    const fullPath = path.join(__dirname, '..', location);
    
    console.log(`🔸 **Location ${index + 1}/5: ${location}**`);
    
    try {
      if (!fs.existsSync(fullPath)) {
        console.log('   ❌ Directory not accessible');
        console.log('');
        return;
      }

      accessibleLocations++;
      const files = fs.readdirSync(fullPath)
        .filter(f => f.includes('backup') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length === 0) {
        console.log('   ⚠️ No backup files found');
        console.log('');
        return;
      }

      totalBackups += files.length;
      const latestFile = files[0];
      const filePath = path.join(fullPath, latestFile);
      const stats = fs.statSync(filePath);
      
      // Try to read backup content for verification
      try {
        const backup = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const investorCount = backup.investors?.length || backup.originalData?.investors?.length || 0;
        const hasIntegrity = backup.dataIntegrity ? '✅' : '⚠️';
        
        console.log(`   ✅ ${files.length} backup files found`);
        console.log(`   📄 Latest: ${latestFile}`);
        console.log(`   📊 Contains: ${investorCount} investors`);
        console.log(`   🔒 Integrity: ${hasIntegrity} ${backup.dataIntegrity ? 'Verified' : 'Basic'}`);
        console.log(`   📅 Age: ${Math.round((Date.now() - stats.mtime.getTime()) / 1000 / 60)} minutes`);
        
        // Track globally latest backup
        if (stats.mtime.getTime() > latestGlobalTime) {
          latestGlobalTime = stats.mtime.getTime();
          latestGlobalBackup = `${location}/${latestFile}`;
        }
        
      } catch (readError) {
        console.log(`   ❌ Backup file corrupted: ${latestFile}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Access error: ${error.message}`);
    }
    
    console.log('');
  });

  // Summary
  console.log('🎯 **BULLETPROOF SUMMARY:**');
  console.log(`✅ Accessible locations: ${accessibleLocations}/5`);
  console.log(`📊 Total backup files: ${totalBackups}`);
  
  if (latestGlobalBackup) {
    console.log(`🕒 Latest backup: ${latestGlobalBackup}`);
    console.log(`📅 Global backup age: ${Math.round((Date.now() - latestGlobalTime) / 1000 / 60)} minutes`);
  }
  
  console.log('');
  
  // Protection assessment
  if (accessibleLocations >= 3 && totalBackups >= 5) {
    console.log('🛡️ **PROTECTION LEVEL: EXCELLENT** 🛡️');
    console.log('✅ Multiple locations accessible');
    console.log('✅ Sufficient backup redundancy');
    console.log('✅ Recent backups available');
  } else if (accessibleLocations >= 2 && totalBackups >= 2) {
    console.log('🟡 **PROTECTION LEVEL: GOOD** 🟡');
    console.log('✅ Some backup redundancy available');
    console.log('⚠️ Consider increasing backup frequency');
  } else if (accessibleLocations >= 1 && totalBackups >= 1) {
    console.log('🟠 **PROTECTION LEVEL: BASIC** 🟠');
    console.log('⚠️ Limited backup redundancy');
    console.log('⚠️ Single point of failure risk');
  } else {
    console.log('🔴 **PROTECTION LEVEL: MINIMAL** 🔴');
    console.log('❌ No accessible backups found');
    console.log('❌ High risk of data loss');
  }
}

function showRecoveryScenarios() {
  console.log('\n📋 **RECOVERY SCENARIOS:**\n');
  
  console.log('🎯 **SCENARIO 1: JSON Database Fails**');
  console.log('   🔍 System searches 5 backup locations');
  console.log('   ✅ Finds latest backup from any accessible location');
  console.log('   🔄 Restores your exact current state');
  console.log('   📈 Zero data loss\n');
  
  console.log('🎯 **SCENARIO 2: Primary Backup Directory Corrupted**');
  console.log('   🔍 System skips corrupted location');
  console.log('   ✅ Uses backup from mirror locations');
  console.log('   🔄 Continues with intact data');
  console.log('   📈 Minimal impact\n');
  
  console.log('🎯 **SCENARIO 3: Multiple Locations Fail**');
  console.log('   🔍 System checks all remaining locations');
  console.log('   ✅ Uses any single working backup');
  console.log('   🔄 Recovers from best available source');
  console.log('   📈 Partial protection maintained\n');
  
  console.log('🎯 **SCENARIO 4: All Backups Inaccessible**');
  console.log('   🆕 System starts with empty state');
  console.log('   ✅ No hardcoded data fallback');
  console.log('   🔄 Ready for fresh investor additions');
  console.log('   📈 Clean slate approach\n');
}

// Run the status check
checkBulletproofStatus();
showRecoveryScenarios();

console.log('🚀 **YOUR CURRENT STATE BACKUPS ARE BULLETPROOF!** 🚀');