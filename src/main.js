const chalk = require("chalk");
const fs = require("fs");
const ncp = require("ncp").ncp;
const path = require("path");
const { promisify } = require("util");
const execa = require("execa");
const which = require("which");
const replaceInFile = require("replace-in-file");
const pJson = require("../package.json");

const access = promisify(fs.access);
const copy = promisify(ncp);

module.exports = {
  createProject: async (options) => {
    const templateDir = path.join(
      __dirname,
      "..",
      "templates",
      options.platform.toLowerCase()
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

    await copyPactFiles(options);

    await addPactPackageJsonElements(options);

    if (options.git) {
      await initGit(options);
    }

    if (options.install) {
      await installDependencies(options);
    }

    const runCommand = hasYarn ? "yarn" : "npm run";

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
  },
};

async function copyTemplateFiles(options) {
  console.log("Install project files");
  await copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });

  const replaceConfig = {
    files: [`${options.targetDirectory}/package.json`],
    from: /pact-blank-app/g,
    to: options.projectDir,
  };

  await replaceInFile(replaceConfig);

  console.log(
    "%s Project files installed successfully",
    chalk.green.bold("DONE")
  );

  return true;
}

async function copyPactFiles(options) {
  console.log("Install Pact files");
  const pactDir = path.join(__dirname, "..", "templates", "common", "pact");

  await copy(pactDir, path.join(options.targetDirectory, "pact"), {
    clobber: false,
  });

  console.log("%s Pact files installed successfully", chalk.green.bold("DONE"));

  return true;
}

async function addPactPackageJsonElements(options) {
  console.log("Configure package.json");
  const pactPackageConfig = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "templates",
        "common",
        "pact-package-config.json"
      ),
      "utf8"
    )
  );
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(options.targetDirectory, "package.json"), "utf8")
  );

  Object.keys(pactPackageConfig).forEach((key) => {
    packageJson[key] = { ...packageJson[key], ...pactPackageConfig[key] };
  });

  fs.writeFile(
    path.join(options.targetDirectory, "package.json"),
    JSON.stringify(packageJson, null, 4),
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );

  console.log(
    "%s Package.json configured successfully",
    chalk.green.bold("DONE")
  );

  return true;
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
