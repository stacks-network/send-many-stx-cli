import { Command, flags } from '@oclif/command';
import { getAddress } from '../builder';
import { StacksMocknet, StacksMainnet, StacksTestnet } from '@stacks/network';
import {
  broadcastTransaction,
  ChainID,
  makeContractDeploy,
} from '@stacks/transactions';

type NetworkString = 'mocknet' | 'mainnet' | 'testnet';

export class SetMemoExpected extends Command {
  static description = `Set memo-expected on a principal.
  This deploys an empty contract called 'memo-expected' on the address of the provided private key.

  It is respected by the send-many-memo command. If a contract called 'memo-expected' is deployed
  on a principal, and no memo is passed, the send-many will be aborted before it ever reaches the
  chain.

  Example usage:

  \`\`\`
  npx stx-bulk-transfer set-memo-expected -k my_private_key -n testnet -b
  \`\`\`
  `;
  // allow infinite arguments
  static strict = false;

  static flags = {
    help: flags.help({ char: 'h' }),
    privateKey: flags.string({
      char: 'k',
      description: 'Your private key',
      required: true,
    }),
    broadcast: flags.boolean({
      char: 'b',
      default: false,
      description:
        'Whether to broadcast this transaction. Omitting this flag will not broadcast the transaction.',
    }),
    network: flags.string({
      char: 'n',
      description: 'Which network to broadcast this to',
      options: ['mocknet', 'testnet', 'mainnet'],
      default: 'testnet',
    }),
    nodeUrl: flags.string({
      required: false,
      char: 'u',
      description:
        'A default node URL will be used based on the `network` option. Use this flag to manually override.',
    }),
    quiet: flags.boolean({
      char: 'q',
      default: false,
      description: `
Reduce logging from this command. If this flag is passed with the broadcast (-b) flag,
only the transaction ID will be logged. If the quiet flagged is passed without broadcast, 
only the raw transaction hex will be logged.
`,
    }),
    contractAddress: flags.string({
      char: 'c',
      description:
        'Manually specify the contract address for send-many. If omitted, default contracts will be used.',
    }),
    nonce: flags.integer({
      description: 'Optionally specify a nonce for this transaction',
    }),
  };

  static args = [];

  getNetwork() {
    const { flags } = this.parse(SetMemoExpected);
    const networks = {
      mainnet: StacksMainnet,
      testnet: StacksTestnet,
      mocknet: StacksMocknet,
    };

    return networks[flags.network as NetworkString];
  }

  async run() {
    const { flags } = this.parse(SetMemoExpected);

    const networkClass = this.getNetwork();
    if (!networkClass) {
      throw new Error('Unable to get network');
    }
    const network = new networkClass();
    if (flags.nodeUrl) {
      network.coreApiUrl = flags.nodeUrl;
    }

    const tx = await makeContractDeploy({
      contractName: 'memo-expected',
      codeBody: '(print "ok")',
      senderKey: flags.privateKey,
      network,
    });

    const verbose = !flags.quiet;

    if (verbose) {
      this.log('Transaction hex:', tx.serialize().toString('hex'));
      this.log('Fee:', tx.auth.getFee().toString());
      this.log('Nonce:', tx.auth.spendingCondition?.nonce.toNumber());
      this.log(
        'Contract address:',
        `${getAddress(flags.privateKey, network)}.memo-expected`
      );
      this.log('Sender:', getAddress(flags.privateKey, network));
    }

    if (flags.broadcast) {
      const result = await broadcastTransaction(tx, network);
      if (typeof result === 'string') {
        if (verbose) {
          this.log('Transaction ID:', result);
          const explorerLink = `https://explorer.stacks.co/txid/0x${result}`;
          !(network instanceof StacksMocknet) &&
            this.log(
              'View in explorer:',
              `${explorerLink}?chain=${
                network.chainId === ChainID.Mainnet ? 'mainnet' : 'testnet'
              }`
            );
        } else {
          console.log(result.toString());
        }
      } else {
        this.log('Transaction rejected:', result);
        process.exit(1);
      }
    } else if (flags.quiet) {
      console.log(tx.serialize().toString('hex'));
    }
  }
}
