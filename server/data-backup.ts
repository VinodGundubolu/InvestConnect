import { storage } from "./storage";
import * as fs from 'fs';
import * as path from 'path';

export interface DataBackup {
  timestamp: string;
  investors: any[];
  investments: any[];
  transactions: any[];
  investmentPlans: any[];
  agreements: any[];
  credentials: any[]; // Add credentials to backup schema
  metadata: {
    totalInvestors: number;
    totalInvestments: string;
    backupVersion: string;
  };
}

export class DataBackupManager {
  private backupDir = path.join(process.cwd(), 'data-backups');

  constructor() {
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Create full backup of all system data
  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString();
      
      const investors = await storage.getAllInvestors();
      const investments = await storage.getAllInvestments();
      const transactions = await storage.getAllTransactions();
      const investmentPlans = await storage.getAllInvestmentPlans();
      
      // Get agreements for all investors
      const agreements = [];
      for (const investor of investors) {
        const investorAgreements = await storage.getInvestmentAgreementsByInvestor(investor.id);
        agreements.push(...investorAgreements);
      }

      const totalInvestment = investments.reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);

      // Generate credentials for all investors
      const credentials = [];
      for (const investor of investors) {
        const username = `${investor.firstName.toLowerCase().trim()}_${investor.lastName.toLowerCase().trim()}`;
        const password = `${investor.firstName.toUpperCase().substring(0, 2)}${new Date().getFullYear()}`;
        credentials.push({
          username,
          password,
          investorId: investor.id,
          email: investor.email,
          phone: investor.primaryMobile
        });
      }

      const backup: DataBackup = {
        timestamp,
        investors,
        investments,
        transactions,
        investmentPlans,
        agreements,
        credentials,
        metadata: {
          totalInvestors: investors.length,
          totalInvestments: totalInvestment.toString(),
          backupVersion: "1.0.0"
        }
      };

      const filename = `backup-${timestamp.replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(this.backupDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
      
      console.log(`✅ Data backup created: ${filename}`);
      console.log(`📊 Backed up: ${backup.metadata.totalInvestors} investors, ${investments.length} investments, ${transactions.length} transactions`);
      
      return filepath;
    } catch (error) {
      console.error("❌ Backup creation failed:", error);
      throw error;
    }
  }

  // Auto-backup whenever data changes (real-time)
  async autoBackupOnChange(): Promise<void> {
    try {
      await this.createBackup();
      console.log("📋 Auto-backup completed after data change");
    } catch (error) {
      console.error("❌ Auto-backup failed:", error);
    }
  }

  // Restore data from backup file
  async restoreFromBackup(backupFilePath?: string): Promise<boolean> {
    try {
      let filepath = backupFilePath;
      
      if (!filepath) {
        // Find the latest backup
        const files = fs.readdirSync(this.backupDir)
          .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
          .sort()
          .reverse();
        
        if (files.length === 0) {
          console.log("⚠️  No backup files found");
          return false;
        }
        
        filepath = path.join(this.backupDir, files[0]);
      }

      if (!fs.existsSync(filepath)) {
        console.log(`⚠️  Backup file not found: ${filepath}`);
        return false;
      }

      const backupData: DataBackup = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      console.log(`🔄 Restoring backup from ${backupData.timestamp}...`);
      console.log(`📊 Restoring: ${backupData.metadata.totalInvestors} investors, ${backupData.investments.length} investments`);

      // Restore investment plans first
      for (const plan of backupData.investmentPlans) {
        await storage.createInvestmentPlan(plan);
      }

      // Restore investors
      for (const investor of backupData.investors) {
        await storage.createInvestor(investor);
      }

      // Restore investments
      for (const investment of backupData.investments) {
        await storage.createInvestment(investment);
      }

      // Restore transactions
      for (const transaction of backupData.transactions) {
        await storage.createTransaction(transaction);
      }

      // Restore agreements
      for (const agreement of backupData.agreements) {
        await storage.createInvestmentAgreement(agreement);
      }

      // Restore or regenerate credentials
      if (backupData.credentials && backupData.credentials.length > 0) {
        // Restore existing credentials from backup
        for (const cred of backupData.credentials) {
          await storage.storeCredentials(cred.username, cred.password, cred.investorId, cred.email, cred.phone);
        }
        console.log(`🔐 Restored ${backupData.credentials.length} investor credentials`);
      } else {
        // Generate credentials for all investors (fallback for old backups)
        for (const investor of backupData.investors) {
          const username = `${investor.firstName.toLowerCase().trim()}_${investor.lastName.toLowerCase().trim()}`;
          const password = `${investor.firstName.toUpperCase().substring(0, 2)}${new Date().getFullYear()}`;
          await storage.storeCredentials(username, password, investor.id, investor.email, investor.primaryMobile);
        }
        console.log(`🔐 Generated credentials for ${backupData.investors.length} investors`);
      }

      console.log(`✅ Data restoration completed successfully`);
      console.log(`📈 Restored ${backupData.metadata.totalInvestors} investors with total investments of ₹${(parseFloat(backupData.metadata.totalInvestments) / 100000).toFixed(2)} Lakhs`);
      
      return true;
    } catch (error) {
      console.error("❌ Data restoration failed:", error);
      return false;
    }
  }

  // Get list of available backups
  getAvailableBackups(): Array<{filename: string, timestamp: string, size: string}> {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .map(filename => {
          const filepath = path.join(this.backupDir, filename);
          const stats = fs.statSync(filepath);
          const timestamp = filename.replace('backup-', '').replace('.json', '').replace(/-/g, ':').replace(/T/, ' ');
          
          return {
            filename,
            timestamp,
            size: `${(stats.size / 1024).toFixed(2)} KB`
          };
        })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      return files;
    } catch (error) {
      console.error("Error reading backup directory:", error);
      return [];
    }
  }

  // Auto-backup on schedule
  async scheduleAutoBackup(intervalMinutes: number = 60) {
    // Create initial backup
    await this.createBackup();
    
    // Schedule regular backups
    setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error("Scheduled backup failed:", error);
      }
    }, intervalMinutes * 60 * 1000);
    
    console.log(`🕒 Auto-backup scheduled every ${intervalMinutes} minutes`);
  }
}

export const dataBackupManager = new DataBackupManager();