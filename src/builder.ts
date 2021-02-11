import {
  makeContractCall,
  tupleCV,
  standardPrincipalCV,
  uintCV,
  listCV,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  SignedContractCallOptions,
  getAddressFromPrivateKey,
  TransactionVersion,
  ChainID,
  StandardPrincipalCV,
  UIntCV,
  BufferCV,
  bufferCVFromString,
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
  memo?: string;
}

interface SendOptions {
  network: StacksNetwork;
  recipients: Recipient[];
  senderKey: string;
  contractIdentifier: string;
  nonce?: number;
  withMemo?: boolean;
}

interface RecipientTuple {
  to: StandardPrincipalCV;
  ustx: UIntCV;
  memo?: BufferCV;
  [key: string]: any;
}

export async function sendMany({
  recipients,
  network,
  senderKey,
  contractIdentifier,
  nonce,
  withMemo,
}: SendOptions) {
  const [contractAddress, contractName] = contractIdentifier.split('.');

  const sender = getAddress(senderKey, network);
  let sum = new BN(0, 10);

  const recipientTuples = recipients.map(recipient => {
    sum = sum.add(new BN(recipient.amount, 10));
    const recipientTuple: RecipientTuple = {
      to: standardPrincipalCV(recipient.address),
      ustx: uintCV(recipient.amount),
    };
    if (withMemo) {
      recipientTuple.memo = bufferCVFromString(recipient.memo || '');
    }
    return tupleCV(recipientTuple);
  });

  const recipientListCV = listCV(recipientTuples);

  const options: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: 'send-many',
    functionArgs: [recipientListCV],
    senderKey,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardSTXPostCondition(
        sender,
        FungibleConditionCode.Equal,
        new BN(sum, 10)
      ),
    ],
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

export function getAddress(privateKey: string, network: StacksNetwork) {
  const transactionVersion =
    network.chainId === ChainID.Mainnet
      ? TransactionVersion.Mainnet
      : TransactionVersion.Testnet;
  return getAddressFromPrivateKey(privateKey, transactionVersion);
}
