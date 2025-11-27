import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';

/**
 * Generate a new Solana wallet and save it to .env file
 */
function generateWallet() {
  console.log('🔧 Generating new Solana wallet...\n');

  // Generate new keypair
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const privateKeyArray = Array.from(keypair.secretKey);

  console.log('✅ Wallet generated successfully!\n');
  console.log('📋 Wallet Details:');
  console.log('='.repeat(60));
  console.log(`Public Key (Address): ${publicKey}`);
  console.log('='.repeat(60));
  console.log('\n🔐 Private Key (keep this secret!):');
  console.log(JSON.stringify(privateKeyArray));
  console.log('\n');

  // Create or update .env file
  const envContent = `# Sender wallet private key (as JSON array)
SENDER_PRIVATE_KEY=${JSON.stringify(privateKeyArray)}

# Optional: Set default amount per recipient
AMOUNT_PER_RECIPIENT=0.01
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Private key saved to .env file\n');

  // Save to wallet.json as backup
  fs.writeFileSync('wallet.json', JSON.stringify(privateKeyArray, null, 2));
  console.log('✅ Private key also saved to wallet.json (backup)\n');

  console.log('📝 Next Steps:');
  console.log('='.repeat(60));
  console.log(`1. Fund your wallet on devnet with this command:`);
  console.log(`   solana airdrop 2 ${publicKey} --url devnet`);
  console.log('');
  console.log('2. Check your balance:');
  console.log(`   solana balance ${publicKey} --url devnet`);
  console.log('');
  console.log('3. Update recipients.csv with recipient addresses');
  console.log('');
  console.log('4. Run the distribution:');
  console.log('   npm start 0.01');
  console.log('='.repeat(60));
  console.log('\n⚠️  IMPORTANT: Never share your private key with anyone!\n');
}

generateWallet();
