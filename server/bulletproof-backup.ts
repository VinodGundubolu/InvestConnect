import * as fs from 'fs';
import * as path from 'path';

/**
 * BULLETPROOF BACKUP SYSTEM
 * Creates multiple independent backup layers that work even when JSON database fails
 */

export class BulletproofBackupSystem {
  private backupLocations = [
    // Location 1: Primary data-backups directory
    path.join(process.cwd(), 'data-backups'),
    
    // Location 2: Secondary backup location
    path.join(process.cwd(), 'backup-mirror'),
    
    // Location 3: Emergency fallback location
    path.join(process.cwd(), 'emergency-store'),
    
    // Location 4: System backup location
    path.join(process.cwd(), 'system-backups'),
    
    // Location 5: Redundant location
    path.join(process.cwd(), 'redundant-backups')
  ];

  constructor() {
    this.ensureBackupDirectories();
  }

  private ensureBackupDirectories() {
    this.backupLocations.forEach(location => {
      if (!fs.existsSync(location)) {
        fs.mkdirSync(location, { recursive: true });
      }
    });
  }

  // Create bulletproof backup across multiple locations
  async createBulletproofBackup(data: any): Promise<{
    success: boolean;
    locationsCreated: number;
    totalAttempted: number;
    errors: string[];
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bulletproof-backup-${timestamp}.json`;
    
    let successCount = 0;
    const errors: string[] = [];

    console.log('🛡️ Creating bulletproof backup across multiple locations...');

    // Create backup in all locations simultaneously
    const backupPromises = this.backupLocations.map(async (location, index) => {
      try {
        const filePath = path.join(location, filename);
        
        // Create enhanced backup with metadata
        const enhancedBackup = {
          timestamp: new Date().toISOString(),
          backupVersion: '2.0',
          backupLocation: location,
          backupIndex: index + 1,
          totalLocations: this.backupLocations.length,
          systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            processId: process.pid
          },
          dataIntegrity: {
            investorCount: data.investors?.length || 0,
            investmentCount: data.investments?.length || 0,
            transactionCount: data.transactions?.length || 0,
            checksum: this.calculateChecksum(data)
          },
          originalData: data
        };

        await fs.promises.writeFile(filePath, JSON.stringify(enhancedBackup, null, 2));
        
        // Verify the backup was written correctly
        const verifyData = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
        if (verifyData.dataIntegrity.checksum === enhancedBackup.dataIntegrity.checksum) {
          successCount++;
          console.log(`✅ Backup ${index + 1}/5 created: ${location}`);
        } else {
          throw new Error('Backup verification failed - checksum mismatch');
        }
        
      } catch (error) {
        const errorMsg = `Location ${index + 1} (${location}): ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ Backup failed: ${errorMsg}`);
      }
    });

    // Wait for all backup attempts to complete
    await Promise.allSettled(backupPromises);

    const result = {
      success: successCount > 0,
      locationsCreated: successCount,
      totalAttempted: this.backupLocations.length,
      errors
    };

    if (successCount > 0) {
      console.log(`🎯 Bulletproof backup completed: ${successCount}/${this.backupLocations.length} locations successful`);
    } else {
      console.error('❌ All backup locations failed!');
    }

    return result;
  }

  // Find and recover from any available backup location
  async findBestAvailableBackup(): Promise<{
    success: boolean;
    backupData?: any;
    source?: string;
    backupAge?: number;
    verificationPassed?: boolean;
  }> {
    console.log('🔍 Searching all backup locations for recoverable data...');

    let bestBackup: any = null;
    let bestSource = '';
    let newestTimestamp = 0;

    // Search all backup directories
    for (const location of this.backupLocations) {
      try {
        if (!fs.existsSync(location)) continue;

        const files = fs.readdirSync(location)
          .filter(f => f.includes('backup') && f.endsWith('.json'))
          .sort()
          .reverse(); // Latest first

        for (const file of files.slice(0, 3)) { // Check latest 3 files per location
          try {
            const filePath = path.join(location, file);
            const backupContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Verify backup integrity
            const isValid = this.verifyBackupIntegrity(backupContent);
            if (!isValid) continue;

            // Extract timestamp for comparison
            const backupTime = new Date(backupContent.timestamp || 0).getTime();
            
            if (backupTime > newestTimestamp) {
              newestTimestamp = backupTime;
              bestBackup = backupContent;
              bestSource = `${location}/${file}`;
            }

          } catch (fileError) {
            console.log(`⚠️ Skipping corrupted file: ${file}`);
            continue;
          }
        }

      } catch (locationError) {
        console.log(`⚠️ Could not access location: ${location}`);
        continue;
      }
    }

    if (bestBackup) {
      const backupAge = Date.now() - newestTimestamp;
      console.log(`✅ Found best backup from: ${bestSource}`);
      console.log(`📅 Backup age: ${Math.round(backupAge / 1000 / 60)} minutes old`);
      
      return {
        success: true,
        backupData: bestBackup.originalData || bestBackup,
        source: bestSource,
        backupAge: backupAge,
        verificationPassed: true
      };
    }

    console.log('❌ No valid backups found in any location');
    return { success: false };
  }

  // Verify backup integrity
  private verifyBackupIntegrity(backup: any): boolean {
    try {
      // Check required structure
      if (!backup.timestamp) return false;
      
      // If it has dataIntegrity field, verify checksum
      if (backup.dataIntegrity && backup.originalData) {
        const calculatedChecksum = this.calculateChecksum(backup.originalData);
        return calculatedChecksum === backup.dataIntegrity.checksum;
      }

      // For simple backups, just check if data exists
      if (backup.investors && Array.isArray(backup.investors)) {
        return true;
      }

      return false;
      
    } catch (error) {
      return false;
    }
  }

  // Calculate simple checksum for data integrity
  private calculateChecksum(data: any): string {
    try {
      const dataString = JSON.stringify(data, Object.keys(data).sort());
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    } catch (error) {
      return 'checksum-error';
    }
  }

  // Get backup status across all locations
  async getBackupStatus(): Promise<{
    totalLocations: number;
    accessibleLocations: number;
    totalBackups: number;
    latestBackup?: string;
    locationDetails: Array<{
      location: string;
      accessible: boolean;
      backupCount: number;
      latestFile?: string;
    }>;
  }> {
    let totalBackups = 0;
    let accessibleLocations = 0;
    let globalLatest = '';
    let globalLatestTime = 0;
    
    const locationDetails = [];

    for (const location of this.backupLocations) {
      const detail = {
        location,
        accessible: false,
        backupCount: 0,
        latestFile: undefined as string | undefined
      };

      try {
        if (fs.existsSync(location)) {
          detail.accessible = true;
          accessibleLocations++;

          const files = fs.readdirSync(location)
            .filter(f => f.includes('backup') && f.endsWith('.json'));
          
          detail.backupCount = files.length;
          totalBackups += files.length;

          if (files.length > 0) {
            const latestFile = files.sort().reverse()[0];
            detail.latestFile = latestFile;

            // Check if this is the globally latest backup
            const match = latestFile.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
            if (match) {
              const fileTime = new Date(match[1].replace(/-/g, ':').replace(/T/, 'T').replace(/Z$/, 'Z')).getTime();
              if (fileTime > globalLatestTime) {
                globalLatestTime = fileTime;
                globalLatest = `${location}/${latestFile}`;
              }
            }
          }
        }
      } catch (error) {
        // Location not accessible
      }

      locationDetails.push(detail);
    }

    return {
      totalLocations: this.backupLocations.length,
      accessibleLocations,
      totalBackups,
      latestBackup: globalLatest,
      locationDetails
    };
  }

  // Clean old backups to prevent disk space issues
  async cleanOldBackups(keepRecentCount: number = 10): Promise<void> {
    console.log(`🧹 Cleaning old backups, keeping ${keepRecentCount} most recent per location...`);

    for (const location of this.backupLocations) {
      try {
        if (!fs.existsSync(location)) continue;

        const files = fs.readdirSync(location)
          .filter(f => f.includes('backup') && f.endsWith('.json'))
          .map(f => ({
            name: f,
            path: path.join(location, f),
            time: fs.statSync(path.join(location, f)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time); // Newest first

        // Keep only the most recent files
        const filesToDelete = files.slice(keepRecentCount);
        
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
        }

        if (filesToDelete.length > 0) {
          console.log(`🗑️ Cleaned ${filesToDelete.length} old backups from ${location}`);
        }

      } catch (error) {
        console.log(`⚠️ Could not clean location ${location}: ${error.message}`);
      }
    }
  }
}

export const bulletproofBackup = new BulletproofBackupSystem();