const chalk = require("chalk");
const fs = require("fs");
const ncp = require("ncp").ncp;
const path = require("path");
const { promisify } = require("util");
const execa = require("execa");
const which = require("which");
const replaceInFile = require("replace-in-file");
const SHA256 = require("crypto-js/sha256");

const access = promisify(fs.access);
const copy = promisify(ncp);

module.exports = {
  createProject: async (options) => {
    const templateDir = path.join(
      __dirname,
      "..",
      "templates",
      options.platform.toLowerCase(),
      "app"
    );

    try {
      await access(templateDir, fs.constants.R_OK);
    } catch (err) {
      console.error("%s Invalid template name", chalk.red.bold("ERROR"));
      process.exit(1);
    }

    const hasNpm = await which("npm", { nothrow: true });
    const hasYarn = await which("yarn", { nothrow: true });

    options = {
      ...options,
      templateDirectory: templateDir,
      targetDirectory: path.join(process.cwd(), options.projectDir),
      hasNpm,
      hasYarn,
    };

    await copyTemplateFiles(options);

    const kdaConfigObject = await addKadenaConfigFile(options);

    await copyPactFiles(options, kdaConfigObject);

    if (options.git) {
      await initGit(options);
    }

    if (options.install) {
      await installDependencies(options);
    }

    printInstructions(options);
  },
};

async function copyTemplateFiles(options) {
  console.log("Install project files");
  await copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });

  console.log(
    "path",
    path.join(
      options.templateDirectory,
      "..",
      "files",
      `${options.signing}.html`
    )
  );

  if (options.platform === "vanilla") {
    fs.copyFile(
      path.join(
        options.templateDirectory,
        "..",
        "files",
        `${options.signing}.html`
      ),
      path.join(options.targetDirectory, "index.html"),
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );
  } else if (options.platform === "react") {
    fs.copyFile(
      path.join(
        options.templateDirectory,
        "..",
        "files",
        `${options.signing}.js`
      ),
      path.join(options.targetDirectory, "src", "App.js"),
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );

    const replaceConfig = {
      files: [`${options.targetDirectory}/package.json`],
      from: /pact-blank-app/g,
      to: options.projectDir,
    };

    await replaceInFile(replaceConfig);
  }

  console.log(
    "%s Project files installed successfully",
    chalk.green.bold("DONE")
  );

  return true;
}

async function copyPactFiles(options, kdaConfigObject) {
  console.log("Install Pact files");
  const pactDir = path.join(__dirname, "..", "templates", "common", "pact");

  await copy(pactDir, path.join(options.targetDirectory, "pact"), {
    clobber: false,
  });

  const memoryWallTemplateFile = fs.readFileSync(
    path.join(options.targetDirectory, "pact", "memory-wall.pact"),
    "utf8"
  );

  const memoryWallFile = memoryWallTemplateFile.replace(
    "{{contractName}}",
    kdaConfigObject.contractName
  );

  fs.writeFile(
    path.join(options.targetDirectory, "pact", "memory-wall.pact"),
    memoryWallFile,
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );

  const memoryWallReplTemplateFile = fs.readFileSync(
    path.join(options.targetDirectory, "pact", "memory-wall.repl"),
    "utf8"
  );

  let memoryWallReplFile = memoryWallReplTemplateFile.replace(
    "{{contractName}}",
    kdaConfigObject.contractName
  );

  fs.writeFile(
    path.join(options.targetDirectory, "pact", "memory-wall.repl"),
    memoryWallReplFile,
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );

  const memoryWallGSTemplateFile = fs.readFileSync(
    path.join(options.targetDirectory, "pact", "memory-wall-gas-station.pact"),
    "utf8"
  );

  const memoryWallGSFile = memoryWallGSTemplateFile.replace(
    "{{gasStationName}}",
    kdaConfigObject.gasStationName
  );

  fs.writeFile(
    path.join(options.targetDirectory, "pact", "memory-wall-gas-station.pact"),
    memoryWallGSFile,
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );

  console.log("%s Pact files installed successfully", chalk.green.bold("DONE"));

  return true;
}

async function addKadenaConfigFile(options) {
  console.log("Install Kadena config file");

  const kadenaCommonConfig = fs.readFileSync(
    path.join(__dirname, "..", "templates", "common", "kadena-config.js"),
    "utf8"
  );

  const configObject = generateConfigObject(options);

  let kadenaConfig = kadenaCommonConfig
    .replace("{{chainId}}", options.chain)
    .replace("{{networkId}}", configObject.networkId)
    .replace("{{node}}", configObject.node)
    .replace("{{contractName}}", configObject.contractName)
    .replace("{{gasStationName}}", configObject.gasStationName);

  let destinationFolder = "";

  if (options.platform === "react") {
    kadenaConfig = kadenaConfig += "module.exports = { kadenaAPI: kadenaAPI, }";
    destinationFolder = path.join(options.targetDirectory, "src");
  } else {
    destinationFolder = options.targetDirectory;
  }

  fs.writeFile(
    path.join(destinationFolder, "kadena-config.js"),
    kadenaConfig,
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );

  console.log(
    "%s Kadena Config files installed successfully",
    chalk.green.bold("DONE")
  );

  return configObject;
}

async function initGit(options) {
  console.log("Initialize git repository");
  const result = await execa("git", ["init"], {
    cwd: options.targetDirectory,
    stdio: "inherit",
  });
  if (result.failed) {
    return Promise.reject(new Error("Failed to initialize git"));
  }

  console.log(
    "%s Git repository initialized successfully",
    chalk.green.bold("DONE")
  );

  return;
}

async function installDependencies(options) {
  console.log("Install dependencies...");
  if (options.hasNpm || options.hasYarn) {
    const result = await execa(options.hasYarn ? "yarn" : "npm", ["install"], {
      cwd: options.targetDirectory,
      stdio: "inherit",
    });
    if (result.failed) {
      return Promise.reject(new Error("Failed to install dependencies"));
    }
  }

  console.log(
    "%s Dependencies installed successfully",
    chalk.green.bold("DONE")
  );

  return;
}

function generateConfigObject(options) {
  let configObject = {
    networkId: "",
    node: "",
    contractName: "",
    gasStationName: "",
  };

  if (options.network === "mainnet") {
    configObject.networkId = "mainnet01";
    configObject.node = "api.chainweb.com";
  } else {
    configObject.networkId = "testnet04";
    configObject.node = "us1.testnet.chainweb.com";
  }

  if (options.contract === "deployed") {
    configObject.contractName = "memory-wall";
    configObject.gasStationName = "memory-wall-gas-station";
  } else {
    const date = new Date();
    const stringToHash = date.toISOString() + options.projectName;
    const hash = SHA256(stringToHash);

    configObject.contractName = `memory-wall-${hash}`;
    configObject.gasStationName = `memory-wall-gas-station-${hash}`;
  }
  return configObject;
}

function printInstructions(options) {
  if (options.platform === "react") {
    const runCommand = options.hasYarn ? "yarn" : "npm run";
    console.log(chalk`
    Success! Created ${options.targetDirectory}
    Inside that directory, you can run several commands:

      {cyan ${runCommand} dev}
        Starts the development server. Both contract and client-side code will
        auto-reload once you change source files.

      {cyan ${runCommand} test}
        Starts the test runner.

      {cyan ${runCommand} deploy}
        Deploys contract in permanent location (as configured in {bold src/config.js}).
        Also deploys web frontend using GitHub Pages.
        Consult with {bold README.md} for details on how to deploy and {bold package.json} for full list of commands.

    We suggest that you begin by typing:

      {cyan cd ${options.projectDir}}
      {cyan ${runCommand} start}

    Happy hacking!
    `);
  } else {
    console.log(chalk`
    Success! Created ${options.targetDirectory}
    Inside that directory, you can find both html and configuration files.

    We suggest that you begin by opening {cyan index.html} in your browser

    Happy hacking!
    `);
  }
}
