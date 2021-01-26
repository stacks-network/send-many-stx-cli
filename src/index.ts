import {
  makeContractCall,
  tupleCV,
  standardPrincipalCV,
  uintCV,
  listCV,
  PostConditionMode,
  // broadcastTransaction,
} from '@stacks/transactions';
import { StacksMocknet } from '@stacks/network';
interface Recipient {
  /**
   * c32 STX address
   */
  address: string;
  /**
   * Amount to send in uSTX
   */
  amount: string;
}

export async function sendMany(recipients: Recipient[]) {
  const recipientTuples = recipients.map(recipient => {
    return tupleCV({
      to: standardPrincipalCV(recipient.address),
      ustx: uintCV(recipient.amount),
    });
  });
  const recipientListCV = listCV(recipientTuples);
  const network = new StacksMocknet();
  const tx = await makeContractCall({
    contractAddress: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
    contractName: 'send-many',
    functionName: 'send-many',
    functionArgs: [recipientListCV],
    senderKey:
      'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
    postConditionMode: PostConditionMode.Allow,
    network,
  });

  return tx;
}
