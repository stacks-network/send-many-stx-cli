import { Command, flags } from '@oclif/command';
import { getAddress } from '../builder';
import {
  STACKS_MOCKNET,
  STACKS_MAINNET,
  STACKS_TESTNET,
  networkFrom,
} from '@stacks/network';
import {
  broadcastTransaction,
  ContractDeployOptions,
  makeContractDeploy,
} from '@stacks/transactions';
import { promises as fs } from 'fs';

type NetworkString = 'mocknet' | 'mainnet' | 'testnet';
type Contract = 'send-many' | 'send-many-memo' | 'memo-expected';

function isValidContract(input: string): input is Contract {
  return (
    input === 'send-many' ||
    input === 'send-many-memo' ||
    input === 'memo-expected'
  );
}

export class DeployContract extends Command {
  static description = `Deploy \`send-many\`, \`send-many-memo\`, \`memo-expected\`.
  A utility to simplify deploying contracts related to the STX bulk transfer tool. It deploys
  the contract on the address of the provided private key.

  Valid choices are: send-many, send-many-memo, and memo-expected.

  The memo-expected contract is an empty contract that is checked by the \`send-many-memo-safe\`
  command. If a contract called 'memo-expected' is deployed on a principal, and no memo is passed,
  the send-many will be aborted before it reaches the chain.

  Example usage:

  \`\`\`
  npx stx-bulk-transfer deploy-contract memo-expected -k my_private_key -n testnet -b
  \`\`\`
  `;
  static strict = true;

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
    nonce: flags.integer({
      description: 'Optionally specify a nonce for this transaction',
    }),
  };

  static args = [
    {
      name: 'contract',
      description: `The contract to deploy`,
    },
  ];

  getNetwork() {
    const { flags } = this.parse(DeployContract);

    const networks = {
      mainnet: STACKS_MAINNET,
      testnet: STACKS_TESTNET,
      mocknet: STACKS_MOCKNET,
    };

    return networks[flags.network as NetworkString];
  }

  async getContractCode(contract: Contract) {
    if (contract === 'memo-expected') return '(print "ok")';
    return await fs.readFile(`./contracts/${contract}.clar`, 'utf8');
  }

  async run() {
    const { argv, flags } = this.parse(DeployContract);
    const [contract] = argv;

    if (!contract) {
      throw new Error('No contract specified, try --help');
    }
    if (!isValidContract(contract)) {
      throw new Error(`Invalid contract ${contract}`);
    }

    const networkClass = this.getNetwork();
    if (!networkClass) {
      throw new Error('Unable to get network');
    }
    const network = networkFrom(networkClass);
    if (flags.nodeUrl) {
      network.client.baseUrl = flags.nodeUrl;
    }

    const txOptions: ContractDeployOptions = {
      contractName: contract,
      codeBody: await this.getContractCode(contract),
      senderKey: flags.privateKey,
      network,
    };
    if (flags.nonce !== undefined) {
      txOptions.nonce = flags.nonce;
    }
    const tx = await makeContractDeploy(txOptions);

    const verbose = !flags.quiet;

    if (verbose) {
      this.log('Transaction hex:', tx.serialize());
      this.log('Fee:', tx.auth.spendingCondition?.fee.toString());
      this.log('Nonce:', tx.auth.spendingCondition?.nonce.toString());
      this.log(
        'Contract address:',
        `${getAddress(flags.privateKey, network)}.${contract}`
      );
      this.log('Sender:', getAddress(flags.privateKey, network));
    }

    if (flags.broadcast) {
      try {
        const { txid: result } = await broadcastTransaction({
          transaction: tx,
          network,
        });
        if (verbose) {
          this.log('Transaction ID:', result);
          const explorerLink = `https://explorer.stacks.co/txid/0x${result}`;
          network.magicBytes !== STACKS_MOCKNET.magicBytes &&
            this.log(
              'View in explorer:',
              `${explorerLink}?chain=${
                network.chainId === STACKS_MAINNET.chainId
                  ? 'mainnet'
                  : 'testnet'
              }`
            );
        } else {
          console.log(result.toString());
        }
      } catch (error) {
        console.error('Error broadcasting transaction:', error);
        process.exit(1);
      }
    } else if (flags.quiet) {
      console.log(tx.serialize());
    }
  }
}
