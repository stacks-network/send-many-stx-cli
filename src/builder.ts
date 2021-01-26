import {
  makeContractCall,
  tupleCV,
  standardPrincipalCV,
  uintCV,
  listCV,
  PostConditionMode,
  makeStandardSTXPostCondition,
  PostCondition,
  FungibleConditionCode,
  SignedContractCallOptions,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import BN from 'bn.js';

export interface Recipient {
  /**
   * c32 STX address
   */
  address: string;
  /**
   * Amount to send in uSTX
   */
  amount: string;
}

interface SendOptions {
  network: StacksNetwork;
  recipients: Recipient[];
  senderKey: string;
  contractIdentifier: string;
  nonce?: number;
}

export async function sendMany({
  recipients,
  network,
  senderKey,
  nonce,
}: SendOptions) {
  const postConditions: PostCondition[] = [];

  const recipientTuples = recipients.map(recipient => {
    postConditions.push(
      makeStandardSTXPostCondition(
        recipient.address,
        FungibleConditionCode.Equal,
        new BN(recipient.amount, 10)
      )
    );
    return tupleCV({
      to: standardPrincipalCV(recipient.address),
      ustx: uintCV(recipient.amount),
    });
  });

  const recipientListCV = listCV(recipientTuples);

  const options: SignedContractCallOptions = {
    contractAddress: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
    contractName: 'send-many',
    functionName: 'send-many',
    functionArgs: [recipientListCV],
    senderKey,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
    network,
  };

  if (nonce !== undefined) options.nonce = new BN(nonce, 10);

  const tx = await makeContractCall(options);

  return tx;
}

export function isNormalInteger(str: string) {
  var n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}
