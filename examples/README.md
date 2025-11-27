# Example CSV Files

This directory contains sample CSV files to help you get started with the Solana Parallel Transfer tool.

## Files

### sample-recipients-small.csv
- Contains 3 recipient addresses
- Good for initial testing and understanding the tool
- Minimal transaction costs

**Usage:**
```bash
CSV_FILE=examples/sample-recipients-small.csv npm start 0.001
```

### sample-recipients-medium.csv
- Contains 10 recipient addresses
- Good for testing batch processing (will create 1 batch)
- Demonstrates single-batch efficiency

**Usage:**
```bash
CSV_FILE=examples/sample-recipients-medium.csv npm start 0.01
```

### sample-recipients-large.csv
- Contains 30 recipient addresses
- Good for testing parallel processing (will create 3 batches)
- Demonstrates the tool's optimization capabilities

**Usage:**
```bash
CSV_FILE=examples/sample-recipients-large.csv npm start 0.001
```

## CSV Format

All CSV files must follow this format:

```csv
address
FIRST_WALLET_ADDRESS
SECOND_WALLET_ADDRESS
THIRD_WALLET_ADDRESS
```

**Requirements:**
- First line must be the header: `address`
- One wallet address per line
- No spaces or extra characters
- Valid Solana addresses (base58 encoded)

## Creating Your Own CSV

1. Copy one of the sample files as a template:
   ```bash
   cp examples/sample-recipients-small.csv my-recipients.csv
   ```

2. Edit the file and replace the sample addresses with your actual recipient addresses

3. Run the distribution:
   ```bash
   CSV_FILE=my-recipients.csv npm start 0.01
   ```

## Important Notes

- The sample addresses in these files are randomly generated for demonstration purposes
- **Do not use these addresses for real transactions** - they are examples only
- Always verify your recipient addresses before running distributions
- Test with small amounts on devnet before using mainnet
- Ensure you have sufficient SOL balance for all transfers plus fees
