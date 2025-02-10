import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('validate-address', () => {
  it('runs validate-address for valid testnet address', async () => {
    const result = await runCommand([
      'validate-address',
      'ST38RMDQFVC462DSJ1CPEW5EYXEZKASQVC8XDGARN',
      '-n=testnet',
      '--verbose',
    ]);
    expect(result.error).to.be.undefined;
    expect(result.stdout.trim()).to.equal('1');
  });

  it('runs validate-address for invalid testnet address', async () => {
    const result = await runCommand([
      'validate-address',
      'SP3XXK8BG5X7CRH7W07RRJK3JZJXJ799WX3Y0SMCR',
      '-n=testnet',
      '--verbose',
    ]);
    expect(result.error).to.deep.include({
      code: 'EEXIT',
      oclif: { exit: 1 },
    });
    expect(result.stdout.trim()).to.equal('0\nValid address but incorrect network version (address version: 22, expected: 26 or 21)');
  });

  it('runs validate-address for valid mainnet address', async () => {
    const result = await runCommand([
      'validate-address',
      'SP3XXK8BG5X7CRH7W07RRJK3JZJXJ799WX3Y0SMCR',
      '-n=mainnet',
      '--verbose',
    ]);
    expect(result.error).to.be.undefined;
    expect(result.stdout.trim()).to.equal('1');
  });

  it('runs validate-address for invalid mainnet address', async () => {
    const result = await runCommand([
      'validate-address',
      'ST38RMDQFVC462DSJ1CPEW5EYXEZKASQVC8XDGARN',
      '-n=mainnet',
      '--verbose',
    ]);
    expect(result.error).to.deep.include({
      code: 'EEXIT',
      oclif: { exit: 1 },
    });
    expect(result.stdout.trim()).to.equal('0\nValid address but incorrect network version (address version: 26, expected: 22 or 20)');
  });

  it('runs validate-address for non-address input string', async () => {
    const result = await runCommand([
      'validate-address',
      'bogus-value',
      '-n=testnet',
      '--verbose',
    ]);
    expect(result.error).to.deep.include({
      code: 'EEXIT',
      oclif: { exit: 2 },
    });
    expect(result.stdout.trim()).to.equal('0\nError: Invalid c32 address: must start with "S"');
  });
})
