//basic React api imports
import React, { useState, useEffect } from "react";
//semantic ui for styling
import {
  Segment,
  Input,
  Button,
  Feed,
  Icon,
  Message,
  Loader,
} from "semantic-ui-react";
//pact-lang-api for blockchain calls
import Pact from "pact-lang-api";
//config file for blockchain calls
import { kadenaAPI } from "./kadena-config.js";

const App = () => {
  /*

    REACT COMPONENT SETUP

      we will make use of standard react apis

      useState -> page state management
      useEffect -> fetch existing memories on page load

  */

  //useState api
  //  keep track of the blockchain call status
  const [txStatus, setTxStatus] = useState("");
  //  list of all memories
  const [memories, setMemories] = useState([]);
  //  user inputed memory
  const [memory, setMemory] = useState("");
  //  blockchain transaction result
  const [tx, setTx] = useState({});

  //useEffect api
  //  fetches existing memories from blockchain at page load
  useEffect(() => {
    getMemories();
  }, []);

  /*

    BLOCKCHAIN TRANSACTIONS

      use pact-lang-api npm package to interact with Kadena blockchain networks
        https://github.com/kadena-io/pact-lang-api

      all transaction setup is ./kadena-config.js

  */

  //local call
  //  reads from blockchain previously posted memories
  const getMemories = async () => {
    //calling get-all() function from smart contract
    const res = await Pact.fetch.local(
      {
        pactCode: `(${kadenaAPI.contractAddress}.get-all)`,
        //pact-lang-api function to construct transaction meta data
        meta: Pact.lang.mkMeta(
          kadenaAPI.meta.sender,
          kadenaAPI.meta.chainId,
          kadenaAPI.meta.gasPrice,
          kadenaAPI.meta.gasLimit,
          kadenaAPI.meta.creationTime(),
          kadenaAPI.meta.ttl
        ),
      },
      kadenaAPI.meta.host
    );
    const all = res.result.data;
    //sorts memories by least recent
    all.sort((a, b) => a["block-height"].int - b["block-height"].int);
    console.log(all);
    setMemories(all);
  };

  //send call
  //  writes memory blockchain
  //  updates frontend depending on response
  const postMemory = async (user) => {
    try {
      //generates dummy keypair
      //  using gas stations means the keys do not need to have funds
      const kp = Pact.crypto.genKeyPair();
      //sends JSON content to blockchain
      const tx = await Pact.fetch.send(
        {
          networkId: kadenaAPI.meta.networkId,
          //calling here() function from smart contract
          //  writes text from 'user' variable to the memory wall
          pactCode: `(${kadenaAPI.contractAddress}.here ${JSON.stringify(
            user
          )})`,
          keyPairs: [
            {
              publicKey: kp.publicKey,
              secretKey: kp.secretKey,
              clist: [
                //capability to use gas station
                {
                  name: `${kadenaAPI.gasStationAddress}.GAS_PAYER`,
                  //args are irrelevant here just need to be the right type
                  args: ["hi", { int: 1 }, 1.0],
                },
              ],
            },
          ],
          //pact-lang-api function to construct transaction meta data
          meta: Pact.lang.mkMeta(
            kadenaAPI.meta.sender,
            kadenaAPI.meta.chainId,
            kadenaAPI.meta.gasPrice,
            kadenaAPI.meta.gasLimit,
            kadenaAPI.meta.creationTime(),
            kadenaAPI.meta.ttl
          ),
        },
        kadenaAPI.meta.host
      );
      //set state to wait for transaction response
      setTxStatus("pending");
      try {
        //listens to response to transaction sent
        //  note method will timeout in two minutes
        //    for lower level implementations checkout out Pact.fetch.poll() in pact-lang-api
        let res = await Pact.fetch.listen(
          { listen: tx.requestKeys[0] },
          kadenaAPI.meta.host
        );
        //keep transaction response in local state
        setTx(res);
        if (res.result.status === "success") {
          //set state for transaction success
          setTxStatus("success");
        } else {
          //set state for transaction failure
          setTxStatus("failure");
        }
      } catch (e) {
        console.log(e);
        //set state for transaction listening timeout
        setTxStatus("timeout");
      }
    } catch (e) {
      console.log(e);
      //set state for transaction construction error
      setTxStatus("validation-error");
    }
  };

  /*

    FRONTEND ACTIONS

      react components for corresponding tx status
        see line 318 for if/else logic

  */

  const txPending = () => {
    return (
      <Message style={{ fontSize: 20 }}>
        <Message.Header style={{ marginBottom: 10 }}>
          Transaction sent to Kadena Mainnet
        </Message.Header>
        Please wait, this box will update once the transaction is confirmed in
        about 30 seconds.
        <div style={{ margin: 20, textAlign: "center" }}>
          <Loader inline active />
        </div>
        <Message.Header style={{ marginBottom: 10 }}>
          Curious how interacting with a blockchain can be so simple?
        </Message.Header>
        <p>
          With most blockchains you need an account, a wallet, and some crypto
          in order to interact with them. Kadena's solution to this onboarding
          problem is gas stations; an account that exists only to fund gas
          payments on behalf of other users.
        </p>
        <p>
          Thanks to gas stations, interacting with Kadena can be as simple as
          filling out a web form.
        </p>
      </Message>
    );
  };

  const txSuccess = () => {
    return (
      <Message style={{ fontSize: 20 }}>
        <Message.Header style={{ marginBottom: 10 }}>Success!</Message.Header>
        <p>
          {JSON.stringify(tx.result.data) +
            " has been added to the Memory Wall."}
        </p>
        <p>
          <a href={`${kadenaAPI.explorerURL}/tx/${tx.reqKey}`}>
            View transaction in Block Explorer
          </a>
        </p>
      </Message>
    );
  };

  const txFailure = () => {
    return (
      <Message style={{ fontSize: 20 }}>
        <Message.Header style={{ marginBottom: 10 }}>
          ERROR! INVESTIGATE BELOW
        </Message.Header>
        <p>{JSON.stringify(tx)}</p>
        <p>
          <a href={`${kadenaAPI.explorerURL}/tx/${tx.reqKey}`}>
            View transaction in Block Explorer
          </a>
        </p>
      </Message>
    );
  };

  const txValidationError = () => {
    return (
      <Message style={{ fontSize: 20 }}>
        <Message.Header style={{ marginBottom: 10 }}>
          Transaction was Rejected
        </Message.Header>
        <p>
          Transaction was not sent to Blockchain. Check your keys or metadata
        </p>
      </Message>
    );
  };

  const txTimeout = () => {
    return (
      <Message style={{ fontSize: 20 }}>
        <Message.Header style={{ marginBottom: 10 }}>
          Waiting Timed out, but your tx was sent. Look up Below
        </Message.Header>
        <p>
          <a href={`${kadenaAPI.explorerURL}/tx/${tx.reqKey}`}>
            View transaction in Block Explorer
          </a>
        </p>
      </Message>
    );
  };

  //return react JSX
  return (
    <div
      style={{
        marginLeft: 400,
        marginTop: 50,
        marginRight: 400,
        marginBottom: 50,
      }}
    >
      <Segment raised padded="very">
        <div style={{ margin: 30 }}>
          <h1>
            <a>Welcome to the Kadena Memory Wall</a>
          </h1>

          <h2>Smart Contract Details:</h2>
          <p style={{ fontSize: 18 }}>
            <b> Address: </b> {kadenaAPI.contractAddress}
          </p>
          <p style={{ fontSize: 18 }}>
            <b> Chain: </b> {kadenaAPI.meta.chainId}
          </p>
          <p style={{ fontSize: 18 }}>
            <b> Network: </b> {kadenaAPI.meta.networkId}
          </p>

          <h2>
            Engrave your name and submit a real transaction on the Kadena
            blockchain with just 1-click
          </h2>
          <div style={{ marginTop: 20 }}>
            <Input
              placeholder="your name or memory"
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              size="huge"
            />
            <Button
              color="teal"
              size="huge"
              onClick={async () => {
                await postMemory(memory);
              }}
            >
              Was Here
            </Button>
          </div>
          {txStatus === "pending" ? (
            txPending()
          ) : txStatus === "success" ? (
            txSuccess()
          ) : txStatus === "timeout" ? (
            txTimeout()
          ) : txStatus === "validation-error" ? (
            txValidationError()
          ) : (
            <div />
          )}
          <div style={{ marginTop: 40 }}>
            <Feed>
              {memories.map((m, i) => {
                let colors = [
                  "orange",
                  "yellow",
                  "olive",
                  "green",
                  "teal",
                  "blue",
                  "violet",
                  "purple",
                  "pink",
                  "brown",
                  "grey",
                ];
                return (
                  <Feed.Event style={{ marginBottom: 20 }} key={i}>
                    <Feed.Label
                      style={{ marginRight: 10 }}
                      icon={
                        <Icon
                          name="like"
                          color={
                            colors[Math.floor(Math.random() * colors.length)]
                          }
                          size={"massive"}
                        />
                      }
                    />
                    <Feed.Content>
                      <div style={{ fontSize: 20 }}>
                        <b>
                          <a
                            href={`${kadenaAPI.explorerURL}/chain/${kadenaAPI.meta.chainId}/height/${m["block-height"].int}`}
                          >
                            {m.name}
                          </a>{" "}
                          was here
                        </b>
                      </div>
                    </Feed.Content>
                  </Feed.Event>
                );
              })}
            </Feed>
          </div>
        </div>
      </Segment>
    </div>
  );
};

export default App;
