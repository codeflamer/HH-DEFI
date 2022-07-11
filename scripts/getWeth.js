const { deployments, ethers, getNamedAccounts } = require("hardhat");
const WethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
// const WethAddresss = "0xC02aaF27eAD9083C756Cc2";
const AMOUNT = ethers.utils.parseEther("0.01");

const getWeth = async () => {
    const { deployer } = await getNamedAccounts();

    //abi or name;contractAddress;deployer

    const Iweth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer
    );

    const balanceBefore = await Iweth.balanceOf(deployer);
    console.log("deployerBalance Before Transaction:", balanceBefore.toString());

    const txDeposit = await Iweth.deposit({ value: AMOUNT });
    await txDeposit.wait(1);

    const balanceAfter = await Iweth.balanceOf(deployer);
    console.log("deployerBalance after Transaction:", balanceAfter.toString());
};

module.exports = { getWeth, AMOUNT };
