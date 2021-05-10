import { Command, flags } from '@oclif/command';
import { sendMany, Recipient, isNormalInteger, getAddress } from '../builder';
import {
  StacksMocknet,
  StacksMainnet,
  StacksTestnet,
  StacksNetwork,
} from '@stacks/network';
import {
  broadcastTransaction,
  ChainID,
  makeContractDeploy,
  validateStacksAddress,
} from '@stacks/transactions';
import { STXPostCondition } from '@stacks/transactions/dist/transactions/src/postcondition';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';

type NetworkString = 'mocknet' | 'mainnet' | 'testnet';

const DEFAULT_TESTNET_CONTRACT =
  'STR8P3RD1EHA8AA37ERSSSZSWKS9T2GYQFGXNA4C.send-many-memo';
const DEFAULT_MAINNET_CONTRACT =
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo';

async function checkMemoExpected(
  network: StacksNetwork,
  recipients: Recipient[]
): Promise<string[]> {
  const results = await Promise.all(
    recipients
      .filter(recipient => recipient.memo?.length === 0)
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

export class SendManyMemo extends Command {
  static description = `Execute a bulk STX transfer, with memos attached.
  The bulk transfer is executed in a single transaction by invoking a \`contract-call\` on the "send-many-memo" contract.

  The default contracts can be found below:

  Testnet: https://explorer.stacks.co/txid/${DEFAULT_TESTNET_CONTRACT}?chain=testnet
  Mainnet: https://explorer.stacks.co/txid/${DEFAULT_MAINNET_CONTRACT}?chain=mainnet

  Example usage:

  \`\`\`
  npx stx-bulk-transfer send-many-memo STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,hello ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50,memo2 -k my_private_key -n testnet -b
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
    checkMemoExpected: flags.boolean({
      required: false,
      char: 'm',
      default: true,
      description:
        'Check if memos are expected for each recipient. Defaults to true.',
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
        'Manually specify the contract address for send-many-memo. If omitted, default contracts will be used.',
    }),
    nonce: flags.integer({
      description: 'Optionally specify a nonce for this transaction',
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
    const { flags } = this.parse(SendManyMemo);
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

  async deployContract(network: StacksNetwork, privateKey: string) {
    const tx = await makeContractDeploy({
      contractName: 'send-many-memo',
      codeBody: await fs.readFile('./contracts/send-many-memo.clar', 'utf8'),
      senderKey: privateKey,
      network,
    });
    const result = await broadcastTransaction(tx, network);
    if (typeof result !== 'string' && result.reason !== 'ContractAlreadyExists')
      throw new Error(
        `Could not deploy send-many-memo on mocknet. Reason: ${result.reason}`
      );
    return `${getAddress(privateKey, network)}.send-many-memo`;
  }

  async run() {
    const { argv, flags } = this.parse(SendManyMemo);

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
    const network = new networkClass();
    if (flags.nodeUrl) {
      network.coreApiUrl = flags.nodeUrl;
    }

    if (flags.checkMemoExpected) {
      const expected = await checkMemoExpected(network, recipients);
      if (expected.length) {
        throw new Error(`Memo expected for: ${expected.join(', ')}`);
      }
    }

    const contractIdentifier =
      flags.contractAddress || network instanceof StacksMocknet
        ? await this.deployContract(network, flags.privateKey)
        : this.getContract(network);

    const tx = await sendMany({
      recipients,
      network,
      senderKey: flags.privateKey,
      contractIdentifier,
      nonce: flags.nonce,
      withMemo: true,
    });

    const verbose = !flags.quiet;

    if (verbose) {
      this.log('Recipients:');
      recipients.forEach(r => {
        this.log(`Address: ${r.address}`);
        this.log(`Amount: ${r.amount}`);
        this.log(`Memo: ${r.memo || ''}`);
        this.log('----------');
      });
      this.log('Fee:', tx.auth.getFee().toString());
      this.log('Nonce:', tx.auth.spendingCondition?.nonce.toNumber());
      this.log('Contract:', contractIdentifier);
      this.log('Sender:', getAddress(flags.privateKey, network));
      const [postCondition] = tx.postConditions.values as STXPostCondition[];
      this.log('Total amount:', postCondition.amount.toNumber());
      this.log('Transaction hex:', tx.serialize().toString('hex'));
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
