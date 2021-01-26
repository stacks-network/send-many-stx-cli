# `@stacks/bulk-send-cli`

A simple CLI for making a bulk STX transfer in one command.

# Usage

  <!-- usage -->
```sh-session
$ npm install -g @stacks/send-many-stx-cli
$ @stacks/send-many-stx-cli COMMAND
running command...
$ @stacks/send-many-stx-cli (-v|--version|version)
@stacks/send-many-stx-cli/0.1.1 darwin-x64 node-v14.15.1
$ @stacks/send-many-stx-cli --help [COMMAND]
USAGE
  $ @stacks/send-many-stx-cli COMMAND
...
```
<!-- usagestop -->

# Commands

  <!-- commands -->
* [`@stacks/send-many-stx-cli send-many [RECIPIENT]`](#stackssend-many-stx-cli-send-many-recipient)

## `@stacks/send-many-stx-cli send-many [RECIPIENT]`

Execute a bulk STX transfer.

```
USAGE
  $ @stacks/send-many-stx-cli send-many [RECIPIENT]

ARGUMENTS
  RECIPIENT  A set of recipients in the format of "address,amount_ustx"
             Example: STADMRP577SC3MCNP7T3PRSTZBJ75FJ59JGABZTW,100 ST2WPFYAW85A0YK9ACJR8JGWPM19VWYF90J8P5ZTH,50

OPTIONS
  -b, --broadcast                        Whether to broadcast this transaction or not.

  -c, --contractAddress=contractAddress  Manually specify the contract address for send-many. If omitted, default
                                         contracts will be used.

  -h, --help                             show CLI help

  -k, --privateKey=privateKey            (required) Your private key

  -n, --network=mocknet|testnet|mainnet  [default: testnet] Which network to broadcast this to

  -u, --nodeUrl=nodeUrl

  -v, --verbose

DESCRIPTION
  The bulk transfer is executed in a single transaction by invoking a `contract-call` on the "send-many" contract.

     The default contracts can be found below:

     Testnet: https://explorer.stacks.co/txid/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6.send-many?chain=testnet
     Mainnet: https://explorer.stacks.co/txid/not-deployed?chain=mainnet
```
<!-- commandsstop -->
