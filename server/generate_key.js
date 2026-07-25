import crypto from 'crypto';

// THIS MUST MATCH THE SECRET IN activationRoutes.js
const SECRET = 'STOCK_MASTER_SECRET_2024';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide the Hardware ID as an argument.");
  console.log("Example: node generate_key.js b23c91a...");
  process.exit(1);
}

const hardwareId = args[0];
const activationKey = crypto.createHmac('sha256', SECRET).update(hardwareId).digest('hex');

console.log("\n==============================================");
console.log("🔑 ACTIVATION KEY GENERATOR");
console.log("==============================================");
console.log(`Hardware ID : ${hardwareId}`);
console.log(`Generated Key: ${activationKey}`);
console.log("==============================================\n");
console.log("Send the Generated Key above to your client.");
