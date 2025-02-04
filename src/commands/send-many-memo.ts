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
  'ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many-memo';
const DEFAULT_MAINNET_CONTRACT =
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo';

export default class SendManyMemo extends Command {
  static override args = {
    recipients: Args.string({description: `
A set of recipients in the format of "address,amount_ustx,memo". Memo is optional.
Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,memo ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50`}),
  }
  static override description = `Execute a bulk STX transfer, with memos attached.
  The bulk transfer is executed in a single transaction by invoking a \`contract-call\` on the "send-many-memo" contract.

  The default contracts can be found below:

  Testnet: https://explorer.hiro.so/txid/${DEFAULT_TESTNET_CONTRACT}?chain=testnet
  Mainnet: https://explorer.hiro.so/txid/${DEFAULT_MAINNET_CONTRACT}?chain=mainnet`;
  static override examples = [
    '<%= config.bin %> <%= command.id %> STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,hello ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50,memo2 -k my_private_key -n testnet -b',
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
        'Manually specify the contract address for send-many-memo. If omitted, default contracts will be used.',
    }),
    feeMultiplier: Flags.integer({
      char: 'm',
      description: `
Optionally specify a fee multiplier. If passed, the tx fee will be (estimated fee + (estimated fee * multiplier)).
For example, a fee multiplier of 15 for a tx with an estimated fee of 200 would result in a tx with the fee of 230.
`,
      required: false,
    }),
    jsonOutput: Flags.boolean({
      char: 'j',
      default: false,
      description: 'Output data in JSON format',
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
    return network.chainId === STACKS_MAINNET.chainId
      ? DEFAULT_MAINNET_CONTRACT
      : DEFAULT_TESTNET_CONTRACT;
  }

  getNetwork(flags: { network: string }) {
    const networks = {
      mainnet: STACKS_MAINNET,
      mocknet: STACKS_MOCKNET,
      testnet: STACKS_TESTNET,
    };

    return networks[flags.network as NetworkString];
  }

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(SendManyMemo)

    const recipients: Recipient[] = argv.map(entry => {
      const arg = entry as string;
      const [address, amount, memo] = arg.split(',');
      if (!validateStacksAddress(address)) {
        throw new Error(`${address} is not a valid STX address`);
      }

      if (!isNormalInteger(amount)) {
        throw new Error(`${amount} is not a valid integer.`);
      }

      return {
        address,
        amount,
        memo,
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
        withMemo: true,
      }) : sendMany({
        contractIdentifier,
        feeMultiplier: flags.feeMultiplier,
        network,
        nonce: flags.nonce,
        recipients,
        senderKey: flags.privateKey,
        withMemo: true,
      }));

    const verbose = !flags.quiet;

    let outputEntries: Record<
      string,
      boolean | Record<string, string>[] | string
    > = {};

    outputEntries = {
      contract: contractIdentifier,
      fee: tx.auth.spendingCondition.fee.toString(),
      nonce: tx.auth.spendingCondition?.nonce.toString() || '?',
      recipients: recipients.map(r => ({
        address: r.address,
        amount: r.amount,
        memo: r.memo || '',
      })),
      sender: getAddress(flags.privateKey, network),
      totalAmount: (tx.postConditions
        .values[0] as STXPostConditionWire).amount.toString(),
      transactionHex: tx.serialize(),
    };

    if (flags.allowSingleStxTransfer) {
      outputEntries.isStxTransferTxType = performStxTransferTx;
    }

    let broadcastFailed = false;
    if (flags.broadcast) {
      try {
        const { txid: result } = await broadcastTransaction({
          network,
          transaction: tx,
        });
        if (verbose) {
          outputEntries.success = true;
          outputEntries.transactionId = result;
          const explorerLink = getExplorerUrlForTx(result, flags.network);
          if (explorerLink) {
            outputEntries.explorerLink = explorerLink;
          }
        } else if (flags.jsonOutput) {
            console.log(JSON.stringify({ transactionId: result }));
          } else {
            console.log(result);
          }
      } catch (error) {
        broadcastFailed = true;
        outputEntries.success = false;
        outputEntries.error = (error as Error).toString();
      }
    } else if (flags.quiet) {
      if (flags.jsonOutput) {
        console.log(JSON.stringify({ transactionHex: tx.serialize() }));
      } else {
        console.log(tx.serialize());
      }
    }

    if (verbose) {
      if (flags.jsonOutput) {
        this.log(JSON.stringify(outputEntries, null, 2));
      } else {
        for (const [key, value] of Object.entries(outputEntries)) {
          if (Array.isArray(value)) {
            this.log(`${key}:`);
            for (const obj of value) {
              for (const [k, v] of Object.entries(obj)) {
                this.log(`  ${k}: ${v}`);
              }

              this.log('  ----------');
            }
          } else {
            this.log(`${key}: ${value}`);
          }
        }
      }
    }

    if (broadcastFailed) {
      this.exit(1);
    }
  }
}
