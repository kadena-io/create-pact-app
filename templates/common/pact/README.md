This project was bootstrapped with [Create Pact App](https://github.com/kadena-io/create-pact-app).


Installing Pact
===============================

##### please visit the [Pact repo](https://github.com/kadena-io/pact#installing-pact) for installation instructions

Pact Files
===============

## `memory-wall.pact`
- main smart contract logic

## `memory-wall.repl`
- tests for memory-wall smart contract
- to run open `pact` in terminal in this directory
  - type `(load "memory-wall.pact" true)` and press enter

## `memory-wall-gas-station.pact`
- smart contract for gas station
- defines a module then creates a gas station account
- specify this account as the transaction sender (gas payer) so your users don't have to pay for gas!

Deploying Contracts
===============

**NOTE**: if you did not select `deploy-own` option you can skip this step

## modifying files

#### `memory-wall.pact`
- notice your contract is generated with a unique name
- inside the `(defcap GOVERNANCE ...)` function follow comments to establish if and how the contract can be updgraded
  - `true` anyone can upgrade it anytime **UNSAFE**
  - `false` no one can upgrade it anytime
  - `keyset` owners of keyset can modify file anytime
    - also follow `(define-keyset)` instructions at the top of the file
  - `account` specified KDA account can modify file anytime
    - must be an existing account!

#### `memory-wall-gas-station.pact` **OPTIONAL**
- inside the `(defcap GOVERNANCE ...)` function follow comments to establish if and how the contract can be updgraded
  - `true` anyone can upgrade it anytime **UNSAFE**
  - `false` no one can upgrade it anytime
  - `keyset` owners of keyset can modify file anytime
    - also follow `(define-keyset)` instructions at the top of the file
  - `account` specified KDA account can modify file anytime
    - must be an existing account!
- inside the `(coin.transfer-create ...)` function at the end of the file follow the prepending comments
  - you need to specify
    - your account with KDA funds
    - unique name for the gas station account
- **REMEMBER**: you must change the `sender` field in the `kadena-config.js` file to your unique gas station account name

## deploy script
- in this directory run `node deploy.js` specifying `memory-wall.repl`
  - follow all the cli steps
- **OPTIONAL** repeat with `memory-wall-gas-station.repl` if you would like to also deploy a gas station
