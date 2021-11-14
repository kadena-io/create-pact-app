/*

BLOCKCHAIN CONFIGURATION FILE

  initalize all data for pact-lang-api kadena blockchain calls

  modify this file to interact with different
    chains, networks, contracts

  documentation:
    https://pact-language.readthedocs.io/en/stable/

  pact tutorials:
    https://pactlang.org/

*/

//chain that contract lives on
var chainId = "{{chainId}}";

//id of network version
var networkId = "{{networkId}}";

//network node
//TESTNET: api.testnet.chainweb.com
var node = "{{node}}";

//unique contract name
var contractName = "{{contractName}}";

//unique gas station contract name
var gasStationName = "{{gasStationName}}";

//namespace that precedes contract name
var namespace = "free";

//api host to send requests
var host = `https://${node}/chainweb/0.0/${networkId}/chain/${chainId}/pact`;

//creation time for request
var creationTime = () => Math.round(new Date().getTime() / 1000) - 15;

//JSON with all necessary blockchain call data
var kadenaAPI = {
  contractName: contractName,
  gasStationName: gasStationName,
  namespace: namespace,
  contractAddress: `${namespace}.${contractName}`,
  gasStationAddress: `${namespace}.${gasStationName}`,
  explorerURL: `https://explorer.chainweb.com/${networkId.slice(0, -2)}`,
  meta: {
    networkId: networkId,
    chainId: chainId,
    host: host,
    creationTime: creationTime,
    //gas price at lowest possible denomination
    gasPrice: 0.00000000001,
    //high gas limit for tx
    gasLimit: 10000,
    //time a tx lives in mempool since creationTime
    ttl: 28800,
    //sender === gas payer of the transaction
    //  set to our gas station account defined in memory-wall-gas-station.pact
    sender: "mw-free-gas",
    //nonce here doesnt matter since the tx will never have the same hash
    nonce: "some nonce that doesnt matter",
  },
};
