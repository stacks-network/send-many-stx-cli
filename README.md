# `@stacks/send-many-stx-cli`

A simple CLI for making a bulk STX transfer in one command.

It uses a Clarity contract to enable transfering STX to multiple recipients in one transaction.

Default contracts used:

Testnet: https://explorer.stacks.co/txid/STR8P3RD1EHA8AA37ERSSSZSWKS9T2GYQFGXNA4C.send-many?chain=testnet

Mainnet: https://explorer.stacks.co/txid/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many?chain=mainnet

# Usage

  <!-- usage -->
```sh-session
$ npm install -g @stacks/send-many-stx-cli
$ stx-bulk-transfer COMMAND
running command...
$ stx-bulk-transfer (-v|--version|version)
@stacks/send-many-stx-cli/1.2.0 darwin-x64 node-v14.16.1
$ stx-bulk-transfer --help [COMMAND]
USAGE
  $ stx-bulk-transfer COMMAND
...
```
<!-- usagestop -->

# Commands

  <!-- commands -->
* [`stx-bulk-transfer deploy-contract [CONTRACT]`](#stx-bulk-transfer-deploy-contract-contract)
* [`stx-bulk-transfer send-many [RECIPIENTS]`](#stx-bulk-transfer-send-many-recipients)
* [`stx-bulk-transfer send-many-memo [RECIPIENTS]`](#stx-bulk-transfer-send-many-memo-recipients)
* [`stx-bulk-transfer send-many-memo-safe [RECIPIENTS]`](#stx-bulk-transfer-send-many-memo-safe-recipients)

## `stx-bulk-transfer deploy-contract [CONTRACT]`

Deploy `send-many`, `send-many-memo`, `memo-expected`.

```
USAGE
  $ stx-bulk-transfer deploy-contract [CONTRACT]

ARGUMENTS
  CONTRACT  The contract to deploy

OPTIONS
  -b, --broadcast                        Whether to broadcast this transaction. Omitting this flag will not broadcast
                                         the transaction.

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
  A utility to simplify deploying contracts related to the STX bulk transfer tool. It deploys
     the contract on the address of the provided private key.

     Valid choices are: send-many, send-many-memo, and memo-expected.

     The memo-expected contract is an empty contract that is checked by the `send-many-memo-safe`
     command. If a contract called 'memo-expected' is deployed on a principal, and no memo is passed,
     the send-many will be aborted before it reaches the chain.

     Example usage:

     ```
     npx stx-bulk-transfer deploy-contract memo-expected -k my_private_key -n testnet -b
     ```
```

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

     Testnet: https://explorer.stacks.co/txid/STR8P3RD1EHA8AA37ERSSSZSWKS9T2GYQFGXNA4C.send-many?chain=testnet
     Mainnet: https://explorer.stacks.co/txid/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many?chain=mainnet

     Example usage:

     ```
     npx stx-bulk-transfer send-many STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 
  ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50 -k my_private_key -n testnet -b
     ```
```

## `stx-bulk-transfer send-many-memo [RECIPIENTS]`

Execute a bulk STX transfer, with memos attached.

```
USAGE
  $ stx-bulk-transfer send-many-memo [RECIPIENTS]

ARGUMENTS
  RECIPIENTS  A set of recipients in the format of "address,amount_ustx,memo". Memo is optional.
              Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,memo ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50

OPTIONS
  -b, --broadcast                        Whether to broadcast this transaction. Omitting this flag will not broadcast
                                         the transaction.

  -c, --contractAddress=contractAddress  Manually specify the contract address for send-many-memo. If omitted, default
                                         contracts will be used.

  -h, --help                             show CLI help

  -j, --jsonOutput                       Output data in JSON format

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
  The bulk transfer is executed in a single transaction by invoking a `contract-call` on the "send-many-memo" contract.

     The default contracts can be found below:

     Testnet: https://explorer.stacks.co/txid/STR8P3RD1EHA8AA37ERSSSZSWKS9T2GYQFGXNA4C.send-many-memo?chain=testnet
     Mainnet: https://explorer.stacks.co/txid/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo?chain=mainnet

     Example usage:

     ```
     npx stx-bulk-transfer send-many-memo STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,hello 
  ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50,memo2 -k my_private_key -n testnet -b
     ```
```

## `stx-bulk-transfer send-many-memo-safe [RECIPIENTS]`

Execute a bulk STX transfer, with memos attached, checking if the transfer is safe to send.

```
USAGE
  $ stx-bulk-transfer send-many-memo-safe [RECIPIENTS]

ARGUMENTS
  RECIPIENTS  A set of recipients in the format of "address,amount_ustx,memo". Memo is optional.
              Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,memo ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50

OPTIONS
  -b, --broadcast                        Whether to broadcast this transaction. Omitting this flag will not broadcast
                                         the transaction.

  -c, --contractAddress=contractAddress  Manually specify the contract address for send-many-memo. If omitted, default
                                         contracts will be used.

  -h, --help                             show CLI help

  -j, --jsonOutput                       Output data in JSON format

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
  The bulk transfer is executed in a single transaction by invoking a `contract-call` on the "send-many-memo" contract.

     The 'safe' counterpart of send-many-memo checks for the existence of a `memo-expected` contract for each recipient.
     If it exists, the transfer will be aborted if the corresponding memo is empty or missing. A utility command to 
  deploy
     this contract is part of this tool: stx-bulk-transfer deploy-contract memo-expected.

     The default contracts can be found below:

     Testnet: https://explorer.stacks.co/txid/STR8P3RD1EHA8AA37ERSSSZSWKS9T2GYQFGXNA4C.send-many-memo?chain=testnet
     Mainnet: https://explorer.stacks.co/txid/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo?chain=mainnet

     Example usage:

     ```
     npx stx-bulk-transfer send-many-memo-safe STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,hello 
  ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50,memo2 -k my_private_key -n testnet -b
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
