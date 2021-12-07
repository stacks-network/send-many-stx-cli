import { Command, flags } from '@oclif/command';
import { c32addressDecode, versions as NetworkVersions } from 'c32check';

type NetworkString = 'mocknet' | 'mainnet' | 'testnet';

export class ValidateAddress extends Command {
  static description = `Validates whether the input is a valid STX address for the provided network.
  
  Example usage:
  
  \`\`\`
  npx stx-bulk-transfer validate-address SP000000000000000000002Q6VF78 -n mainnet
  \`\`\`
  `;
  static strict = true;

  static flags = {
    help: flags.help({ char: 'h' }),
    network: flags.string({
      char: 'n',
      description: 'Which network to check for',
      options: ['mocknet', 'testnet', 'mainnet'],
      default: 'mainnet',
    }),
    verbose: flags.boolean({
      required: false,
      char: 'v',
      default: false,
      description: 'Print error information for invalid addresses',
    })
  };

  static args = [
    {
      name: 'address',
      description: `The address to validate`,
    },
  ];

  getNetworkVersion() {
    const { flags } = this.parse(ValidateAddress);

    const networks = {
      mainnet: NetworkVersions.mainnet,
      testnet: NetworkVersions.testnet,
      mocknet: NetworkVersions.testnet,
    };

    return networks[flags.network as NetworkString];
  }

  async run() {
    const { argv, flags } = this.parse(ValidateAddress);
    const [address] = argv;

    if (!address) {
      throw new Error('No address specified, try --help');
    }

    const networkVersion = this.getNetworkVersion();
    if (!networkVersion) {
      throw new Error('Invalid network');
    }

    try {
      const [version] = c32addressDecode(address);
      if (version === networkVersion.p2pkh || version === networkVersion.p2sh) {
        this.log('1');
      }
      else {
        this.log('0');
        process.exitCode = 1; // Exit code 1 means valid address but incorrect network version.
        if (flags.verbose) {
          this.log(`Valid address but incorrect network version (address version: ${version}, expected: ${networkVersion.p2pkh} or ${networkVersion.p2sh})`);
        }
      }
    }
    catch (error) {
      this.log('0');
      process.exitCode = 2; // Exit code 2 means malformed STX address.
      if (flags.verbose) {
        this.log(error as any);
      }
    }
  }
}
