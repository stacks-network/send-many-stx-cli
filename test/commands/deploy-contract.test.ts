import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('deploy-contract', () => {
  it('runs deploy-contract send-many-memo testnet', async () => {
    const result = await runCommand([
      'deploy-contract',
      "send-many-memo",
      "-n=testnet",
      "-k=00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ]);
    expect(result.error).to.be.undefined;
  
    const expectedLines = [
      /^Transaction hex: [0-9a-fA-F]+$/,
      /^Fee: \d+$/,
      /^Nonce: \d+$/,
      /^Contract address: ST1W63XNV4T469XC3S0240P5J8XBW1BZ94DKFP647.send-many-memo$/,
      /^Sender: ST1W63XNV4T469XC3S0240P5J8XBW1BZ94DKFP647$/,
    ];

    // Split the string into lines and trim whitespace
    const lines = result.stdout.split('\n').map(line => line.trim());

    // Assert that each pattern is found in at least one line
    for (const pattern of expectedLines) {
      expect(lines.some(line => pattern.test(line)), `Expected a line matching: ${pattern}\nActual:\n${result.stdout}`).to.be.true;
    }
  })

  it('runs deploy-contract send-many-memo mainnet', async () => {
    const result = await runCommand([
      'deploy-contract',
      "send-many-memo",
      "-n=mainnet",
      "-k=00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ]);
    expect(result.error).to.be.undefined;

    const expectedLines = [
      /^Transaction hex: [0-9a-fA-F]+$/,
      /^Fee: \d+$/,
      /^Nonce: \d+$/,
      /^Contract address: SP1W63XNV4T469XC3S0240P5J8XBW1BZ94EPACK14.send-many-memo$/,
      /^Sender: SP1W63XNV4T469XC3S0240P5J8XBW1BZ94EPACK14$/,
    ];

    // Split the string into lines and trim whitespace
    const lines = result.stdout.split('\n').map(line => line.trim());

    // Assert that each pattern is found in at least one line
    for (const pattern of expectedLines) {
      expect(lines.some(line => pattern.test(line)), `Expected a line matching: ${pattern}\nActual:\n${result.stdout}`).to.be.true;
    }
  })
})
