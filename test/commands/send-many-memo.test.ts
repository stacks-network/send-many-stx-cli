import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('send-many-memo', () => {
  it('runs send-many-memo testnet', async () => {
    const result = await runCommand([
      'send-many-memo',
      "STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,1,hello",
      "ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,5,memo2",
      "--jsonOutput",
      "-n=testnet",
      "-k=00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ]);
    expect(result.error).to.be.undefined;
    const outJson = JSON.parse(result.stdout);
    expect(outJson).to.deep.include({
      "contract": "ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many-memo",
      "recipients": [
        {
          "address": "STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW",
          "amount": "1",
          "memo": "hello"
        },
        {
          "address": "ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH",
          "amount": "5",
          "memo": "memo2"
        }
      ],
      "sender": "ST1W63XNV4T469XC3S0240P5J8XBW1BZ94DKFP647",
      "totalAmount": "6"
    });

    expect(outJson.fee).to.match(/^\d+$/);
    expect(outJson.nonce).to.match(/^\d+$/);
    expect(outJson.transactionHex).to.match(/^[0-9a-fA-F]+$/);
  });

  it('runs send-many-memo mainnet', async () => {
    const result = await runCommand([
      'send-many-memo',
      "SP16MQDBJB2BF21PJGX72R5XA1C32MY747ZSAR1QY,1,hello",
      "SP2TA4FGB43WVAS8MVS6YCWTSN2BZNQ1ASGEAKSDD,5,memo2",
      "--jsonOutput",
      "-n=mainnet",
      "-k=00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ]);
    expect(result.error).to.be.undefined;
    const outJson = JSON.parse(result.stdout);
    expect(outJson).to.deep.include({
      "contract": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo",
      "recipients": [
        {
          "address": "SP16MQDBJB2BF21PJGX72R5XA1C32MY747ZSAR1QY",
          "amount": "1",
          "memo": "hello"
        },
        {
          "address": "SP2TA4FGB43WVAS8MVS6YCWTSN2BZNQ1ASGEAKSDD",
          "amount": "5",
          "memo": "memo2"
        }
      ],
      "sender": "SP1W63XNV4T469XC3S0240P5J8XBW1BZ94EPACK14",
      "totalAmount": "6"
    });

    expect(outJson.fee).to.match(/^\d+$/);
    expect(outJson.nonce).to.match(/^\d+$/);
    expect(outJson.transactionHex).to.match(/^[0-9a-fA-F]+$/);
  });
});
