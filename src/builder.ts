import {
  makeContractCall,
  tupleCV,
  standardPrincipalCV,
  uintCV,
  listCV,
  PostConditionMode,
  SignedContractCallOptions,
  getAddressFromPrivateKey,
  StandardPrincipalCV,
  UIntCV,
  BufferCV,
  bufferCVFromString,
  SignedTokenTransferOptions,
  makeSTXTokenTransfer,
  fetchFeeEstimate,
  Pc,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';

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
  feeMultiplier?: number;
  withMemo?: boolean;
}

interface SendStxTransferOptions {
  network: StacksNetwork;
  recipient: Recipient;
  senderKey: string;
  nonce?: number;
  feeMultiplier?: number;
  withMemo?: boolean;
}

interface RecipientTuple {
  to: StandardPrincipalCV;
  ustx: UIntCV;
  memo?: BufferCV;
  [key: string]: any;
}

export async function sendStxTransfer({
  recipient,
  network,
  senderKey,
  nonce,
  feeMultiplier,
  withMemo,
}: SendStxTransferOptions) {
  const sendAmount = BigInt(recipient.amount);

  const options: SignedTokenTransferOptions = {
    recipient: standardPrincipalCV(recipient.address),
    amount: sendAmount,
    senderKey,
    network,
  };
  if (withMemo) {
    options.memo = recipient.memo;
  }

  if (nonce !== undefined) options.nonce = nonce;

  if (feeMultiplier !== undefined) {
    const templateTx = await makeSTXTokenTransfer(options);
    const estimatedFee = await fetchFeeEstimate({ transaction: templateTx });
    const bumpedFee =
      (BigInt(estimatedFee) * (100n + BigInt(feeMultiplier))) / 100n;
    options.fee = bumpedFee;
  }

  const tx = await makeSTXTokenTransfer(options);

  return tx;
}

export async function sendMany({
  recipients,
  network,
  senderKey,
  contractIdentifier,
  nonce,
  feeMultiplier,
  withMemo,
}: SendOptions) {
  const [contractAddress, contractName] = contractIdentifier.split('.');

  let sum = 0n;

  const recipientTuples = recipients.map(recipient => {
    sum = sum + BigInt(recipient.amount);
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
      Pc.origin()
        .willSendEq(sum)
        .ustx(),
    ],
    network,
  };

  if (nonce !== undefined) options.nonce = nonce;

  if (feeMultiplier !== undefined) {
    const templateTx = await makeContractCall(options);
    const estimatedFee = await fetchFeeEstimate({ transaction: templateTx });
    const bumpedFee =
      (BigInt(estimatedFee) * (100n + BigInt(feeMultiplier))) / 100n;
    options.fee = bumpedFee;
  }

  const tx = await makeContractCall(options);

  return tx;
}

export function isNormalInteger(str: string) {
  var n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}

export function getAddress(privateKey: string, network: StacksNetwork) {
  return getAddressFromPrivateKey(privateKey, network);
}
