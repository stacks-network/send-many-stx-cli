import {Args, Command, Flags} from '@oclif/core'
import {
  networkFrom,
  STACKS_MAINNET,
  STACKS_MOCKNET,
  STACKS_TESTNET,
  StacksNetwork,
} from '@stacks/network';
import {
  broadcastTransaction,
  STXPostConditionWire,
  validateStacksAddress,
} from '@stacks/transactions';

import {
  getAddress,
  isNormalInteger,
  Recipient,
  sendMany,
  sendStxTransfer,
} from '../builder';
import { getExplorerUrlForTx } from '../util';

type NetworkString = 'mainnet' | 'mocknet' | 'testnet';

const DEFAULT_TESTNET_CONTRACT =
  'ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many';
const DEFAULT_MAINNET_CONTRACT =
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many';


export default class SendMany extends Command {
  static override args = {
    recipients: Args.string({description: `
A set of recipients in the format of "address,amount_ustx"
Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50`}),
  }
  static override description = `Execute a bulk STX transfer.
  The bulk transfer is executed in a single transaction by invoking a \`contract-call\` on the "send-many" contract.

  The default contracts can be found below:

  Testnet: https://explorer.hiro.so/txid/${DEFAULT_TESTNET_CONTRACT}?chain=testnet
  Mainnet: https://explorer.hiro.so/txid/${DEFAULT_MAINNET_CONTRACT}?chain=mainnet`;
  static override examples = [
    '<%= config.bin %> <%= command.id %> STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50 -k my_private_key -n testnet -b',
  ]
static override flags = {
    allowSingleStxTransfer: Flags.boolean({
      char: 'a',
      default: false,
      description: `
If enabled and only a single recipient is specified, a STX-transfer transaction type will be used rather than a contract-call transaction. 
If omitted, a contract-call will always be used, which can be less efficient.
`,
      required: false,
    }),
    broadcast: Flags.boolean({
      char: 'b',
      default: false,
      description:
        'Whether to broadcast this transaction. Omitting this flag will not broadcast the transaction.',
    }),
    contractAddress: Flags.string({
      char: 'c',
      description:
        'Manually specify the contract address for send-many. If omitted, default contracts will be used.',
    }),
    feeMultiplier: Flags.integer({
      char: 'm',
      description: `
Optionally specify a fee multiplier. If passed, the tx fee will be (estimated fee + (estimated fee * multiplier)).
For example, a fee multiplier of 15 for a tx with an estimated fee of 200 would result in a tx with the fee of 230.
`,
      required: false,
    }),
    network: Flags.string({
      char: 'n',
      default: 'testnet',
      description: 'Which network to broadcast this to',
      options: ['mocknet', 'testnet', 'mainnet'],
    }),
    nodeUrl: Flags.string({
      char: 'u',
      description:
        'A default node URL will be used based on the `network` option. Use this flag to manually override.',
      required: false,
    }),
    nonce: Flags.integer({
      description: 'Optionally specify a nonce for this transaction',
    }),
    privateKey: Flags.string({
      char: 'k',
      description: 'Your private key',
      required: true,
    }),
    quiet: Flags.boolean({
      char: 'q',
      default: false,
      description: `
Reduce logging from this command. If this flag is passed with the broadcast (-b) flag,
only the transaction ID will be logged. If the quiet flagged is passed without broadcast, 
only the raw transaction hex will be logged.
`,
    }),
  }
  // allow infinite arguments
  static strict = false;

  getContract(network: StacksNetwork) {
    return network.chainId === STACKS_TESTNET.chainId
      ? DEFAULT_TESTNET_CONTRACT
      : DEFAULT_MAINNET_CONTRACT;
  }

  getNetwork(flags: { network: string }) {
    const networks = {
      mainnet: STACKS_MAINNET,
      mocknet: STACKS_MOCKNET,
      testnet: STACKS_TESTNET,
    };

    return networks[flags.network as NetworkString];
  }

  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(SendMany)

    const recipients: Recipient[] = argv.map(entry => {
      const arg = entry as string;
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

    const networkClass = this.getNetwork(flags);
    if (!networkClass) {
      throw new Error('Unable to get network');
    }

    const network = networkFrom(networkClass);
    if (flags.nodeUrl) {
      network.client.baseUrl = flags.nodeUrl;
    }

    if (
      network.magicBytes === STACKS_MOCKNET.magicBytes &&
      !flags.contractAddress
    ) {
      throw new Error('Must manually specify contract address for mocknet');
    }

    const contractIdentifier =
      flags.contractAddress || this.getContract(network);

    const performStxTransferTx: boolean =
      recipients.length === 1 && flags.allowSingleStxTransfer;
    const tx = await (performStxTransferTx ? sendStxTransfer({
        feeMultiplier: flags.feeMultiplier,
        network,
        nonce: flags.nonce,
        recipient: recipients[0],
        senderKey: flags.privateKey,
      }) : sendMany({
        contractIdentifier,
        feeMultiplier: flags.feeMultiplier,
        network,
        nonce: flags.nonce,
        recipients,
        senderKey: flags.privateKey,
      }));

    const verbose = !flags.quiet;

    if (verbose) {
      this.log('Transaction hex:', tx.serialize());
      this.log('Fee:', tx.auth.spendingCondition.fee.toString());
      this.log('Nonce:', tx.auth.spendingCondition?.nonce.toString());
      this.log('Contract:', contractIdentifier);
      this.log('Sender:', getAddress(flags.privateKey, network));
      const postCondition = tx.postConditions.values[0] as STXPostConditionWire;
      this.log('Total amount:', postCondition.amount.toString());
      if (flags.allowSingleStxTransfer) {
        this.log('Is STX-transfer transaction type: ', performStxTransferTx);
      }
    }

    if (flags.broadcast) {
      try {
        const { txid: result } = await broadcastTransaction({
          network,
          transaction: tx,
        });
        if (verbose) {
          this.log('Transaction ID:', result);
          const explorerLink = getExplorerUrlForTx(result, flags.network);
          if (explorerLink) {
            this.log('View in explorer:', explorerLink);
          }
        } else {
          console.log(result.toString());
        }
      } catch (error) {
        this.log('Transaction rejected:', error);
        this.exit(1);
      }
    } else if (flags.quiet) {
      console.log(tx.serialize());
    }
  }
}
