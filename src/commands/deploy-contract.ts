import {Args, Command, Flags} from '@oclif/core'
import {
  networkFrom,
  STACKS_MAINNET,
  STACKS_MOCKNET,
  STACKS_TESTNET,
} from '@stacks/network';
import {
  broadcastTransaction,
  ContractDeployOptions,
  makeContractDeploy,
} from '@stacks/transactions';
import { promises as fs } from 'node:fs';

import { getAddress } from '../builder';
import { getExplorerUrlForTx } from '../util';

type NetworkString = 'mainnet' | 'mocknet' | 'testnet';
type Contract = 'memo-expected' | 'send-many' | 'send-many-memo';

function isValidContract(input: string): input is Contract {
  return (
    input === 'send-many' ||
    input === 'send-many-memo' ||
    input === 'memo-expected'
  );
}

export default class DeployContract extends Command {
  static override args = {
    contract: Args.string({description: 'The contract to deploy'}),
  }
  static description = `Deploy \`send-many\`, \`send-many-memo\`, \`memo-expected\`.
  A utility to simplify deploying contracts related to the STX bulk transfer tool. It deploys
  the contract on the address of the provided private key.

  Valid choices are: send-many, send-many-memo, and memo-expected.

  The memo-expected contract is an empty contract that is checked by the \`send-many-memo-safe\`
  command. If a contract called 'memo-expected' is deployed on a principal, and no memo is passed,
  the send-many will be aborted before it reaches the chain.
  `;
  static override examples = [
    '<%= config.bin %> <%= command.id %> memo-expected -k my_private_key -n testnet -b',
  ];
  static override flags = {
    broadcast: Flags.boolean({
      char: 'b',
      default: false,
      description:
        'Whether to broadcast this transaction. Omitting this flag will not broadcast the transaction.',
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
  static strict = true;

  async getContractCode(contract: Contract) {
    if (contract === 'memo-expected') return '(print "ok")';
    let contractSrc = await fs.readFile(`./contracts/${contract}.clar`, 'utf8');
    // replace Windows newlines with LF
    contractSrc = contractSrc.replaceAll('\r\n', '\n');
    return contractSrc; 
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
    const {args, flags} = await this.parse(DeployContract)

    const { contract } = args;

    if (!contract) {
      throw new Error('No contract specified, try --help');
    }

    if (!isValidContract(contract)) {
      throw new Error(`Invalid contract ${contract}`);
    }

    const networkClass = this.getNetwork(flags);
    if (!networkClass) {
      throw new Error('Unable to get network');
    }

    const network = networkFrom(networkClass);
    if (flags.nodeUrl) {
      network.client.baseUrl = flags.nodeUrl;
    }

    const txOptions: ContractDeployOptions = {
      codeBody: await this.getContractCode(contract),
      contractName: contract,
      network,
      senderKey: flags.privateKey,
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
        console.error('Error broadcasting transaction:', error);
        this.exit(1);
      }
    } else if (flags.quiet) {
      console.log(tx.serialize());
    }
  }
}
