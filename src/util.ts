export const EXPLORER_URL = 'https://explorer.hiro.so/';

export function getExplorerUrlForTx(txid: string, network: string) {
  if (network !== 'mainnet' && network !== 'testnet') {
    return null;
  }

  txid = txid.replace(/^(?!0x)/, '0x');
  return `${EXPLORER_URL}txid/${txid}?chain=${network}`;
}
