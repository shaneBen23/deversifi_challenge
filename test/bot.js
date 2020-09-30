const { assert, expect } = require('chai');
const { describe, beforeEach, it } = require('mocha');

const stub = require('../src/lib/stubs');
const constants = require('../src/lib/constants');
const Balance = require('../src/classes/Balance');
const bot = require('../src/bot');

let sufficentBalance = new Balance(10.00, 2000.00);
let insufficentBalance = new Balance(0, 0);

const bidOrder = { ethAmount: 0.000000001189755401, usdAmount: 12.35, position: 0.1, type: constants.BID };
const askOrder = { ethAmount: 0.000000001160975518, usdAmount: 14.13, position: -1, type: constants.SELL };

describe('Test fillOrder functions', function() {
  beforeEach(function() {
    sufficentBalance = new Balance(10.00, 2000.00);
    insufficentBalance = new Balance(0, 0);
  });

  it('Successful BID order', function(done) {
    const botResp = bot.fillOrder(sufficentBalance, bidOrder);
    expect(botResp.currency).to.equal('USD');
    // console.log('Successful BID order', botResp);
    assert.isOk(botResp.success);
    done();
  });
  
  it('Successful ASK order', function(done) {
    const botResp = bot.fillOrder(sufficentBalance, askOrder);
    // console.log('Successful ASK order', botResp);
    expect(botResp.currency).to.equal('ETH');
    assert.isOk(botResp.success);
    done();
  });
  
  it('Fail BID order', function(done) {
    const botResp = bot.fillOrder(insufficentBalance, bidOrder);
    // console.log('Fail BID order', botResp);
    expect(botResp.currency).to.equal('USD');
    assert.isFalse(botResp.success);
    done();
  });
  
  it('Fail ASK order', function(done) {
    const botResp = bot.fillOrder(insufficentBalance, askOrder);
    // console.log('Fail ASK order', botResp);
    expect(botResp.currency).to.equal('ETH');
    assert.isFalse(botResp.success);
    done();
  });
});
