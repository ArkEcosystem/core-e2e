'use strict'

const axios = require('axios')
const { client, transactionBuilder } = require('@arkecosystem/crypto')
const utils = require('./utils')
const testUtils = require('../../../../lib/utils/test-utils')

const util = require('util')
const exec = util.promisify(require('child_process').exec)

/**
 * Create a transaction to be added to the pool and shut down the node
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async (options) => {
    const config = require('../../../networks/e2enet/e2enet.json')
    client.setConfig(config)

    // first transaction which will be broadcasted to other nodes for forging
    let transaction = transactionBuilder
      .transfer()
      .amount(300 * Math.pow(10, 8))
      .recipientId(utils.randomRecipient.address)
      .vendorField('transaction to add to pool before stopping node')
      .sign(utils.senderWallet.passphrase)
      .getStruct()

    await axios.post('http://127.0.0.1:4301/api/v2/transactions', {
      transactions: [transaction]
    })

    const commandDisconnectNode = `docker disconnect nodes $(docker ps --format "{{.Names}}" | grep node1_ark)`
    const { stdoutDisconnect: stdout, stderrDisconnect: stderr } = await exec(commandDisconnectNode)
    console.log(`[pool-clear] disconnect node : ${JSON.stringify({stdoutDisconnect, stderrDisconnect})}`)

    // second transaction which will not be broadcasted and should be kept in the node pool
    let transaction = transactionBuilder
      .transfer()
      .amount(300 * Math.pow(10, 8))
      .recipientId(utils.randomRecipient2.address)
      .vendorField('transaction to add to pool before stopping node')
      .sign(utils.senderWallet.passphrase)
      .getStruct()

    await axios.post('http://127.0.0.1:4301/api/v2/transactions', {
      transactions: [transaction]
    })

    const response = await testUtils.request('GET', 'transactions/unconfirmed', { port: 3001 })
    const transactions = response.data.data
    console.log(`[pool-clear] unconfirmed: ${JSON.stringify(transactions)}`)

    console.log(`Current directory: ${process.cwd()}`); //TODO remove

    const commandStopNode = `kill $(cat ../dist/e2enet/node1/pid.log)`
    const { stdout, stderr } = await exec(commandStopNode)
    console.log(`[pool-clear] kill node process : ${JSON.stringify({stdout, stderr})}`)

}