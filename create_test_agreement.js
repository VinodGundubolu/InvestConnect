// Test script to create agreement for investor 211
const agreementId = "test-agreement-" + Date.now();
const signUrl = `/agreement-sign/${agreementId}`;

console.log("=".repeat(50));
console.log("🔥 MANUAL AGREEMENT CREATION FOR TESTING 🔥");
console.log("=".repeat(50));
console.log(`📋 Investor ID: 211`);
console.log(`📄 Agreement ID: ${agreementId}`);
console.log(`🔗 Direct Signing URL: ${signUrl}`);
console.log("=".repeat(50));
console.log("");
console.log("📝 To test the agreement signing:");
console.log(`1. Open: https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.replit.app${signUrl}`);
console.log("2. You'll see the agreement signing interface");
console.log("3. Draw your signature and click 'Sign Agreement'");
console.log("4. Check the investor portal for the signed agreement");
console.log("");
console.log("=".repeat(50));