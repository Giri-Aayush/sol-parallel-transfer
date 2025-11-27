import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction
} from '@solana/web3.js';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const DEVNET_RPC = 'https://api.devnet.solana.com';
const CSV_FILE = process.env.CSV_FILE || './recipients.csv';
const BATCH_SIZE = 10; // Max recipients per transaction (Solana limit is ~25, but we use 10 for safety)
const CONCURRENT_BATCHES = 5; // Number of batches to process in parallel
const MAX_RETRIES = 3; // Maximum retry attempts per batch

interface Recipient {
  address: string;
}

interface TransactionResult {
  addresses: string[];
  signature: string;
  solscanUrl: string;
}

interface FailedTransfer {
  address: string;
  error: string;
  retries: number;
}

/**
 * Load wallet from private key stored in environment variable
 */
function loadWallet(): Keypair {
  const privateKeyString = process.env.SENDER_PRIVATE_KEY;

  if (!privateKeyString) {
    throw new Error('SENDER_PRIVATE_KEY not found in .env file');
  }

  try {
    // Parse the private key (expecting JSON array format like [1,2,3,...])
    const privateKeyArray = JSON.parse(privateKeyString);
    const secretKey = Uint8Array.from(privateKeyArray);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error('Invalid SENDER_PRIVATE_KEY format. Expected JSON array of numbers.');
  }
}

/**
 * Load recipient addresses from CSV file
 */
async function loadRecipients(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const recipients: string[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: Recipient) => {
        if (row.address && row.address.trim()) {
          recipients.push(row.address.trim());
        }
      })
      .on('end', () => {
        resolve(recipients);
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}

/**
 * Validate Solana address
 */
function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send SOL to multiple recipients in a single transaction (batch)
 */
async function sendBatchTransaction(
  connection: Connection,
  sender: Keypair,
  recipients: string[],
  amountPerRecipient: number,
  retryCount = 0
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const lamports = Math.floor(amountPerRecipient * LAMPORTS_PER_SOL);

    // Create transfer instructions for all recipients in this batch
    const instructions: TransactionInstruction[] = recipients.map(recipientAddress => {
      return SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports,
      });
    });

    // Create transaction with all transfer instructions
    const transaction = new Transaction().add(...instructions);

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [sender],
      {
        commitment: 'confirmed',
        maxRetries: 3,
      }
    );

    return { success: true, signature };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(`   ⚠️  Retry ${retryCount + 1}/${MAX_RETRIES} for batch...`);
      await sleep(1000 * (retryCount + 1)); // Exponential backoff
      return sendBatchTransaction(connection, sender, recipients, amountPerRecipient, retryCount + 1);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Process a batch of recipients with progress tracking
 */
async function processBatch(
  connection: Connection,
  sender: Keypair,
  batch: string[],
  batchIndex: number,
  totalBatches: number,
  amountPerRecipient: number,
  results: {
    successful: number;
    failed: number;
    transactions: TransactionResult[];
    failures: FailedTransfer[];
  }
): Promise<void> {
  const batchNumber = batchIndex + 1;
  console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (${batch.length} recipients)`);
  console.log(`   Addresses: ${batch.join(', ').substring(0, 80)}...`);

  const result = await sendBatchTransaction(connection, sender, batch, amountPerRecipient);

  if (result.success && result.signature) {
    const solscanUrl = `https://solscan.io/tx/${result.signature}?cluster=devnet`;
    console.log(`   ✅ Success! Signature: ${result.signature}`);
    console.log(`   🔗 Solscan: ${solscanUrl}`);

    results.successful += batch.length;
    results.transactions.push({
      addresses: batch,
      signature: result.signature,
      solscanUrl,
    });
  } else {
    console.log(`   ❌ Failed after ${MAX_RETRIES} retries: ${result.error}`);

    results.failed += batch.length;
    batch.forEach(address => {
      results.failures.push({
        address,
        error: result.error || 'Unknown error',
        retries: MAX_RETRIES,
      });
    });
  }
}

/**
 * Distribute SOL to all recipients with batching and parallel processing
 */
async function distributeSol(
  connection: Connection,
  sender: Keypair,
  recipients: string[],
  amountPerRecipient: number
) {
  console.log(`\n🚀 Starting optimized distribution...`);
  console.log(`Sender: ${sender.publicKey.toBase58()}`);
  console.log(`Total recipients: ${recipients.length}`);
  console.log(`Amount per recipient: ${amountPerRecipient} SOL`);
  console.log(`Batch size: ${BATCH_SIZE} recipients per transaction`);
  console.log(`Concurrent batches: ${CONCURRENT_BATCHES}\n`);

  // Check sender balance
  const senderBalance = await connection.getBalance(sender.publicKey);
  const senderBalanceSOL = senderBalance / LAMPORTS_PER_SOL;
  const totalRequired = amountPerRecipient * recipients.length;

  console.log(`Sender balance: ${senderBalanceSOL.toFixed(4)} SOL`);
  console.log(`Total required: ${totalRequired.toFixed(4)} SOL (+ fees)\n`);

  if (senderBalanceSOL < totalRequired + 0.01) { // Add buffer for fees
    throw new Error(`Insufficient balance. Need at least ${(totalRequired + 0.01).toFixed(4)} SOL (including fees)`);
  }

  // Validate all addresses first
  console.log('📋 Validating addresses...');
  const invalidAddresses: string[] = [];
  recipients.forEach((address, index) => {
    if (!isValidAddress(address)) {
      invalidAddresses.push(`Row ${index + 2}: ${address}`);
    }
  });

  if (invalidAddresses.length > 0) {
    console.error('\n❌ Invalid addresses found:');
    invalidAddresses.forEach(addr => console.error(`  - ${addr}`));
    throw new Error('Please fix invalid addresses in CSV file');
  }
  console.log('✅ All addresses validated\n');

  // Split recipients into batches
  const batches = chunkArray(recipients, BATCH_SIZE);
  console.log(`📊 Created ${batches.length} batches\n`);

  // Results tracking
  const results = {
    successful: 0,
    failed: 0,
    transactions: [] as TransactionResult[],
    failures: [] as FailedTransfer[],
  };

  // Process batches with concurrency control
  const startTime = Date.now();
  let processedBatches = 0;

  for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
    const batchGroup = batches.slice(i, i + CONCURRENT_BATCHES);

    // Process batches in parallel
    await Promise.all(
      batchGroup.map((batch, idx) =>
        processBatch(
          connection,
          sender,
          batch,
          i + idx,
          batches.length,
          amountPerRecipient,
          results
        )
      )
    );

    processedBatches += batchGroup.length;
    const progress = Math.round((processedBatches / batches.length) * 100);
    console.log(`\n⏳ Progress: ${progress}% (${processedBatches}/${batches.length} batches completed)`);

    // Small delay between batch groups to avoid overwhelming RPC
    if (i + CONCURRENT_BATCHES < batches.length) {
      await sleep(500);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DISTRIBUTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.successful}/${recipients.length}`);
  console.log(`❌ Failed: ${results.failed}/${recipients.length}`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(`💳 Total transactions: ${results.transactions.length}`);
  console.log(`📈 Avg recipients per transaction: ${(recipients.length / results.transactions.length).toFixed(1)}`);

  if (results.transactions.length > 0) {
    console.log(`\n✅ Successful Transactions (${results.transactions.length} batches):`);
    results.transactions.forEach(({ addresses, signature, solscanUrl }, index) => {
      console.log(`\n${index + 1}. Batch of ${addresses.length} recipients`);
      console.log(`   Recipients: ${addresses.slice(0, 3).join(', ')}${addresses.length > 3 ? '...' : ''}`);
      console.log(`   Signature: ${signature}`);
      console.log(`   Solscan: ${solscanUrl}`);
    });
  }

  if (results.failures.length > 0) {
    console.log(`\n❌ Failed Transfers (${results.failures.length}):`);
    results.failures.forEach(({ address, error }) => {
      console.log(`  - ${address}: ${error}`);
    });
  }

  const finalBalance = await connection.getBalance(sender.publicKey);
  const spent = senderBalanceSOL - (finalBalance / LAMPORTS_PER_SOL);
  console.log(`\n💰 Initial balance: ${senderBalanceSOL.toFixed(4)} SOL`);
  console.log(`💰 Final balance: ${(finalBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  console.log(`💸 Total spent: ${spent.toFixed(4)} SOL`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Main function
 */
async function main() {
  try {
    // Get amount from command line argument or environment
    const amountArg = process.argv[2];
    const amount = amountArg
      ? parseFloat(amountArg)
      : parseFloat(process.env.AMOUNT_PER_RECIPIENT || '0');

    if (!amount || amount <= 0) {
      console.error('❌ Error: Please provide a valid amount');
      console.log('\nUsage: npm start <amount_in_SOL>');
      console.log('Example: npm start 0.1');
      console.log('\nOr set AMOUNT_PER_RECIPIENT in .env file');
      process.exit(1);
    }

    console.log('🔧 Initializing...');

    // Connect to devnet
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    console.log('✅ Connected to Solana devnet');

    // Load wallet
    const sender = loadWallet();
    console.log(`✅ Wallet loaded: ${sender.publicKey.toBase58()}`);

    // Load recipients
    const recipients = await loadRecipients(CSV_FILE);
    console.log(`✅ Loaded ${recipients.length} recipients from ${CSV_FILE}`);

    if (recipients.length === 0) {
      throw new Error('No recipients found in CSV file');
    }

    // Distribute
    await distributeSol(connection, sender, recipients, amount);

    console.log('✅ Distribution completed!');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
main();
