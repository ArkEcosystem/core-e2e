'use strict'

const { client, transactionBuilder } = require('@arkecosystem/crypto')
const utils = require('./utils')
const testUtils = require('../../../../lib/utils/test-utils')

/**
 * Init 2nd signature wallets
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async (options) => {
    const config = require('../../../networks/e2enet/e2enet.json')
    client.setConfig(config)

    const transactions = []
    Object.keys(utils.wallets).forEach(txType => {
      const wallets = utils.wallets[txType]
      transactions.push(transactionBuilder
        .secondSignature()
        .signatureAsset(wallets[3].passphrase)
        .fee(utils.fees.secondSignRegistration)
        .sign(wallets[2].passphrase)
        .getStruct()
      )
    })

    await testUtils.POST('transactions', { transactions })
}