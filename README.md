# `@stacks/bulk-send-cli`

A simple CLI for making a bulk STX transfer in one command.

# Usage

  <!-- usage -->
```sh-session
$ npm install -g @stacks/send-many-stx-cli
$ stx-bulk-transfer COMMAND
running command...
$ stx-bulk-transfer (-v|--version|version)
@stacks/send-many-stx-cli/0.2.2 darwin-x64 node-v14.15.1
$ stx-bulk-transfer --help [COMMAND]
USAGE
  $ stx-bulk-transfer COMMAND
...
```
<!-- usagestop -->

# Commands

  <!-- commands -->
* [`stx-bulk-transfer send-many [RECIPIENTS]`](#stx-bulk-transfer-send-many-recipients)

## `stx-bulk-transfer send-many [RECIPIENTS]`

Execute a bulk STX transfer.

```
USAGE
  $ stx-bulk-transfer send-many [RECIPIENTS]

ARGUMENTS
  RECIPIENTS  A set of recipients in the format of "address,amount_ustx"
              Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50

OPTIONS
  -b, --broadcast                        Whether to broadcast this transaction. Omitting this flag will not broadcast
                                         the transaction.

  -c, --contractAddress=contractAddress  Manually specify the contract address for send-many. If omitted, default
                                         contracts will be used.

  -h, --help                             show CLI help

  -k, --privateKey=privateKey            (required) Your private key

  -n, --network=mocknet|testnet|mainnet  [default: testnet] Which network to broadcast this to

  -q, --quiet                            Reduce logging from this command. If this flag is passed with the broadcast
                                         (-b) flag,
                                         only the transaction ID will be logged. If the quiet flagged is passed without
                                         broadcast,
                                         only the raw transaction hex will be logged.

  -u, --nodeUrl=nodeUrl                  A default node URL will be used based on the `network` option. Use this flag to
                                         manually override.

  --nonce=nonce                          Optionally specify a nonce for this transaction

DESCRIPTION
  The bulk transfer is executed in a single transaction by invoking a `contract-call` on the "send-many" contract.

     The default contracts can be found below:

     Testnet: https://explorer.stacks.co/txid/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6.send-many?chain=testnet
     Mainnet: https://explorer.stacks.co/txid/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many?chain=mainnet

     Example usage:

     ```
     npx stx-bulk-transfer STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50 -k 
  my_private_key -n testnet -b
     ```
```
<!-- commandsstop -->

## Development

To run the CLI:

```bash
yarn start ARGS_AND_FLAGS
```

This package uses `@vercel/ncc` to package the CLI into a single file. `yarn build` will also automatically update this README.

```bash
yarn build
```

To run the executable:

```bash
./bin/run ARGS_AND_FLAGS
```
