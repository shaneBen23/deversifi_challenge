const axios = require('axios');
const Web3 = require('web3');
const CronJob = require('cron').CronJob;

const constants = require('./lib/constants');
const stubs = require('./lib/stubs');
const utils = require('./lib/utils');
const Balance = require('./classes/Balance');

const balance = new Balance();
const web3 = new Web3();

const params = {
  Symbol: "tETHUSD",
  Precision: "R0",
};

function init() {
  const updateMarketJob = new CronJob('*/5 * * * * *', function() {
    updateMarketState();
  }, null, true);

  const displayBalanceJob = new CronJob('*/30 * * * * *', function() {
    displayBalance();
  }, null, true);
  
  updateMarketJob.start();
  displayBalanceJob.start();
};

async function getTicketPrice(Symbol, Precision) {
  return await axios.get(`${constants.URI}/${Symbol}/${Precision}`);
}

function cancelOrder(type) {
  console.log(`CANCEL ${type} ORDER`);
}

// Generate 5 BIDS in an array and if any of them is better than the best BID call fillOrder
function placeOrder(order) {
  const { ethAmount, usdAmount, type } = order;
  const percentage = utils.calculatePercent(constants.PERCENTAGE, usdAmount);
  const min = usdAmount - percentage;
  const max = usdAmount + percentage;

  let botOrders = [];

  while (botOrders.length < 5) {
    botOrders.push(utils.getRandomNumber(min, max));
  }

  // Find best generated Order
  const botBestBid = Math.max(...botOrders).toFixed(2);
  const botBestAsk = Math.min(...botOrders).toFixed(2);

  if(type === constants.BID) {
    console.log(`PLACE BID @ ${botBestBid}`);
  } else {
    console.log(`PLACE ASK @ ${botBestAsk}`);
  }

  const successfulBID = botBestBid > usdAmount && type === constants.BID;
  const successfulAsk = botBestAsk < usdAmount && type === constants.SELL;

  let filledOrder = {};

  if(successfulBID) {
    filledOrder = { ...order, usdAmount: botBestBid };
  } else if(successfulAsk) {
    filledOrder = { ...order, usdAmount: botBestAsk };
  }

  if(successfulBID || successfulAsk) {
    fillOrder(filledOrder);
  }
}

async function fillOrder(order) {
  const { ethAmount, usdAmount, type } = order;

  let ETHamount = await web3.utils.fromWei(ethAmount.toString(), 'ether');
  ETHamount = parseFloat(ethAmount);
  const USDamount = parseFloat(usdAmount);

  let details;
  let USDbalanceUpdate;
  let ETHbalanceUpdate;

  if(type === constants.BID) {
    USDbalanceUpdate = balance.subUSD(USDamount);
    ETHbalanceUpdate = balance.addETH(ETHamount);
    details = `ETH + ${ETHamount} USD - ${USDamount}`;
  } else {
    USDbalanceUpdate = balance.subETH(ETHamount);
    ETHbalanceUpdate = balance.addUSD(USDamount);
    details = `ETH - ${ETHamount} USD + ${USDamount}`;
  }

  if(USDbalanceUpdate.success && ETHbalanceUpdate.success) {
    console.log(`FILLED BID @ PRICE AMOUNT (${details})`);
  } else {
    if(!USDbalanceUpdate.success) {
      console.log(USDbalanceUpdate.message);
    }
    if(!ETHbalanceUpdate.success) {
      console.log(ETHbalanceUpdate.message);
    }
    cancelOrder(type);
  }
}

async function displayBalance() {
  let ETHBalance = await web3.utils.fromWei(balance.ETHBalance.toString(), 'ether');
  ETHBalance = parseFloat(ETHBalance);
  console.log('---------------------------------------');
  console.log('----- Start current asset balance -----');
  console.log('---------------------------------------');
  console.log(`         USD balance: ${balance.USDBalance}`);
  console.log(`         ETH balance: ${ETHBalance}`);
  console.log('---------------------------------------');
  console.log('------ End current asset balance ------');
  console.log('---------------------------------------');
}

async function updateMarketState() {  
  const resp = await getTicketPrice(params.Symbol, params.Precision);
  const respData = resp.data;
  const orders = utils.transformData(respData);

  // Assuming the response is in order of best BID at the top and best ASK at the bottom
  placeOrder(orders[0]);
  placeOrder(orders[orders.length -1]);
}

module.exports = {
  Init: init
};
