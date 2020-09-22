class Balance {
  constructor(ETHBalance, USDBalance) {
    this.ETHBalance = ETHBalance || 10.00;
    this.USDBalance = USDBalance || 2000.00;
  }

  addUSD(amount) {
    this.USDBalance = this.USDBalance + amount;
    return {
      success: true,
      message: amount + " USD successfully added to USD balance"
    }
  }

  addETH(amount) {
    this.ETHBalance = this.ETHBalance + amount;
    return {
      success: true,
      message: amount + " ETH successfully added to ETH balance"
    }
  }

  subUSD(amount) {
    if(amount > this.USDBalance) {
      return {
        success: false,
        message: "insufficient USD balance"
      }
    } else {
      this.USDBalance = this.USDBalance - amount;
      return {
        success: true,
        message: amount + " USD successfully subtracted from USD balance"
      }
    }
  }

  subETH(amount) {
    if(amount > this.ETHBalance) {
      return {
        success: false,
        message: "insufficient ETH balance"
      }
    } else {
      this.ETHBalance = this.ETHBalance - amount;
      return {
        success: true,
        message: amount + " ETH successfully subtracted from ETH balance"
      }
    }
  }
}

module.exports = Balance;
