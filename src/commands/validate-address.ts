import {Args, Command, Flags} from '@oclif/core'
import { c32addressDecode, versions as NetworkVersions } from 'c32check';

type NetworkString = 'mainnet' | 'mocknet' | 'testnet';

export default class ValidateAddress extends Command {
  static override args = {
    address: Args.string({description: 'The address to validate'}),
  }
  static override description = `Validates whether the input is a valid STX address for the provided network.`;
  static override examples = [
    '<%= config.bin %> <%= command.id %> SP000000000000000000002Q6VF78 -n mainnet',
  ]
  static override flags = {
    network: Flags.string({
      char: 'n',
      default: 'mainnet',
      description: 'Which network to check for',
      options: ['mocknet', 'testnet', 'mainnet'],
    }),
    verbose: Flags.boolean({
      char: 'v',
      default: false,
      description: 'Print error information for invalid addresses',
      required: false,
    }),
  }
  static strict = true;

  getNetworkVersion(flags: { network: string }) {
    const networks = {
      mainnet: NetworkVersions.mainnet,
      mocknet: NetworkVersions.testnet,
      testnet: NetworkVersions.testnet,
    };

    return networks[flags.network as NetworkString];
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ValidateAddress)

    const { address } = args;

    if (!address) {
      throw new Error('No address specified, try --help');
    }

    const networkVersion = this.getNetworkVersion(flags);
    if (!networkVersion) {
      throw new Error('Invalid network');
    }

    let version: number;
    try {
      [version] = c32addressDecode(address);
    } catch (error) {
      this.log('0');
      if (flags.verbose) {
        this.log((error as Error).toString());
      }

      this.exit(2); // Exit code 2 means malformed STX address.
    }

    if (version === networkVersion.p2pkh || version === networkVersion.p2sh) {
      this.log('1');
    } else {
      this.log('0');
      if (flags.verbose) {
        this.log(
          `Valid address but incorrect network version (address version: ${version}, expected: ${networkVersion.p2pkh} or ${networkVersion.p2sh})`
        );
      }

      this.exit(1); // Exit code 1 means valid address but incorrect network version.
    }
  }
}
