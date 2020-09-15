create-pact-app
===============

Fastest way to get started building apps using [Kadena's](https://kadena.io/) blockchain!

Prerequisites
=============

Make sure you have a [current version of Node.js](https://nodejs.org/en/about/releases/) installed – we are targeting versions `12+`.
You should also have [npm](https://www.npmjs.com/) or [yarn](https://classic.yarnpkg.com/en/docs/cli/create/) installed to run the app


Getting Started
===============

***TEMPORARY!!*** (will change to `$ create-near-app`)

from same directory where you cloned `create-pact-app`

    $ node create-pact-app/index.js

Project Options
===============

You will be presented with several cli options

- **Project Name**:
  - any string with what you want to name the project
- **Platform**: chose frontend framework
  - `react` will initialize a React.js frontend
  - `vanilla` will initialize a plain html + javascript frontend
- **Signing**: how you want to sign for the blockchain transactions
  - `gas-station`: no need to pay for gas
  - `wallet`: uses [Chainweaver](https://www.kadena.io/chainweaver) wallet to pay for gas
- **Contract**:
  - `deployed`: interact with a previously deployed contract
  - `deploy-own`: deploy own contract before interacting with it
- **Network**:
  - `testnet`: interacts with Kadena [testnet](https://explorer.chainweb.com/testnet)
  - `mainnet`: interacts with Kadena [mainnet](https://explorer.chainweb.com)
- **Chain ID**
  - `0-19`: select to interact with any chain from `0` to `19`

License
=======

This repository is distributed under the terms of both the MIT license and the Apache License (Version 2.0).
See [LICENSE](LICENSE) and [LICENSE-APACHE](LICENSE-APACHE) for details.
