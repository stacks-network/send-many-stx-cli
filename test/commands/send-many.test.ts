import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('send-many original', () => {
  it('runs send-many testnet', async () => {
    const result = await runCommand([
      'send-many',
      "STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,1",
      "ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,5",
      "-n=testnet",
      "-k=00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ]);
    expect(result.error).to.be.undefined;
    const expectedLines = [
      /^Transaction hex: [0-9a-fA-F]+/,
      /^Fee: \d+$/,
      /^Nonce: \d+$/,
      /^Contract: ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many$/,
      /^Sender: ST1W63XNV4T469XC3S0240P5J8XBW1BZ94DKFP647$/,
      /^Total amount: 6$/,
    ];
    // Split the string into lines and trim whitespace
    const lines = result.stdout.split('\n').map(line => line.trim());

    // Assert that each pattern is found in at least one line
    for (const pattern of expectedLines) {
      expect(lines.some(line => pattern.test(line)), `Expected a line matching: ${pattern}\nActual:\n${result.stdout}`).to.be.true;
    }
  });

  it('runs send-many mainnet', async () => {
    const result = await runCommand([
      'send-many',
      "SP16MQDBJB2BF21PJGX72R5XA1C32MY747ZSAR1QY,1",
      "SP2TA4FGB43WVAS8MVS6YCWTSN2BZNQ1ASGEAKSDD,5",
      "-n=mainnet",
      "-k=00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ]);
    expect(result.error).to.be.undefined;
    const expectedLines = [
      /^Transaction hex: [0-9a-fA-F]+/,
      /^Fee: \d+$/,
      /^Nonce: \d+$/,
      /^Contract: SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many$/,
      /^Sender: SP1W63XNV4T469XC3S0240P5J8XBW1BZ94EPACK14$/,
      /^Total amount: 6$/,
    ];
    // Split the string into lines and trim whitespace
    const lines = result.stdout.split('\n').map(line => line.trim());

    // Assert that each pattern is found in at least one line
    for (const pattern of expectedLines) {
      expect(lines.some(line => pattern.test(line)), `Expected a line matching: ${pattern}\nActual:\n${result.stdout}`).to.be.true;
    }
  });
})
