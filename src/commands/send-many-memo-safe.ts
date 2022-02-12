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
  STXPostCondition,
  validateStacksAddress,
} from '@stacks/transactions';
import fetch, { Response } from 'node-fetch';

type NetworkString = 'mocknet' | 'mainnet' | 'testnet';

const DEFAULT_TESTNET_CONTRACT =
  'ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many-memo';
const DEFAULT_MAINNET_CONTRACT =
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo';

function uniqueFetchSession() {
  return (() => {
    let register: { [key: string]: Promise<Response> } = {};
    return (url: string) => register[url] || (register[url] = fetch(url));
  })();
}

async function checkMemoExpected(
  network: StacksNetwork,
  recipients: Recipient[]
): Promise<string[]> {
  const fetch = uniqueFetchSession();
  const results = await Promise.all(
    recipients
      .filter(recipient => !recipient.memo)
      .map(recipient =>
        fetch(
          network.getAbiApiUrl(recipient.address, 'memo-expected')
        ).then(response => ({ response, recipient }))
      )
  );
  return results
    .filter(entry => entry.response.status === 200)
    .map(entry => entry.recipient.address);
}

export class SendManyMemoSafe extends Command {
  static description = `Execute a bulk STX transfer, with memos attached, checking if the transfer is safe to send.
  The bulk transfer is executed in a single transaction by invoking a \`contract-call\` on the "send-many-memo" contract.

  The 'safe' counterpart of send-many-memo checks for the existence of a \`memo-expected\` contract for each recipient.
  If it exists, the transfer will be aborted if the corresponding memo is empty or missing. A utility command to deploy
  this contract is part of this tool: stx-bulk-transfer deploy-contract memo-expected.

  The default contracts can be found below:

  Testnet: https://explorer.stacks.co/txid/${DEFAULT_TESTNET_CONTRACT}?chain=testnet
  Mainnet: https://explorer.stacks.co/txid/${DEFAULT_MAINNET_CONTRACT}?chain=mainnet

  Example usage:

  \`\`\`
  npx stx-bulk-transfer send-many-memo-safe STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,hello ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50,memo2 -k my_private_key -n testnet -b
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
    jsonOutput: flags.boolean({
      char: 'j',
      default: false,
      description: 'Output data in JSON format',
    }),
    contractAddress: flags.string({
      char: 'c',
      description:
        'Manually specify the contract address for send-many-memo. If omitted, default contracts will be used.',
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
A set of recipients in the format of "address,amount_ustx,memo". Memo is optional.
Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,memo ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50
      `,
    },
  ];

  getNetwork() {
    const { flags } = this.parse(SendManyMemoSafe);
    const networks = {
      mainnet: StacksMainnet,
      testnet: StacksTestnet,
      mocknet: StacksMocknet,
    };

    return networks[flags.network as NetworkString];
  }

  getContract(network: StacksNetwork) {
    return network.chainId === ChainID.Mainnet
      ? DEFAULT_MAINNET_CONTRACT
      : DEFAULT_TESTNET_CONTRACT;
  }

  async run() {
    const { argv, flags } = this.parse(SendManyMemoSafe);

    const recipients: Recipient[] = argv.map(arg => {
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

    const networkClass = this.getNetwork();
    if (!networkClass) {
      throw new Error('Unable to get network');
    }
    const network = new networkClass(flags.nodeUrl ? { url: flags.nodeUrl } : undefined);

    const memoExpectedRecipients = await checkMemoExpected(network, recipients);
    if (memoExpectedRecipients.length > 0) {
      if (flags.jsonOutput) {
        console.log(JSON.stringify({ success: false, memoExpectedRecipients }));
        process.exit(1);
      }
      throw new Error(
        `Memo expected for: ${memoExpectedRecipients
          .filter((value, index, self) => self.indexOf(value) === index)
          .join(', ')}`
      );
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
        withMemo: true,
      });
    } else {
      tx = await sendMany({
        recipients,
        network,
        senderKey: flags.privateKey,
        contractIdentifier,
        nonce: flags.nonce,
        feeMultiplier: flags.feeMultiplier,
        withMemo: true,
      });
    }

    const verbose = !flags.quiet;

    let outputEntries: Record<
      string,
      string | boolean | Record<string, string>[]
    > = {};

    outputEntries = {
      recipients: recipients.map(r => ({
        address: r.address,
        amount: r.amount,
        memo: r.memo || '',
      })),
      nonce: tx.auth.spendingCondition?.nonce.toString() || '?',
      contract: contractIdentifier,
      sender: getAddress(flags.privateKey, network),
      totalAmount: (tx.postConditions
        .values as STXPostCondition[])[0].amount.toString(),
      transactionHex: tx.serialize().toString('hex'),
    };

    if (flags.allowSingleStxTransfer) {
      outputEntries.isStxTransferTxType = performStxTransferTx;
    }

    let broadcastFailed = false;
    if (flags.broadcast) {
      const result = await broadcastTransaction(tx, network);
      if (result && result.txid) {
        if (verbose) {
          outputEntries['success'] = true;
          outputEntries['transactionId'] = result.txid;
          const explorerLink = `https://explorer.stacks.co/txid/${result.txid}`;
          if (!(network instanceof StacksMocknet)) {
            outputEntries['explorerLink'] = `${explorerLink}?chain=${network.chainId === ChainID.Mainnet ? 'mainnet' : 'testnet'
              }`;
          }
        } else {
          if (flags.jsonOutput) {
            console.log(JSON.stringify({ transactionId: result.txid }));
          } else {
            console.log(result.toString());
          }
        }
      } else {
        broadcastFailed = true;
        outputEntries['success'] = false;
        outputEntries['error'] = JSON.stringify(result, null, 2);
      }
    } else if (flags.quiet) {
      if (flags.jsonOutput) {
        console.log(
          JSON.stringify({ transactionHex: tx.serialize().toString('hex') })
        );
      } else {
        console.log(tx.serialize().toString('hex'));
      }
    }

    if (verbose) {
      if (flags.jsonOutput) {
        this.log(JSON.stringify(outputEntries, null, 2));
      } else {
        for (const [key, value] of Object.entries(outputEntries)) {
          if (Array.isArray(value)) {
            this.log(`${key}:`);
            value.forEach(obj => {
              Object.entries(obj).forEach(([k, v]) => {
                this.log(`  ${k}: ${v}`);
              });
              this.log('  ----------');
            });
          } else {
            this.log(`${key}: ${value}`);
          }
        }
      }
    }

    if (broadcastFailed) {
      process.exit(1);
    }
  }
}
