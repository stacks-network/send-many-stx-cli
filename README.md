# `@stacks/send-many-stx-cli`

A simple CLI for making a bulk STX transfer in one command.

It uses a Clarity contract to enable transfering STX to multiple recipients in one transaction.

Default contracts used:

Testnet: https://explorer.hiro.so/txid/STR8P3RD1EHA8AA37ERSSSZSWKS9T2GYQFGXNA4C.send-many?chain=testnet

Mainnet: https://explorer.hiro.so/txid/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many?chain=mainnet

# Usage
<!-- usage -->
```sh-session
$ npm install -g @stacks/send-many-stx-cli
$ stx-bulk-transfer COMMAND
running command...
$ stx-bulk-transfer (--version)
@stacks/send-many-stx-cli/3.0.0 linux-x64 node-v20.18.2
$ stx-bulk-transfer --help [COMMAND]
USAGE
  $ stx-bulk-transfer COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`stx-bulk-transfer deploy-contract [CONTRACT]`](#stx-bulk-transfer-deploy-contract-contract)
* [`stx-bulk-transfer help [COMMAND]`](#stx-bulk-transfer-help-command)
* [`stx-bulk-transfer send-many [RECIPIENTS]`](#stx-bulk-transfer-send-many-recipients)
* [`stx-bulk-transfer send-many-memo [RECIPIENTS]`](#stx-bulk-transfer-send-many-memo-recipients)
* [`stx-bulk-transfer send-many-memo-safe [RECIPIENTS]`](#stx-bulk-transfer-send-many-memo-safe-recipients)
* [`stx-bulk-transfer validate-address [ADDRESS]`](#stx-bulk-transfer-validate-address-address)

## `stx-bulk-transfer deploy-contract [CONTRACT]`

Deploy `send-many`, `send-many-memo`, `memo-expected`.

```
USAGE
  $ stx-bulk-transfer deploy-contract [CONTRACT] -k <value> [-b] [-n mocknet|testnet|mainnet] [-u <value>] [--nonce
    <value>] [-q]

ARGUMENTS
  CONTRACT  The contract to deploy

FLAGS
  -b, --broadcast           Whether to broadcast this transaction. Omitting this flag will not broadcast the
                            transaction.
  -k, --privateKey=<value>  (required) Your private key
  -n, --network=<option>    [default: testnet] Which network to broadcast this to
                            <options: mocknet|testnet|mainnet>
  -q, --quiet               Reduce logging from this command. If this flag is passed with the broadcast (-b) flag,
                            only the transaction ID will be logged. If the quiet flagged is passed without broadcast,
                            only the raw transaction hex will be logged.
  -u, --nodeUrl=<value>     A default node URL will be used based on the `network` option. Use this flag to manually
                            override.
      --nonce=<value>       Optionally specify a nonce for this transaction

DESCRIPTION
  Deploy `send-many`, `send-many-memo`, `memo-expected`.
  A utility to simplify deploying contracts related to the STX bulk transfer tool. It deploys
  the contract on the address of the provided private key.

  Valid choices are: send-many, send-many-memo, and memo-expected.

  The memo-expected contract is an empty contract that is checked by the `send-many-memo-safe`
  command. If a contract called 'memo-expected' is deployed on a principal, and no memo is passed,
  the send-many will be aborted before it reaches the chain.


EXAMPLES
  $ stx-bulk-transfer deploy-contract memo-expected -k my_private_key -n testnet -b
```

_See code: [src/commands/deploy-contract.ts](https://github.com/stacks-network/send-many-stx-cli/blob/v3.0.0/src/commands/deploy-contract.ts)_

## `stx-bulk-transfer help [COMMAND]`

Display help for stx-bulk-transfer.

```
USAGE
  $ stx-bulk-transfer help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for stx-bulk-transfer.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.24/src/commands/help.ts)_

## `stx-bulk-transfer send-many [RECIPIENTS]`

Execute a bulk STX transfer.

```
USAGE
  $ stx-bulk-transfer send-many [RECIPIENTS...] -k <value> [-a] [-b] [-c <value>] [-m <value>] [-n
    mocknet|testnet|mainnet] [-u <value>] [--nonce <value>] [-q]

ARGUMENTS
  RECIPIENTS...  A set of recipients in the format of "address,amount_ustx"
                 Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50

FLAGS
  -a, --allowSingleStxTransfer   If enabled and only a single recipient is specified, a STX-transfer transaction type
                                 will be used rather than a contract-call transaction.
                                 If omitted, a contract-call will always be used, which can be less efficient.
  -b, --broadcast                Whether to broadcast this transaction. Omitting this flag will not broadcast the
                                 transaction.
  -c, --contractAddress=<value>  Manually specify the contract address for send-many. If omitted, default contracts will
                                 be used.
  -k, --privateKey=<value>       (required) Your private key
  -m, --feeMultiplier=<value>    Optionally specify a fee multiplier. If passed, the tx fee will be (estimated fee +
                                 (estimated fee * multiplier)).
                                 For example, a fee multiplier of 15 for a tx with an estimated fee of 200 would result
                                 in a tx with the fee of 230.
  -n, --network=<option>         [default: testnet] Which network to broadcast this to
                                 <options: mocknet|testnet|mainnet>
  -q, --quiet                    Reduce logging from this command. If this flag is passed with the broadcast (-b) flag,
                                 only the transaction ID will be logged. If the quiet flagged is passed without
                                 broadcast,
                                 only the raw transaction hex will be logged.
  -u, --nodeUrl=<value>          A default node URL will be used based on the `network` option. Use this flag to
                                 manually override.
      --nonce=<value>            Optionally specify a nonce for this transaction

DESCRIPTION
  Execute a bulk STX transfer.
  The bulk transfer is executed in a single transaction by invoking a `contract-call` on the "send-many" contract.

  The default contracts can be found below:

  Testnet: https://explorer.hiro.so/txid/ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many?chain=testnet
  Mainnet: https://explorer.hiro.so/txid/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many?chain=mainnet

EXAMPLES
  $ stx-bulk-transfer send-many STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50 -k my_private_key -n testnet -b
```

_See code: [src/commands/send-many.ts](https://github.com/stacks-network/send-many-stx-cli/blob/v3.0.0/src/commands/send-many.ts)_

## `stx-bulk-transfer send-many-memo [RECIPIENTS]`

Execute a bulk STX transfer, with memos attached.

```
USAGE
  $ stx-bulk-transfer send-many-memo [RECIPIENTS...] -k <value> [-a] [-b] [-c <value>] [-m <value>] [-j] [-n
    mocknet|testnet|mainnet] [-u <value>] [--nonce <value>] [-q]

ARGUMENTS
  RECIPIENTS...  A set of recipients in the format of "address,amount_ustx,memo". Memo is optional.
                 Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,memo ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50

FLAGS
  -a, --allowSingleStxTransfer   If enabled and only a single recipient is specified, a STX-transfer transaction type
                                 will be used rather than a contract-call transaction.
                                 If omitted, a contract-call will always be used, which can be less efficient.
  -b, --broadcast                Whether to broadcast this transaction. Omitting this flag will not broadcast the
                                 transaction.
  -c, --contractAddress=<value>  Manually specify the contract address for send-many-memo. If omitted, default contracts
                                 will be used.
  -j, --jsonOutput               Output data in JSON format
  -k, --privateKey=<value>       (required) Your private key
  -m, --feeMultiplier=<value>    Optionally specify a fee multiplier. If passed, the tx fee will be (estimated fee +
                                 (estimated fee * multiplier)).
                                 For example, a fee multiplier of 15 for a tx with an estimated fee of 200 would result
                                 in a tx with the fee of 230.
  -n, --network=<option>         [default: testnet] Which network to broadcast this to
                                 <options: mocknet|testnet|mainnet>
  -q, --quiet                    Reduce logging from this command. If this flag is passed with the broadcast (-b) flag,
                                 only the transaction ID will be logged. If the quiet flagged is passed without
                                 broadcast,
                                 only the raw transaction hex will be logged.
  -u, --nodeUrl=<value>          A default node URL will be used based on the `network` option. Use this flag to
                                 manually override.
      --nonce=<value>            Optionally specify a nonce for this transaction

DESCRIPTION
  Execute a bulk STX transfer, with memos attached.
  The bulk transfer is executed in a single transaction by invoking a `contract-call` on the "send-many-memo" contract.

  The default contracts can be found below:

  Testnet: https://explorer.hiro.so/txid/ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many-memo?chain=testnet
  Mainnet: https://explorer.hiro.so/txid/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo?chain=mainnet

EXAMPLES
  $ stx-bulk-transfer send-many-memo STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,hello ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50,memo2 -k my_private_key -n testnet -b
```

_See code: [src/commands/send-many-memo.ts](https://github.com/stacks-network/send-many-stx-cli/blob/v3.0.0/src/commands/send-many-memo.ts)_

## `stx-bulk-transfer send-many-memo-safe [RECIPIENTS]`

Execute a bulk STX transfer, with memos attached, checking if the transfer is safe to send.

```
USAGE
  $ stx-bulk-transfer send-many-memo-safe [RECIPIENTS...] -k <value> [-a] [-b] [-c <value>] [-m <value>] [-j] [-n
    mocknet|testnet|mainnet] [-u <value>] [--nonce <value>] [-q]

ARGUMENTS
  RECIPIENTS...  A set of recipients in the format of "address,amount_ustx,memo". Memo is optional.
                 Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,memo ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50

FLAGS
  -a, --allowSingleStxTransfer   If enabled and only a single recipient is specified, a STX-transfer transaction type
                                 will be used rather than a contract-call transaction.
                                 If omitted, a contract-call will always be used, which can be less efficient.
  -b, --broadcast                Whether to broadcast this transaction. Omitting this flag will not broadcast the
                                 transaction.
  -c, --contractAddress=<value>  Manually specify the contract address for send-many-memo. If omitted, default contracts
                                 will be used.
  -j, --jsonOutput               Output data in JSON format
  -k, --privateKey=<value>       (required) Your private key
  -m, --feeMultiplier=<value>    Optionally specify a fee multiplier. If passed, the tx fee will be (estimated fee +
                                 (estimated fee * multiplier)).
                                 For example, a fee multiplier of 15 for a tx with an estimated fee of 200 would result
                                 in a tx with the fee of 230.
  -n, --network=<option>         [default: testnet] Which network to broadcast this to
                                 <options: mocknet|testnet|mainnet>
  -q, --quiet                    Reduce logging from this command. If this flag is passed with the broadcast (-b) flag,
                                 only the transaction ID will be logged. If the quiet flagged is passed without
                                 broadcast,
                                 only the raw transaction hex will be logged.
  -u, --nodeUrl=<value>          A default node URL will be used based on the `network` option. Use this flag to
                                 manually override.
      --nonce=<value>            Optionally specify a nonce for this transaction

DESCRIPTION
  Execute a bulk STX transfer, with memos attached, checking if the transfer is safe to send.
  The bulk transfer is executed in a single transaction by invoking a `contract-call` on the "send-many-memo" contract.

  The 'safe' counterpart of send-many-memo checks for the existence of a `memo-expected` contract for each recipient.
  If it exists, the transfer will be aborted if the corresponding memo is empty or missing. A utility command to deploy
  this contract is part of this tool: stx-bulk-transfer deploy-contract memo-expected.

  The default contracts can be found below:

  Testnet: https://explorer.hiro.so/txid/ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many-memo?chain=testnet
  Mainnet: https://explorer.hiro.so/txid/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo?chain=mainnet

EXAMPLES
  $ stx-bulk-transfer send-many-memo-safe STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100,hello ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50,memo2 -k my_private_key -n testnet -b
```

_See code: [src/commands/send-many-memo-safe.ts](https://github.com/stacks-network/send-many-stx-cli/blob/v3.0.0/src/commands/send-many-memo-safe.ts)_

## `stx-bulk-transfer validate-address [ADDRESS]`

Validates whether the input is a valid STX address for the provided network.

```
USAGE
  $ stx-bulk-transfer validate-address [ADDRESS] [-n mocknet|testnet|mainnet] [-v]

ARGUMENTS
  ADDRESS  The address to validate

FLAGS
  -n, --network=<option>  [default: mainnet] Which network to check for
                          <options: mocknet|testnet|mainnet>
  -v, --verbose           Print error information for invalid addresses

DESCRIPTION
  Validates whether the input is a valid STX address for the provided network.

EXAMPLES
  $ stx-bulk-transfer validate-address SP000000000000000000002Q6VF78 -n mainnet
```

_See code: [src/commands/validate-address.ts](https://github.com/stacks-network/send-many-stx-cli/blob/v3.0.0/src/commands/validate-address.ts)_
<!-- commandsstop -->
<!-- commandsstop -->
