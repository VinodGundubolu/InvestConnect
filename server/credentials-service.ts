import { db } from "./db";
import { investorCredentials } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import type { InvestorCredentials, InsertInvestorCredentials } from "@shared/schema";

export class CredentialsService {
  // Create or update investor credentials
  async upsertCredentials(credentialsData: InsertInvestorCredentials): Promise<InvestorCredentials> {
    const existing = await this.getCredentialsByInvestorId(credentialsData.investorId);
    
    if (existing) {
      // Update existing credentials
      const [updated] = await db
        .update(investorCredentials)
        .set({
          ...credentialsData,
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(investorCredentials.investorId, credentialsData.investorId))
        .returning();
      return updated;
    } else {
      // Create new credentials
      const [created] = await db
        .insert(investorCredentials)
        .values(credentialsData)
        .returning();
      return created;
    }
  }

  // Get credentials by any identifier (username, email, phone, investor ID)
  async getCredentialsByIdentifier(identifier: string): Promise<InvestorCredentials | undefined> {
    const [credentials] = await db
      .select()
      .from(investorCredentials)
      .where(
        or(
          eq(investorCredentials.username, identifier),
          eq(investorCredentials.email, identifier),
          eq(investorCredentials.phone, identifier),
          eq(investorCredentials.investorId, identifier)
        )
      )
      .limit(1);
    
    return credentials || undefined;
  }

  // Get credentials by investor ID
  async getCredentialsByInvestorId(investorId: string): Promise<InvestorCredentials | undefined> {
    const [credentials] = await db
      .select()
      .from(investorCredentials)
      .where(eq(investorCredentials.investorId, investorId))
      .limit(1);
    
    return credentials || undefined;
  }

  // Validate login credentials
  async validateCredentials(identifier: string, password: string): Promise<InvestorCredentials | null> {
    const credentials = await this.getCredentialsByIdentifier(identifier);
    
    if (!credentials || !credentials.isActive) {
      return null;
    }

    if (credentials.password === password) {
      // Update last login time
      await db
        .update(investorCredentials)
        .set({ lastLoginAt: new Date() })
        .where(eq(investorCredentials.id, credentials.id));
      
      return credentials;
    }

    return null;
  }

  // Update password
  async updatePassword(investorId: string, newPassword: string): Promise<boolean> {
    const result = await db
      .update(investorCredentials)
      .set({ 
        password: newPassword, 
        passwordChangedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(investorCredentials.investorId, investorId));
    
    return (result.rowCount ?? 0) > 0;
  }

  // Get all credentials (for debugging)
  async getAllCredentials(): Promise<InvestorCredentials[]> {
    return await db.select().from(investorCredentials);
  }

  // Deactivate credentials
  async deactivateCredentials(investorId: string): Promise<boolean> {
    const result = await db
      .update(investorCredentials)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(investorCredentials.investorId, investorId));
    
    return (result.rowCount ?? 0) > 0;
  }

  // Activate credentials
  async activateCredentials(investorId: string): Promise<boolean> {
    const result = await db
      .update(investorCredentials)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(investorCredentials.investorId, investorId));
    
    return (result.rowCount ?? 0) > 0;
  }

  // Initialize database with existing test credentials
  async initializeTestCredentials(): Promise<void> {
    const testCredentials = [
      {
        investorId: "1",
        username: "nd_kumar",
        password: "ND2025",
        email: "nd.kumar@example.com",
        phone: "+91 99887 76655",
      },
      {
        investorId: "2", 
        username: "suresh_kumar",
        password: "SU2025",
        email: "suresh.kumar@example.com",
        phone: "+91 98765 43210",
      },
      {
        investorId: "3",
        username: "suri_kumar", 
        password: "SU2025",
        email: "suri.kumar@example.com",
        phone: "+91 98765 43210",
      },
      {
        investorId: "4",
        username: "sid_vid",
        password: "SI2025", 
        email: "sid@test.com",
        phone: "9876543210",
      },
      {
        investorId: "211",
        username: "vinodh_durga",
        password: "VI2025",
        email: "test1@gmail.com",
        phone: "",
      },
    ];

    for (const creds of testCredentials) {
      try {
        await this.upsertCredentials(creds);
        console.log(`✓ Initialized credentials for ${creds.username}`);
      } catch (error) {
        console.error(`❌ Failed to initialize credentials for ${creds.username}:`, error);
      }
    }
  }
}

// Export singleton instance
export const credentialsService = new CredentialsService();