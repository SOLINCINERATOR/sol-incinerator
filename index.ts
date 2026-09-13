import * as readline from 'readline';
import { MoneyMover } from './moneyMover';
import { TransferResult } from './types';

class CLI {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async run(): Promise<void> {
    console.log('🚀 Solana Money Mover');
    console.log('Transfer all SOL and tokens worth >$5 to another wallet\n');

    try {
      const privateKey = await this.question('Enter your BS58 private key: ');
      if (!privateKey.trim()) {
        console.log('❌ Private key is required');
        return;
      }

      const destinationWallet = await this.question('Enter destination wallet address: ');
      if (!destinationWallet.trim()) {
        console.log('❌ Destination wallet is required');
        return;
      }

      const rpcUrl = await this.question('Enter RPC URL (press Enter for default): ');
      const finalRpcUrl = rpcUrl.trim() || 'https://rpc.helius.xyz/?api-key=YOUR_API_KEY';

      console.log('\n🔍 Initializing...');
      
      const moneyMover = new MoneyMover(privateKey, finalRpcUrl);
      
      const walletInfo = await moneyMover.getWalletInfo();
      console.log(`📊 Wallet: ${walletInfo.publicKey}`);
      console.log(`💰 SOL Balance: ${walletInfo.solBalance.toFixed(4)} SOL`);
      console.log(`🪙 Token Accounts: ${walletInfo.tokenCount}`);

      const confirm = await this.question('\n⚠️  This will transfer ALL assets worth >$5. Continue? (y/N): ');
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('❌ Transfer cancelled');
        return;
      }

      console.log('\n🚀 Starting transfer...');
      
      const result: TransferResult = await moneyMover.transferAllAssets(destinationWallet);
      
      if (result.success) {
        console.log('\n✅ Transfer successful!');
        console.log(`📝 Transaction signature: ${result.signature}`);
        console.log(`💰 Total value transferred: $${result.totalValue.toFixed(2)}`);
        console.log(`📦 Items transferred: ${result.transferredItems.length}`);
        console.log("Explorer: https://solscan.io/tx/" + result.signature);
        
        for (const item of result.transferredItems) {
          if (item.type === 'SOL') {
            console.log(`  • ${item.amount.toFixed(4)} SOL ($${item.value.toFixed(2)})`);
          } else {
            console.log(`  • ${item.amount} tokens (${item.mint}) - $${item.value.toFixed(2)}`);
          }
        }
      } else {
        console.log('\n❌ Transfer failed!');
        console.log(`Error: ${result.error}`);
      }

    } catch (error) {
      console.error('\n💥 Unexpected error:', error);
    } finally {
      this.rl.close();
    }
  }
}

if (require.main === module) {
  const cli = new CLI();
  cli.run().catch(console.error);
}

export { CLI, MoneyMover }; 