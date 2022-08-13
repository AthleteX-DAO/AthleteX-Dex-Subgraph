const fs = require('fs-extra');
const mustache = require('mustache');

(async function () {
  const networkName = process.argv[2];
  const deployments = JSON.parse(fs.readFileSync('networks.json', 'utf8'));
  const {
    address: factoryAddr,
    startBlock: factoryStartBlock,
  } = deployments['Factory'][networkName];
  const templateData = {
    network: networkName,
  };
  templateData['Factory'] = {
    address: factoryAddr,
    addressLowerCase: factoryAddr.toLowerCase(),
    startBlock: factoryStartBlock,
  };

  const template = fs
    .readFileSync('subgraph.template.yaml')
    .toString();
  
    fs.writeFileSync(
    'subgraph.yaml', 
    mustache.render(template, templateData)
  );
})();
