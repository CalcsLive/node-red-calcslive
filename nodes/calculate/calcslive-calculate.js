'use strict';

const { makeRequest, mapApiError } = require('../../lib/api-client');

module.exports = function (RED) {
  function CalcsLiveCalculateNode(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    node.configNode = RED.nodes.getNode(config.configNodeId);
    node.articleId = config.articleId;
    node.inputPQs = config.inputPQs || '{}';
    node.outputPQs = config.outputPQs || '';

    node.on('input', async function (msg, send, done) {
      // Guard: config node required
      if (!node.configNode) {
        node.status({ fill: 'red', shape: 'dot', text: 'No config' });
        node.error('No CalcsLive config selected', msg);
        done();
        return;
      }

      const apiKey = node.configNode.credentials && node.configNode.credentials.apiKey;
      if (!apiKey) {
        node.status({ fill: 'red', shape: 'dot', text: 'No API key' });
        node.error('API key not set in CalcsLive config', msg);
        done();
        return;
      }

      // Resolve values — msg properties override static node config
      const articleId = msg.articleId || node.articleId;
      if (!articleId) {
        node.status({ fill: 'red', shape: 'dot', text: 'No article ID' });
        node.error('Article ID is required', msg);
        done();
        return;
      }

      let inputs, outputs;
      try {
        inputs = msg.inputs !== undefined
          ? msg.inputs
          : JSON.parse(node.inputPQs || '{}');

        outputs = msg.outputs !== undefined
          ? msg.outputs
          : (node.outputPQs ? JSON.parse(node.outputPQs) : undefined);
      } catch (e) {
        node.status({ fill: 'red', shape: 'dot', text: 'Invalid JSON' });
        node.error(`Invalid JSON in inputs/outputs: ${e.message}`, msg);
        done();
        return;
      }

      // In-flight status
      node.status({ fill: 'yellow', shape: 'ring', text: 'calculating...' });

      try {
        const requestBody = { articleId, inputs };
        if (outputs !== undefined) requestBody.outputs = outputs;

        const response = await makeRequest({
          url: `${node.configNode.baseUrl}/api/node-red/v1/calculate`,
          method: 'POST',
          apiKey,
          body: requestBody,
          timeout: 10000
        });

        if (response.statusCode !== 200) {
          const errMsg = mapApiError(response.statusCode, response.body);
          const errCode = response.body && response.body.error && response.body.error.code;
          msg.error = { code: errCode, message: errMsg, statusCode: response.statusCode };
          node.status({ fill: 'red', shape: 'dot', text: errMsg.substring(0, 32) });
          node.error(errMsg, msg);
          done();
          return;
        }

        // Unwrap response: { success, data: { calculation: { inputs, outputs, ... } } }
        const responseData = (response.body.data && response.body.data.calculation) || response.body.data || response.body;
        msg.payload = responseData.outputs || {};
        msg.calcslive = responseData;  // { articleId, articleTitle, inputs, outputs, executionTime, totalPQs }
        msg.statusCode = 200;

        node.status({ fill: 'green', shape: 'dot', text: 'ok' });
        setTimeout(() => node.status({}), 3000);

        send(msg);
        done();

      } catch (e) {
        const errMsg = `CalcsLive unreachable: ${e.message}`;
        msg.error = { message: errMsg };
        node.status({ fill: 'red', shape: 'dot', text: 'unreachable' });
        node.error(errMsg, msg);
        done();
      }
    });
  }

  RED.nodes.registerType('calcslive-calculate', CalcsLiveCalculateNode);
};
