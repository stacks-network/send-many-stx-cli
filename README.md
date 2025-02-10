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
* [`stx-bulk-transfer help [COMMAND]`](#stx-bulk-transfer-help-command)

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
<!-- commandsstop -->
