import * as fs from 'fs';
import * as path from 'path';

/**
 * ULTIMATE DISASTER RECOVERY SYSTEM
 * Handles complete JSON backup failure scenarios
 */

// Multiple recovery data sources (no hardcoded data)
const RECOVERY_SOURCES = {
  // Alternative backup locations
  backupPaths: [
    path.join(process.cwd(), 'data-backups'),
    path.join(process.cwd(), 'permanent-backups'),
    path.join(process.cwd(), 'emergency-backups'),
    path.join(process.cwd(), 'disaster-recovery'),
  ],

  // Source 3: Recovery from logs (if available)
  logPatterns: [
    /📊 Backed up: (\d+) investors/,
    /Restored (\d+) investors/,
    /Total investments of ₹([\d.]+) Lakhs/
  ]
};

export class UltimateRecoverySystem {
  
  async executeEmergencyRecovery(): Promise<{
    success: boolean;
    dataSource: string;
    investorsRecovered: number;
    recoveryMethod: string;
    data?: any;
  }> {
    
    console.log('🚨 EXECUTING ULTIMATE DISASTER RECOVERY...');
    
    // RECOVERY ATTEMPT 1: Try all backup directories
    const backupRecovery = await this.tryBackupDirectories();
    if (backupRecovery.success) {
      return backupRecovery;
    }

    // RECOVERY ATTEMPT 2: Try memory snapshots
    const memoryRecovery = await this.tryMemoryRecovery();
    if (memoryRecovery.success) {
      return memoryRecovery;
    }

    // RECOVERY ATTEMPT 3: Try log file analysis
    const logRecovery = await this.tryLogFileRecovery();
    if (logRecovery.success) {
      return logRecovery;
    }

    // RECOVERY ATTEMPT 4: Start with empty system (no hardcoded data)
    const emptyRecovery = await this.startEmpty();
    return emptyRecovery;
  }

  private async tryBackupDirectories(): Promise<any> {
    console.log('🔍 Searching all possible backup locations...');
    
    // First try bulletproof backup system
    try {
      const { bulletproofBackup } = await import('./bulletproof-backup');
      const bulletproofResult = await bulletproofBackup.findBestAvailableBackup();
      
      if (bulletproofResult.success && bulletproofResult.backupData) {
        console.log(`🛡️ Found bulletproof backup from: ${bulletproofResult.source}`);
        console.log(`📅 Backup age: ${Math.round((bulletproofResult.backupAge || 0) / 1000 / 60)} minutes`);
        
        return {
          success: true,
          dataSource: bulletproofResult.source,
          investorsRecovered: bulletproofResult.backupData.investors?.length || 0,
          recoveryMethod: 'BULLETPROOF_BACKUP_RECOVERY',
          data: bulletproofResult.backupData
        };
      }
    } catch (error) {
      console.log(`❌ Bulletproof backup failed: ${error.message}`);
    }
    
    // Fallback to regular backup search
    for (const backupPath of RECOVERY_SOURCES.backupPaths) {
      try {
        if (!fs.existsSync(backupPath)) continue;
        
        const files = fs.readdirSync(backupPath)
          .filter(f => f.includes('backup') && f.endsWith('.json'))
          .sort()
          .reverse(); // Latest first

        if (files.length > 0) {
          const latestBackup = path.join(backupPath, files[0]);
          const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));
          
          console.log(`✅ Found backup in ${backupPath}: ${files[0]}`);
          return {
            success: true,
            dataSource: latestBackup,
            investorsRecovered: backupData.investors?.length || 0,
            recoveryMethod: 'REGULAR_BACKUP_RECOVERY',
            data: backupData
          };
        }
      } catch (error) {
        console.log(`❌ Backup directory ${backupPath} failed: ${error.message}`);
        continue;
      }
    }

    return { success: false, recoveryMethod: 'ALL_BACKUP_SEARCHES_FAILED' };
  }

  private async tryMemoryRecovery(): Promise<any> {
    console.log('🧠 Attempting in-memory data recovery...');
    
    try {
      // Try to access current storage if still in memory
      const { storage } = await import('./storage');
      
      if (storage.investors && storage.investors.size > 0) {
        const investors = Array.from(storage.investors.values());
        console.log(`✅ Recovered ${investors.length} investors from memory`);
        
        return {
          success: true,
          dataSource: 'IN_MEMORY_STORAGE',
          investorsRecovered: investors.length,
          recoveryMethod: 'MEMORY_RECOVERY',
          data: { investors }
        };
      }
    } catch (error) {
      console.log(`❌ Memory recovery failed: ${error.message}`);
    }

    return { success: false, recoveryMethod: 'MEMORY_RECOVERY_FAILED' };
  }

  private async tryLogFileRecovery(): Promise<any> {
    console.log('📋 Analyzing log files for data patterns...');
    
    try {
      // Look for log files that might contain backup information
      const logFiles = [
        path.join(process.cwd(), 'app.log'),
        path.join(process.cwd(), 'server.log'),
        path.join(process.cwd(), 'backup.log')
      ];

      for (const logFile of logFiles) {
        if (fs.existsSync(logFile)) {
          const logContent = fs.readFileSync(logFile, 'utf8');
          
          // Extract data from logs using patterns
          const investorMatch = logContent.match(/📊 Backed up: (\d+) investors/);
          const valueMatch = logContent.match(/Total investments of ₹([\d.]+) Lakhs/);
          
          if (investorMatch && valueMatch) {
            console.log(`✅ Found data in logs: ${investorMatch[1]} investors, ₹${valueMatch[1]} Lakhs`);
            
            // Found data traces in logs but no hardcoded fallback available
            console.log(`📋 Found traces of ${investorMatch[1]} investors in logs`);
            console.log(`⚠️ Cannot restore actual data without backup files`);
            
            return { 
              success: false, 
              recoveryMethod: 'LOG_TRACES_FOUND_BUT_NO_DATA',
              note: `Found evidence of ${investorMatch[1]} investors but no actual data to restore`
            };
          }
        }
      }
    } catch (error) {
      console.log(`❌ Log file recovery failed: ${error.message}`);
    }

    return { success: false, recoveryMethod: 'LOG_RECOVERY_FAILED' };
  }

  private async startEmpty(): Promise<any> {
    console.log('🆕 Starting with empty system - no hardcoded data fallback');
    console.log('✅ System ready for you to add investors dynamically');
    
    return {
      success: true,
      dataSource: 'EMPTY_SYSTEM_START',
      investorsRecovered: 0,
      recoveryMethod: 'CLEAN_START_NO_HARDCODE',
      data: { 
        investors: [],
        investments: [],
        transactions: [],
        isEmpty: true,
        note: 'Fresh start - add your investors through the admin portal'
      }
    };
  }

  // Create multiple backup formats for redundancy
  async createRedundantBackups(data: any): Promise<void> {
    console.log('🔐 Creating redundant emergency backups...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Format 1: JSON backup (main format)
    const jsonBackup = path.join(process.cwd(), 'emergency-backups', `emergency-${timestamp}.json`);
    
    // Format 2: Text-based backup (human readable)
    const textBackup = path.join(process.cwd(), 'emergency-backups', `emergency-${timestamp}.txt`);
    
    // Format 3: CSV backup (Excel compatible)
    const csvBackup = path.join(process.cwd(), 'emergency-backups', `emergency-${timestamp}.csv`);

    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(jsonBackup), { recursive: true });

      // JSON format
      fs.writeFileSync(jsonBackup, JSON.stringify(data, null, 2));

      // Text format
      let textContent = `EMERGENCY BACKUP - ${new Date().toISOString()}\n`;
      textContent += `Total Investors: ${data.investors?.length || 0}\n\n`;
      
      if (data.investors) {
        data.investors.forEach((inv: any, index: number) => {
          textContent += `${index + 1}. ${inv.firstName} ${inv.lastName}\n`;
          textContent += `   Email: ${inv.email}\n`;
          textContent += `   Mobile: ${inv.mobile}\n`;
          textContent += `   Investment: ₹${(parseInt(inv.investment) / 100000).toFixed(2)} Lakhs\n\n`;
        });
      }
      fs.writeFileSync(textBackup, textContent);

      // CSV format
      if (data.investors) {
        let csvContent = 'ID,FirstName,LastName,Email,Mobile,Investment\n';
        data.investors.forEach((inv: any) => {
          csvContent += `${inv.investorId},"${inv.firstName}","${inv.lastName}","${inv.email}","${inv.mobile}",${inv.investment}\n`;
        });
        fs.writeFileSync(csvBackup, csvContent);
      }

      console.log('✅ Created redundant backups in 3 formats (JSON, TXT, CSV)');
      
    } catch (error) {
      console.error('❌ Failed to create redundant backups:', error);
    }
  }
}

export const ultimateRecovery = new UltimateRecoverySystem();