# Solana Parallel Transfer

A command-line tool for distributing SOL to multiple wallet addresses efficiently using batch processing and parallel transactions.

## Overview

This tool allows you to send SOL to multiple recipients simultaneously by:
- Batching up to 10 recipients per transaction (reducing fees)
- Processing multiple batches in parallel (faster execution)
- Automatically retrying failed transactions
- Providing verification links for all transfers

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- A Solana wallet with sufficient funds

## Installation

1. Clone this repository or download the source code

2. Navigate to the project directory:
   ```bash
   cd sol-parallel-transfer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### Step 1: Generate a Wallet

Run the following command to create a new wallet:

```bash
npm run generate-wallet
```

This will:
- Create a new Solana wallet
- Save the private key to `.env` file
- Display your wallet address

The output will look like this:
```
Public Key (Address): 88qg3h2BzUBoMdu1CXZUhKrK4pbqKLPH5gb3dc32Fa4o
```

### Step 2: Fund Your Wallet

For devnet testing, request SOL from the faucet:

```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

Replace `YOUR_WALLET_ADDRESS` with the address from Step 1.

To check your balance:
```bash
solana balance YOUR_WALLET_ADDRESS --url devnet
```

### Step 3: Prepare Recipients File

Create or edit `recipients.csv` with the wallet addresses you want to send SOL to.

**Format:**
```csv
address
8YPqwYXZtWKE3J9Z7ZqXxGqxKqYx1a1a1a1a1a1a1a1a
9ZQrxYXZtWKE3J9Z7ZqXxGqxKqYx2b2b2b2b2b2b2b2b
AaRsyYXZtWKE3J9Z7ZqXxGqxKqYx3c3c3c3c3c3c3c3c
```

**Important:**
- First line must be the header: `address`
- Each subsequent line contains one wallet address
- No spaces or extra characters
- One address per line

**Example for 5 recipients:**
```csv
address
7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRu8g6aXJL
5ZWj7a1f3j1fM5yQ9X8qN2tR3vK6pL9mD4nB8cH7eY2P
9YpL6xM3nK8jH5gF2dS1aQ4wE7rT0yU3iO9pA6sD5fG8
2LkJ9hG6fD3sA1qW4eR7tY0uI8oP5aS2dF4gH6jK9lZ3
3XcV8bN5mA2sD7fG0hJ4kL1zQ6wE9rT3yU8iO5pA1sD4
```

## Usage

### Basic Command

To distribute SOL to all addresses in your CSV file:

```bash
npm start AMOUNT
```

Replace `AMOUNT` with the SOL amount to send to each recipient.

### Examples

Send 0.1 SOL to each recipient:
```bash
npm start 0.1
```

Send 0.001 SOL to each recipient:
```bash
npm start 0.001
```

### Using a Different CSV File

```bash
CSV_FILE=my-recipients.csv npm start 0.01
```

## Understanding the Output

When you run the distribution, you will see:

1. **Initialization**
   - Connection confirmation
   - Wallet address loaded
   - Number of recipients found

2. **Configuration Summary**
   - Total recipients
   - Amount per recipient
   - Batch configuration
   - Balance check

3. **Progress Updates**
   - Real-time batch processing status
   - Transaction signatures
   - Solscan verification links

4. **Final Summary**
   - Successful transfers count
   - Failed transfers (if any)
   - Total execution time
   - Final wallet balance

### Example Output

```
Initializing...
Connected to Solana devnet
Wallet loaded: 88qg3h2BzUBoMdu1CXZUhKrK4pbqKLPH5gb3dc32Fa4o
Loaded 100 recipients from ./recipients.csv

Starting optimized distribution...
Sender: 88qg3h2BzUBoMdu1CXZUhKrK4pbqKLPH5gb3dc32Fa4o
Total recipients: 100
Amount per recipient: 0.001 SOL
Batch size: 10 recipients per transaction
Concurrent batches: 5

Sender balance: 1.0000 SOL
Total required: 0.1000 SOL (+ fees)

Validating addresses...
All addresses validated

Created 10 batches

Batch 1/10 (10 recipients)
   Success! Signature: 3X6RbFTqJnSZxvtR4CPtg7RMxTzRGbx2TgG3tuZvf4t8...
   Solscan: https://solscan.io/tx/3X6RbFTqJnSZxvtR4CPtg7RMxTzRGbx2TgG3tuZvf4t8...

Progress: 100% (10/10 batches completed)

============================================================
DISTRIBUTION SUMMARY
============================================================
Successful: 100/100
Failed: 0/100
Duration: 8.45 seconds
Total transactions: 10
Avg recipients per transaction: 10.0

Initial balance: 1.0000 SOL
Final balance: 0.8995 SOL
Total spent: 0.1005 SOL
============================================================

Distribution completed!
```

## Performance

The tool optimizes distribution through:

- **Batch Processing**: Groups up to 10 recipients per transaction
- **Parallel Execution**: Processes 5 batches simultaneously
- **Automatic Retries**: Retries failed batches up to 3 times

For 100 recipients:
- Traditional method: ~100 transactions, 50+ seconds
- This tool: ~10 transactions, 5-10 seconds

## Verification

Each transaction includes a Solscan link for verification:

```
https://solscan.io/tx/TRANSACTION_SIGNATURE?cluster=devnet
```

Click these links to verify transfers on the Solana blockchain explorer.

## Network Configuration

**Default:** Devnet (for testing)

**For Mainnet:** Edit `distribute.ts` and change:
```typescript
const DEVNET_RPC = 'https://api.devnet.solana.com';
```
to:
```typescript
const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
```

**Warning:** Mainnet transactions use real SOL. Test thoroughly on devnet first.

## Troubleshooting

### "Insufficient balance" error
- Check your wallet balance: `solana balance YOUR_ADDRESS --url devnet`
- Ensure you have enough SOL for all transfers plus fees
- Request more from faucet if on devnet

### "Invalid addresses found" error
- Verify all addresses in your CSV are valid Solana addresses
- Check for extra spaces or characters
- Ensure proper CSV format (see Step 3)

### "SENDER_PRIVATE_KEY not found" error
- Ensure you ran `npm run generate-wallet` first
- Check that `.env` file exists in the project directory
- Verify `.env` contains the `SENDER_PRIVATE_KEY` line

### Transaction failures
- The tool automatically retries failed transactions 3 times
- Check your internet connection
- Verify the RPC endpoint is accessible
- Failed addresses will be listed in the summary

## Security

**Important:**
- Never share your private key with anyone
- Never commit `.env` or `wallet.json` files to version control
- Keep your private keys secure
- Test with small amounts on devnet before using mainnet

The `.gitignore` file is configured to prevent accidental commits of sensitive files.

## Advanced Configuration

You can modify these constants in `distribute.ts`:

```typescript
const BATCH_SIZE = 10;              // Recipients per transaction (max 25)
const CONCURRENT_BATCHES = 5;       // Parallel batches to process
const MAX_RETRIES = 3;              // Retry attempts for failed batches
```

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the example output to understand expected behavior
- Ensure all prerequisites are installed correctly

## License

ISC
