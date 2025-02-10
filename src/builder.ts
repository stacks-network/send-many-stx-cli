import { StacksNetwork } from '@stacks/network';
import {
  bufferCVFromString,
  ClarityValue,
  fetchFeeEstimate,
  getAddressFromPrivateKey,
  listCV,
  makeContractCall,
  makeSTXTokenTransfer,
  Pc,
  PostConditionMode,
  SignedContractCallOptions,
  SignedTokenTransferOptions,
  standardPrincipalCV,
  tupleCV,
  TupleData,
  uintCV,
} from '@stacks/transactions';

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
  contractIdentifier: string;
  feeMultiplier?: number;
  network: StacksNetwork;
  nonce?: number;
  recipients: Recipient[];
  senderKey: string;
  withMemo?: boolean;
}

interface SendStxTransferOptions {
  feeMultiplier?: number;
  network: StacksNetwork;
  nonce?: number;
  recipient: Recipient;
  senderKey: string;
  withMemo?: boolean;
}

export async function sendStxTransfer({
  feeMultiplier,
  network,
  nonce,
  recipient,
  senderKey,
  withMemo,
}: SendStxTransferOptions) {
  const sendAmount = BigInt(recipient.amount);

  const options: SignedTokenTransferOptions = {
    amount: sendAmount,
    network,
    recipient: standardPrincipalCV(recipient.address),
    senderKey,
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
  contractIdentifier,
  feeMultiplier,
  network,
  nonce,
  recipients,
  senderKey,
  withMemo,
}: SendOptions) {
  const [contractAddress, contractName] = contractIdentifier.split('.');

  let sum = 0n;

  const recipientTuples = recipients.map(recipient => {
    sum += BigInt(recipient.amount);
    const recipientTuple: TupleData<ClarityValue> = {
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
    functionArgs: [recipientListCV],
    functionName: 'send-many',
    network,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      Pc.origin()
        .willSendEq(sum)
        .ustx(),
    ],
    senderKey,
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
  const n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}

export function getAddress(privateKey: string, network: StacksNetwork) {
  return getAddressFromPrivateKey(privateKey, network);
}
