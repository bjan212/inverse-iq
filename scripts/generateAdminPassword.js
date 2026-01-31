/**
 * Generate Admin Password Hash
 * 
 * This script generates a bcrypt hash for a new admin password.
 * Usage: node scripts/generateAdminPassword.js <your-new-password>
 */

const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
    console.error('❌ Error: Please provide a password as an argument');
    console.log('\nUsage: node scripts/generateAdminPassword.js <your-new-password>');
    console.log('Example: node scripts/generateAdminPassword.js MySecurePassword123!');
    process.exit(1);
}

// Generate hash with 10 salt rounds
const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n✅ Password hash generated successfully!\n');
console.log('Add this to your .env file:\n');
console.log(`ADMIN_PASS_HASH=${hash}`);
console.log('\nOr if you prefer to use plaintext (not recommended for production):\n');
console.log(`ADMIN_PASS=${password}`);
console.log('\n⚠️  Remember to restart your server after updating the .env file!\n');
