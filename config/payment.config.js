const crypto = require('crypto');
const moment = require('moment');

class VNPayService {
  constructor() {
    this.vnp_TmnCode = process.env.VNPAY_TMNCODE;
    this.vnp_HashSecret = process.env.VNPAY_HASHSECRET;
    this.vnp_Url = process.env.VNPAY_URL;
    this.vnp_ReturnUrl = process.env.VNPAY_RETURN_URL;
  }

  createPaymentUrl(orderId, amount, orderInfo) {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const ipAddr = process.env.SERVER_IP;
    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'billpayment',
      vnp_BankCode: 'NCB',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnp_Params);
    const signData = this.createSignData(sortedParams);
    const secureHash = this.createSecureHash(signData);

    return `${this.vnp_Url}?${signData}&vnp_SecureHash=${secureHash}`;
  }

  sortObject(obj) {
    const sorted = {};
    const str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  createSignData(sortedParams) {
    return Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');
  }

  createSecureHash(signData) {
    return crypto
      .createHmac('sha512', this.vnp_HashSecret)
      .update(signData)
      .digest('hex');
  }

  verifyPayment(params) {
    const secureHash = params['vnp_SecureHash'];
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(params);
    const signData = this.createSignData(sortedParams);
    const checkSum = this.createSecureHash(signData);

    return secureHash === checkSum;
  }
}

module.exports = new VNPayService(); 