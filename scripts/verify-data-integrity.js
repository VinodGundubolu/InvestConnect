// Investment Relationship Management - Data Integrity Verification Script
// This script verifies all critical data is intact after system restarts or recovery

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';

// Database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Helper function for colored output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Critical data thresholds
const CRITICAL_THRESHOLDS = {
  MIN_INVESTORS: 40,          // Should have at least 40 investors
  MIN_AGREEMENTS: 1,          // Should have at least 1 agreement
  MIN_CREDENTIALS: 80,        // Should have at least 80 credential pairs
  MIN_TRANSACTIONS: 0,        // Minimum transaction count
  MIN_INVESTMENT_PLANS: 1     // Should have at least 1 investment plan
};

// Data integrity verification functions
async function verifyInvestors() {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM investors WHERE email IS NOT NULL`;
    const count = parseInt(result[0].count);
    
    if (count >= CRITICAL_THRESHOLDS.MIN_INVESTORS) {
      log(`✅ Investors: ${count} records (HEALTHY)`, 'green');
      return { status: 'PASS', count, message: 'Investor data intact' };
    } else {
      log(`❌ Investors: ${count} records (CRITICAL - Below threshold)`, 'red');
      return { status: 'FAIL', count, message: 'Investor count below critical threshold' };
    }
  } catch (error) {
    log(`❌ Investors: Database error - ${error.message}`, 'red');
    return { status: 'ERROR', count: 0, message: error.message };
  }
}

async function verifyInvestmentAgreements() {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM investment_agreements WHERE content IS NOT NULL`;
    const count = parseInt(result[0].count);
    
    if (count >= CRITICAL_THRESHOLDS.MIN_AGREEMENTS) {
      log(`✅ Investment Agreements: ${count} records (HEALTHY)`, 'green');
      return { status: 'PASS', count, message: 'Agreement data intact' };
    } else {
      log(`⚠️ Investment Agreements: ${count} records (WARNING)`, 'yellow');
      return { status: 'WARN', count, message: 'Low agreement count - may be expected for new system' };
    }
  } catch (error) {
    log(`❌ Investment Agreements: Database error - ${error.message}`, 'red');
    return { status: 'ERROR', count: 0, message: error.message };
  }
}

async function verifyCredentials() {
  try {
    const result = await sql`SELECT COUNT(DISTINCT investor_id) as count FROM investor_credentials`;
    const count = parseInt(result[0].count);
    
    if (count >= CRITICAL_THRESHOLDS.MIN_CREDENTIALS) {
      log(`✅ Login Credentials: ${count} unique investors (HEALTHY)`, 'green');
      return { status: 'PASS', count, message: 'Authentication system intact' };
    } else {
      log(`❌ Login Credentials: ${count} unique investors (CRITICAL)`, 'red');
      return { status: 'FAIL', count, message: 'Credential count below critical threshold' };
    }
  } catch (error) {
    log(`❌ Login Credentials: Database error - ${error.message}`, 'red');
    return { status: 'ERROR', count: 0, message: error.message };
  }
}

async function verifyTransactions() {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM transactions WHERE amount > 0`;
    const count = parseInt(result[0].count);
    
    log(`✅ Transactions: ${count} records (HEALTHY)`, 'green');
    return { status: 'PASS', count, message: 'Transaction data intact' };
  } catch (error) {
    log(`❌ Transactions: Database error - ${error.message}`, 'red');
    return { status: 'ERROR', count: 0, message: error.message };
  }
}

async function verifyInvestmentPlans() {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM investment_plans`;
    const count = parseInt(result[0].count);
    
    if (count >= CRITICAL_THRESHOLDS.MIN_INVESTMENT_PLANS) {
      log(`✅ Investment Plans: ${count} records (HEALTHY)`, 'green');
      return { status: 'PASS', count, message: 'Investment plans available' };
    } else {
      log(`❌ Investment Plans: ${count} records (CRITICAL)`, 'red');
      return { status: 'FAIL', count, message: 'No investment plans available' };
    }
  } catch (error) {
    log(`❌ Investment Plans: Database error - ${error.message}`, 'red');
    return { status: 'ERROR', count: 0, message: error.message };
  }
}

async function verifyDatabaseConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    log(`✅ Database Connection: Connected at ${result[0].current_time} (HEALTHY)`, 'green');
    return { status: 'PASS', message: 'Database connection successful' };
  } catch (error) {
    log(`❌ Database Connection: Failed - ${error.message}`, 'red');
    return { status: 'ERROR', message: error.message };
  }
}

async function verifyTableStructure() {
  try {
    const result = await sql`
      SELECT table_name, 
             pg_size_pretty(pg_total_relation_size('public.'||table_name)) as size
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY pg_total_relation_size('public.'||table_name) DESC
    `;
    
    const criticalTables = ['investors', 'investments', 'investment_agreements', 'transactions'];
    const existingTables = result.map(row => row.table_name);
    const missingTables = criticalTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      log(`✅ Table Structure: All ${criticalTables.length} critical tables present (HEALTHY)`, 'green');
      result.forEach(row => {
        log(`   ${row.table_name}: ${row.size}`, 'blue');
      });
      return { status: 'PASS', message: 'All critical tables present' };
    } else {
      log(`❌ Table Structure: Missing tables - ${missingTables.join(', ')} (CRITICAL)`, 'red');
      return { status: 'FAIL', message: `Missing critical tables: ${missingTables.join(', ')}` };
    }
  } catch (error) {
    log(`❌ Table Structure: Database error - ${error.message}`, 'red');
    return { status: 'ERROR', message: error.message };
  }
}

// Main verification function
async function runDataIntegrityCheck() {
  log('\n' + '='.repeat(60), 'bold');
  log('INVESTMENT RELATIONSHIP MANAGEMENT - DATA INTEGRITY CHECK', 'bold');
  log('='.repeat(60), 'bold');
  log(`Started at: ${new Date().toLocaleString()}\n`, 'blue');

  const results = [];

  // Run all verification checks
  results.push(await verifyDatabaseConnection());
  results.push(await verifyTableStructure());
  results.push(await verifyInvestors());
  results.push(await verifyInvestmentAgreements());
  results.push(await verifyCredentials());
  results.push(await verifyTransactions());
  results.push(await verifyInvestmentPlans());

  // Summary
  log('\n' + '='.repeat(60), 'bold');
  log('VERIFICATION SUMMARY', 'bold');
  log('='.repeat(60), 'bold');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  const warnings = results.filter(r => r.status === 'WARN').length;

  log(`✅ Passed: ${passed}`, 'green');
  if (warnings > 0) log(`⚠️ Warnings: ${warnings}`, 'yellow');
  if (failed > 0) log(`❌ Failed: ${failed}`, 'red');
  if (errors > 0) log(`💥 Errors: ${errors}`, 'red');

  // Overall status
  if (failed === 0 && errors === 0) {
    log('\n🎉 OVERALL STATUS: SYSTEM HEALTHY - All critical data intact!', 'green');
  } else if (failed > 0 || errors > 0) {
    log('\n🚨 OVERALL STATUS: CRITICAL ISSUES DETECTED - Recovery required!', 'red');
    log('\nIMMEDIATE ACTIONS REQUIRED:', 'red');
    results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').forEach(result => {
      log(`  - ${result.message}`, 'red');
    });
  }

  log(`\nCompleted at: ${new Date().toLocaleString()}`, 'blue');
  log('='.repeat(60) + '\n', 'bold');

  return {
    overall: failed === 0 && errors === 0 ? 'HEALTHY' : 'CRITICAL',
    passed,
    failed,
    errors,
    warnings,
    results
  };
}

// Export for use in other scripts
export { runDataIntegrityCheck };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDataIntegrityCheck()
    .then(summary => {
      process.exit(summary.overall === 'HEALTHY' ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification script failed:', error);
      process.exit(1);
    });
}