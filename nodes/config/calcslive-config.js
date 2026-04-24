'use strict';

module.exports = function (RED) {
  function CalcsLiveConfigNode(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.baseUrl = (config.baseUrl || 'https://www.calcslive.com').replace(/\/$/, '');
    // apiKey is stored in this.credentials.apiKey by Node-RED
  }

  RED.nodes.registerType('calcslive-config', CalcsLiveConfigNode, {
    credentials: {
      apiKey: { type: 'password' }
    }
  });
};
