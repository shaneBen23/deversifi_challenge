const constants = require('./constants');

function compare(a, b) {
  const priceA = a.ethAmount;
  const priceB = b.ethAmount;

  let comparison = 0;
  if (priceA > priceB) {
    comparison = 1;
  } else if (priceA < priceB) {
    comparison = -1;
  }
  return comparison;
}

function transformData(orders) {
  return orders.map(order => {
    let type = order[2] >= 0 ? constants.BID : constants.SELL;
    return {
      ethAmount: order[0],
      usdAmount: order[1],
      position: order[2],
      type
    }
  });

  // return orders.sort(compare);
}

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function calculatePercent(percent, num){
  return (percent / 100) * num;
}

module.exports = {
  compare,
  transformData,
  getRandomNumber,
  calculatePercent
};
