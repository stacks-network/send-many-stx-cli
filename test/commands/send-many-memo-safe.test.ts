import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('send-many-memo-safe', () => {
  it('runs send-many-memo-safe and rejects missing memo', async () => {
    const result = await runCommand([
      "send-many-memo-safe",
      "ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B,1", // this account has ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.memo-expected deployed
      "--jsonOutput",
      "-n=testnet",
      "-k=00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ]);
    expect(result.error).to.deep.include({ code: 'EEXIT' });
    const outJson = JSON.parse(result.stdout);
    expect(outJson).to.deep.include(
      {
        "memoExpectedRecipients": [
          "ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B"
        ],
        "success": false,
      }
    );
  })
})
