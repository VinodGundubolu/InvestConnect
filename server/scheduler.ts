import { sendMonthlyReportsToAllInvestors } from './emailService';

class EmailScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('Email scheduler is already running');
      return;
    }

    console.log('Starting email scheduler...');
    this.isRunning = true;

    // Run monthly reports on the 1st day of each month at 9:00 AM
    this.scheduleMonthlyReports();
    
    // Check every hour if it's time to send monthly reports
    this.intervalId = setInterval(() => {
      this.checkAndSendMonthlyReports();
    }, 60 * 60 * 1000); // Check every hour
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Email scheduler stopped');
  }

  private scheduleMonthlyReports() {
    // Check if today is the 1st of the month and it's 9 AM
    const now = new Date();
    const isFirstOfMonth = now.getDate() === 1;
    const isNineAM = now.getHours() === 9 && now.getMinutes() < 5; // 5 minute window
    
    if (isFirstOfMonth && isNineAM) {
      console.log('Triggering monthly reports for all investors...');
      this.sendMonthlyReportsToAll();
    }
  }

  private checkAndSendMonthlyReports() {
    const now = new Date();
    
    // Check if it's the 1st day of the month and between 9:00-9:05 AM
    if (now.getDate() === 1 && now.getHours() === 9 && now.getMinutes() < 5) {
      console.log('Monthly report time detected, sending reports...');
      this.sendMonthlyReportsToAll();
    }
  }

  private async sendMonthlyReportsToAll() {
    try {
      console.log('Starting monthly report generation for all investors...');
      const results = await sendMonthlyReportsToAllInvestors();
      console.log(`Monthly reports completed: ${results.sent} sent, ${results.failed} failed`);
    } catch (error) {
      console.error('Error in scheduled monthly reports:', error);
    }
  }

  // Manual trigger for testing purposes
  async triggerMonthlyReports() {
    console.log('Manually triggering monthly reports...');
    await this.sendMonthlyReportsToAll();
  }

  // Test function to send reports immediately (for development)
  async testMonthlyReports() {
    console.log('Test: Sending monthly reports to all investors...');
    await this.sendMonthlyReportsToAll();
  }
}

export const emailScheduler = new EmailScheduler();

// Auto-start the scheduler
export function initializeEmailScheduler() {
  emailScheduler.start();
  console.log('Email scheduler initialized and started');
}