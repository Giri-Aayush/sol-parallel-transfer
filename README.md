# SOL Distribution Script

Distribute SOL to multiple addresses from a CSV file on Solana devnet.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure your wallet:**

   Get your private key in JSON array format:

   **Option A: Generate a new devnet wallet**
   ```bash
   solana-keygen new --outfile wallet.json
   ```
   Then copy the array from `wallet.json` into your `.env` file:
   ```
   SENDER_PRIVATE_KEY=[1,2,3,4,5,...]
   ```

   **Option B: Export from existing wallet**
   - From Phantom: Settings → Security & Privacy → Export Private Key
   - Convert base58 to array format or use a converter

4. **Fund your devnet wallet:**
   ```bash
   solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
   ```

5. **Update [recipients.csv](recipients.csv):**

   Replace the example addresses with your actual recipient addresses (one per line):
   ```csv
   address
   YourAddress1...
   YourAddress2...
   YourAddress3...
   ```

## Usage

Run the script with the amount of SOL to send to each recipient:

```bash
npm start 0.01
```

This will send 0.01 SOL to each address in [recipients.csv](recipients.csv).

Alternatively, set `AMOUNT_PER_RECIPIENT` in `.env` and run:
```bash
npm start
```

## Features

- ✅ Validates all addresses before sending
- ✅ Checks sender balance before distribution
- ✅ Shows real-time progress
- ✅ Provides detailed summary with transaction signatures
- ✅ Error handling with failed transaction reporting
- ✅ Rate limiting to avoid RPC throttling

## Example Output

```
🔧 Initializing...
✅ Connected to Solana devnet
✅ Wallet loaded: 8YPqwYXZtWKE3J9Z7ZqXxGqxKqYx1a1a1a1a1a1a1a1a
✅ Loaded 3 recipients from ./recipients.csv

🚀 Starting distribution...
Sender: 8YPqwYXZtWKE3J9Z7ZqXxGqxKqYx1a1a1a1a1a1a1a1a
Total recipients: 3
Amount per recipient: 0.01 SOL

Sender balance: 2.0000 SOL
Total required: 0.03 SOL (+ fees)

📋 Validating addresses...
✅ All addresses validated

[1/3] Sending 0.01 SOL to 9ZQrxYXZtWKE3J9Z7ZqXxGqxKqYx2b2b2b2b2b2b2b2b...
✅ Success! Signature: 5j7s...

==================================================
📊 DISTRIBUTION SUMMARY
==================================================
✅ Successful: 3
❌ Failed: 0
📈 Total: 3

💰 Final sender balance: 1.9700 SOL
==================================================
```

## Testing

For testing purposes, you can use your own addresses in the CSV file to send SOL back to yourself.

## Security Notes

- Never commit your `.env` file
- Keep your private keys secure
- This script is for devnet only - modify RPC URL for mainnet use
