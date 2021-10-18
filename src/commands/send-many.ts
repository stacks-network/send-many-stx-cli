import { Command, flags } from '@oclif/command';
import {
  sendMany,
  Recipient,
  isNormalInteger,
  getAddress,
  sendStxTransfer,
} from '../builder';
import {
  StacksMocknet,
  StacksMainnet,
  StacksTestnet,
  StacksNetwork,
} from '@stacks/network';
import {
  broadcastTransaction,
  ChainID,
  StacksTransaction,
  validateStacksAddress,
} from '@stacks/transactions';
import { STXPostCondition } from '@stacks/transactions/dist/transactions/src/postcondition';

type NetworkString = 'mocknet' | 'mainnet' | 'testnet';

const DEFAULT_TESTNET_CONTRACT =
  'ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many';
const DEFAULT_MAINNET_CONTRACT =
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many';

export class SendMany extends Command {
  static description = `Execute a bulk STX transfer.
  The bulk transfer is executed in a single transaction by invoking a \`contract-call\` on the "send-many" contract.

  The default contracts can be found below:

  Testnet: https://explorer.stacks.co/txid/${DEFAULT_TESTNET_CONTRACT}?chain=testnet
  Mainnet: https://explorer.stacks.co/txid/${DEFAULT_MAINNET_CONTRACT}?chain=mainnet

  Example usage:

  \`\`\`
  npx stx-bulk-transfer send-many STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50 -k my_private_key -n testnet -b
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
    feeMultiplier: flags.integer({
      required: false,
      char: 'm',
      description: `
Optionally specify a fee multiplier. If passed, the tx fee will be (estimated fee + (estimated fee * multiplier)).
For example, a fee multiplier of 15 for a tx with an estimated fee of 200 would result in a tx with the fee of 230.
`,
    }),
    allowSingleStxTransfer: flags.boolean({
      required: false,
      char: 'a',
      default: false,
      description: `
If enabled and only a single recipient is specified, a STX-transfer transaction type will be used rather than a contract-call transaction. 
If omitted, a contract-call will always be used, which can be less efficient.
`,
    }),
  };

  static args = [
    {
      name: 'recipients',
      description: `
A set of recipients in the format of "address,amount_ustx"
Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50
      `,
    },
  ];

  getNetwork() {
    const { flags } = this.parse(SendMany);
    const networks = {
      mainnet: StacksMainnet,
      testnet: StacksTestnet,
      mocknet: StacksMocknet,
    };

    return networks[flags.network as NetworkString];
  }

  getContract(network: StacksNetwork) {
    return network.chainId === ChainID.Testnet
      ? DEFAULT_TESTNET_CONTRACT
      : DEFAULT_MAINNET_CONTRACT;
  }

  async run() {
    const { argv, flags } = this.parse(SendMany);

    const recipients: Recipient[] = argv.map(arg => {
      const [address, amount] = arg.split(',');
      if (!validateStacksAddress(address)) {
        throw new Error(`${address} is not a valid STX address`);
      }
      if (!isNormalInteger(amount)) {
        throw new Error(`${amount} is not a valid integer.`);
      }
      return {
        address,
        amount,
      };
    });

    const networkClass = this.getNetwork();
    if (!networkClass) {
      throw new Error('Unable to get network');
    }
    const network = new networkClass();
    if (flags.nodeUrl) {
      network.coreApiUrl = flags.nodeUrl;
    }

    if (network instanceof StacksMocknet && !flags.contractAddress) {
      throw new Error('Must manually specify contract address for mocknet');
    }
    const contractIdentifier =
      flags.contractAddress || this.getContract(network);

    let tx: StacksTransaction;
    const performStxTransferTx: boolean =
      recipients.length === 1 && flags.allowSingleStxTransfer;
    if (performStxTransferTx) {
      tx = await sendStxTransfer({
        recipient: recipients[0],
        network,
        senderKey: flags.privateKey,
        nonce: flags.nonce,
        feeMultiplier: flags.feeMultiplier,
      });
    } else {
      tx = await sendMany({
        recipients,
        network,
        senderKey: flags.privateKey,
        contractIdentifier,
        nonce: flags.nonce,
        feeMultiplier: flags.feeMultiplier,
      });
    }

    const verbose = !flags.quiet;

    if (verbose) {
      this.log('Transaction hex:', tx.serialize().toString('hex'));
      this.log('Fee:', tx.auth.getFee().toString());
      this.log('Nonce:', tx.auth.spendingCondition?.nonce.toNumber());
      this.log('Contract:', contractIdentifier);
      this.log('Sender:', getAddress(flags.privateKey, network));
      const [postCondition] = tx.postConditions.values as STXPostCondition[];
      this.log('Total amount:', postCondition.amount.toNumber());
      if (flags.allowSingleStxTransfer) {
        this.log('Is STX-transfer transaction type: ', performStxTransferTx);
      }
    }

    if (flags.broadcast) {
      const result = await broadcastTransaction(tx, network);
      if (typeof result === 'string') {
        if (verbose) {
          this.log('Transaction ID:', result);
          if (!(network instanceof StacksMocknet)) {
            const explorerLink = `https://explorer.stacks.co/txid/0x${result}`;
            this.log(
              'View in explorer:',
              `${explorerLink}?chain=${
                network.chainId === ChainID.Mainnet ? 'mainnet' : 'testnet'
              }`
            );
          }
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
