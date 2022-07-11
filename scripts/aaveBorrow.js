const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth, AMOUNT } = require("./getWeth");

const main = async () => {
    const { deployer } = await getNamedAccounts();
    await getWeth();

    const lendingPool = await getLendingPool(deployer);
    console.log("Lending Address is: ", lendingPool.address);

    //Deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    //Approve
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);
    console.log("depositing...");
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
    console.log("Deposited");
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer);
    const daiEthPrice = await getDaiPrice();
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiEthPrice.toNumber());
    console.log(`You can Borrow ${amountDaiToBorrow} DAI`);
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString());
    console.log("DAI In WETH : ", amountDaiToBorrowWei.toString());
    //Borrow
    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    await borrowDai(lendingPool, daiTokenAddress, amountDaiToBorrowWei, deployer);

    await getBorrowUserData(lendingPool, deployer);

    //repaid
    await repayBorrowed(lendingPool, daiTokenAddress, amountDaiToBorrowWei, deployer);
    await getBorrowUserData(lendingPool, deployer);
};

const repayBorrowed = async (lendingPool, daiTokenAddress, amount, account) => {
    await approveErc20(daiTokenAddress, lendingPool.address, amount, account);
    const repayTx = await lendingPool.repay(daiTokenAddress, amount, 1, account);
    await repayTx.wait(1);
    console.log("Repaid!!!");
};

const borrowDai = async (lendingPool, daiTokenAddress, daiToBorrowWeth, address) => {
    const borrowTx = await lendingPool.borrow(daiTokenAddress, daiToBorrowWeth, 1, 0, address);
    await borrowTx.wait(1);
    console.log("You have Borrowed!!!");
};

const getDaiPrice = async (account) => {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4",
        account
    );

    const price = (await daiEthPriceFeed.latestRoundData())[1];
    console.log("The DAI/ETH price :", price.toString());
    return price;
};

const getBorrowUserData = async (lendingPool, account) => {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account);
    console.log(`You have ${totalCollateralETH} worth of ETH deposited`);
    console.log(`You have ${totalDebtETH} worth of ETH borrowed`);
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH deposited`);
    return { availableBorrowsETH, totalDebtETH };
};

const getLendingPool = async (account) => {
    const lendingAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    );
    const lendingPoolAddress = await lendingAddressesProvider.getLendingPool();

    console.log("lending pool address: ", lendingPoolAddress);

    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account);

    return lendingPool;
};

const approveErc20 = async (wethTokenAddress, spenderAddress, amount, account) => {
    const ERC20Token = await ethers.getContractAt("IERC20", wethTokenAddress, account);
    const tx = await ERC20Token.approve(spenderAddress, amount);
    await tx.wait(1);
    console.log("Approved!");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
