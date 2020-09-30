const axios = require('axios');
const Web3 = require('web3');
const CronJob = require('cron').CronJob;

const constants = require('./lib/constants');
const stubs = require('./lib/stubs');
const utils = require('./lib/utils');
const Balance = require('./classes/Balance');

const balance = new Balance(10.00, 2000.00);
const web3 = new Web3();

const params = {
  Symbol: "tETHUSD",
  Precision: "R0",
};

function init() {
  console.log(`Starting bot`);
  const updateMarketJob = new CronJob('*/5 * * * * *', function() {
    updateMarketState();
  }, null, true);

  const displayBalanceJob = new CronJob('*/30 * * * * *', function() {
    displayBalance();
  }, null, true);
  
  updateMarketJob.start();
  displayBalanceJob.start();
  console.log(`Bot started`);
};

async function getOrderBook(Symbol, Precision) {
  return await axios.get(`${constants.URI}/${Symbol}/${Precision}`);
}

function cancelOrder(type) {
  console.log(`CANCEL ${type} ORDER`);
}

// Generate 5 BIDS and 5 ASKS and if any of them is better than the best BID call fillOrder
async function placeOrder(order) {
  const { ethAmount, usdAmount, type } = order;
  const percentage = utils.calculatePercent(constants.PERCENTAGE, usdAmount);
  const min = usdAmount - percentage;
  const max = usdAmount + percentage;

  let botOrders = 0;

  while (botOrders < 5) {
    let newBotOrder = utils.getRandomNumber(min, max);

    if(type === constants.BID) {
      console.log(`PLACE BID @ ${newBotOrder}, order number: ${botOrders + 1}`);
    } else {
      console.log(`PLACE ASK @ ${newBotOrder}, order number: ${botOrders + 1}`);
    }
  
    const successfulBID = newBotOrder > usdAmount && type === constants.BID;
    const successfulAsk = newBotOrder < usdAmount && type === constants.SELL;
  
    let ETHamount = await web3.utils.fromWei(ethAmount.toString(), 'ether');
    let orderToFill = { ...order, usdAmount: newBotOrder, ethAmount: ETHamount };;
  
    if(successfulBID || successfulAsk) {
      fillOrder(balance, orderToFill);
    }
    botOrders++
  }
}

function fillOrder(orderBalance, order) {
  const { ethAmount, usdAmount, type } = order;
  let ETHamount = parseFloat(ethAmount);
  const USDamount = parseFloat(usdAmount);

  let details;
  let USDbalanceUpdate;
  let ETHbalanceUpdate;

  if(type === constants.BID) {
    USDbalanceUpdate = orderBalance.subUSD(USDamount);
    ETHbalanceUpdate = orderBalance.addETH(ETHamount);
    details = `ETH + ${ETHamount} USD - ${USDamount}`;
  } else {
    ETHbalanceUpdate = orderBalance.subETH(ETHamount);
    USDbalanceUpdate = orderBalance.addUSD(USDamount);
    details = `ETH - ${ETHamount} USD + ${USDamount}`;
  }

  if(USDbalanceUpdate.success && ETHbalanceUpdate.success) {
    console.log(`FILLED BID @ PRICE AMOUNT (${details})`);
    if(USDbalanceUpdate.success && type == constants.BID) {
      return { success: true, currency: 'USD' };
    }
    if(ETHbalanceUpdate.success && type == constants.SELL) {
      return { success: true, currency: 'ETH' };
    }
  } else {
    if(!USDbalanceUpdate.success) {
      console.log(USDbalanceUpdate.message);
      return { success: false, currency: 'USD' };
    }
    if(!ETHbalanceUpdate.success) {
      console.log(ETHbalanceUpdate.message);
      return { success: false, currency: 'ETH' };
    }
    cancelOrder(type);
  }
}

async function displayBalance() {
  console.log('---------------------------------------');
  console.log('----- Start current asset balance -----');
  console.log('---------------------------------------');
  console.log(`         USD balance: ${balance.USDBalance}`);
  console.log(`         ETH balance: ${balance.ETHBalance}`);
  console.log('---------------------------------------');
  console.log('------ End current asset balance ------');
  console.log('---------------------------------------');
}

async function updateMarketState() {  
  const resp = await getOrderBook(params.Symbol, params.Precision);
  const respData = resp.data;
  const orders = utils.transformData(respData);

  // Assuming the response is in order of best BID at the top and best ASK at the bottom
  await placeOrder(orders[0]);
  await placeOrder(orders[orders.length -1]);
}

module.exports = {
  Init: init,
  fillOrder
};
