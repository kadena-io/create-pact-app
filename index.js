#!/usr/bin/env node
const yargs = require("yargs");
const inquirer = require("inquirer");
const { createProject } = require("./src/main");

const optionsConfig = {
  platform: {
    choices: ["vanilla", "react"],
    default: "vanilla",
  },
  signing: {
    choices: ["wallet", "gas-station"],
    default: "wallet",
  },
  contract: {
    choices: ["deployed", "deploy-own"],
    default: "deployed",
  },
  network: {
    choices: ["mainnet", "testnet"],
    default: ["testnet"],
  },
  chain: {
    choices: [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
    ],
    default: "0",
  },
  git: {
    default: false,
  },
  install: {
    default: false,
  },
};

const opts = yargs
  .usage("$0 [projectDir]", "Create PACT application")
  .option("platform", {
    desc: "platform frontend template to use",
    choices: optionsConfig.platform.choices,
  })
  .option("signing", {
    desc: "signing to use",
    choices: optionsConfig.signing.choices,
  })
  .option("contract", {
    desc: "contract type",
    choices: optionsConfig.contract.choices,
  })
  .option("network", {
    desc: "network to use",
    choices: optionsConfig.network.choices,
  })
  .option("chain", {
    desc: "chain to use",
    choices: optionsConfig.chain.choices,
  })
  .option("git", {
    desc: "initialize git repository",
    type: "boolean",
  })
  .option("install", {
    desc: "install dependencies",
    type: "boolean",
  })
  .help().argv;

async function promptForMissingArguments(options) {
  const questions = [];

  if (!options.projectDir) {
    questions.push({
      type: "input",
      name: "projectDir",
      message: "Project name",
    });
  }

  if (!options.platform) {
    questions.push({
      type: "list",
      name: "platform",
      message: "Please choose which frontend platform to use",
      choices: optionsConfig.platform.choices,
      default: optionsConfig.platform.default,
    });
  }

  if (!options.signing) {
    questions.push({
      type: "list",
      name: "signing",
      message: "Please choose which signing to use",
      choices: optionsConfig.signing.choices,
      default: optionsConfig.signing.default,
    });
  }

  if (!options.contract) {
    questions.push({
      type: "list",
      name: "contract",
      message: "Please choose which contract type to use",
      choices: optionsConfig.contract.choices,
      default: optionsConfig.contract.default,
    });
  }

  if (!options.network) {
    questions.push({
      type: "list",
      name: "network",
      message: "Please choose which network to use",
      choices: optionsConfig.network.choices,
      default: optionsConfig.network.default,
    });
  }

  if (!options.chain) {
    questions.push({
      type: "list",
      name: "chain",
      message: "Please choose which chain to use",
      choices: optionsConfig.chain.choices,
      default: optionsConfig.chain.default,
    });
  }

  if (!options.git) {
    questions.push({
      type: "confirm",
      name: "git",
      message: "Initialize a git repository?",
      default: optionsConfig.git.default,
    });
  }

  if (!options.install) {
    questions.push({
      type: "confirm",
      name: "install",
      message: "Install dependencies?",
      default: optionsConfig.install.default,
      when: (answers) =>
        answers.platform === "react" || options.platform === "react",
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    ...options,
    projectDir: options.projectDir || answers.projectDir,
    platform: options.platform || answers.platform,
    signing: options.signing || answers.signing,
    contract: options.contract || answers.contract,
    network: options.network || answers.network,
    chain: options.chain || answers.chain,
    git: options.git || answers.git,
    install: options.install || answers.install,
  };
}

const init = async function (options) {
  options = await promptForMissingArguments(options);

  await createProject(options);
};

init(opts).catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
