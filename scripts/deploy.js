const hre = require("hardhat");
const fs = require('fs');
const envChainId = "0x7a69"; //hardhat
//mumbai 0x13881
//polygon 0x89
const monkey_config = require('../monkey_config.json')

async function main() {
  const NFTMarket = await hre.ethers.getContractFactory("NFTMarket");
  const nftMarket = await NFTMarket.deploy();
  await nftMarket.deployed();
  console.log("nftMarket deployed to:", nftMarket.address);

  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy(nftMarket.address);
  await nft.deployed();
  console.log("nft deployed to:", nft.address);

  let contract_owner = monkey_config[hre.network.name]['contract_owner']['address']

  let config = `
  export const nftmarketaddress = "${nftMarket.address}"
  export const nftaddress = "${nft.address}"
  export const envChainId = "${envChainId}"
  export const contract_owner = "${contract_owner}"
  `

  let data = JSON.stringify(config)
  fs.writeFileSync('config.js', JSON.parse(data))

  let mint_config = `
  {
    "nftaddress" : "${nft.address}"
  }
  `

  let mint_data = JSON.stringify(mint_config)
  fs.writeFileSync('mint_config.json', JSON.parse(mint_data))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
