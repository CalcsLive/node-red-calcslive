'use strict';

const helper = require('node-red-node-test-helper');
const calculateNode = require('../nodes/calculate/calcslive-calculate');
const configNode = require('../nodes/config/calcslive-config');

helper.init(require.resolve('node-red'));

describe('calcslive-calculate node', function () {
  before(function (done) { helper.startServer(done); });
  after(function (done) { helper.stopServer(done); });
  afterEach(function () { return helper.unload(); });

  it('should error when no config node is selected', function (done) {
    const flow = [
      { id: 'n1', type: 'calcslive-calculate', name: 'test', configNodeId: '', articleId: 'abc', inputsJson: '{}', outputsJson: '' }
    ];
    helper.load([calculateNode, configNode], flow, function () {
      const n1 = helper.getNode('n1');
      n1.on('call:error', function (call) {
        call.args[0].should.match(/No CalcsLive config/);
        done();
      });
      n1.receive({ payload: {} });
    });
  });

  it('should error when article ID is missing', function (done) {
    const flow = [
      { id: 'cfg1', type: 'calcslive-config', name: 'test config', baseUrl: 'https://www.calcslive.com' },
      { id: 'n1', type: 'calcslive-calculate', name: 'test', configNodeId: 'cfg1', articleId: '', inputsJson: '{}', outputsJson: '' }
    ];
    const credentials = { cfg1: { apiKey: 'test-key' } };
    helper.load([calculateNode, configNode], flow, credentials, function () {
      const n1 = helper.getNode('n1');
      n1.on('call:error', function (call) {
        call.args[0].should.match(/Article ID is required/);
        done();
      });
      n1.receive({ payload: {} });
    });
  });

  it('should error when inputs JSON is invalid', function (done) {
    const flow = [
      { id: 'cfg1', type: 'calcslive-config', name: 'test config', baseUrl: 'https://www.calcslive.com' },
      { id: 'n1', type: 'calcslive-calculate', name: 'test', configNodeId: 'cfg1', articleId: 'abc123', inputsJson: 'not-json', outputsJson: '' }
    ];
    const credentials = { cfg1: { apiKey: 'test-key' } };
    helper.load([calculateNode, configNode], flow, credentials, function () {
      const n1 = helper.getNode('n1');
      n1.on('call:error', function (call) {
        call.args[0].should.match(/Invalid JSON/);
        done();
      });
      n1.receive({ payload: {} });
    });
  });

  it('msg.articleId overrides static node config', function (done) {
    this.timeout(8000);
    const flow = [
      { id: 'cfg1', type: 'calcslive-config', name: 'test config', baseUrl: 'http://localhost:19999' },
      { id: 'n1', type: 'calcslive-calculate', name: 'test', configNodeId: 'cfg1', articleId: 'static-id', inputsJson: '{}', outputsJson: '' }
    ];
    const credentials = { cfg1: { apiKey: 'test-key' } };
    helper.load([calculateNode, configNode], flow, credentials, function () {
      const n1 = helper.getNode('n1');
      n1.on('call:error', function (call) {
        call.args[0].should.match(/CalcsLive unreachable|ECONNREFUSED/);
        done();
      });
      n1.receive({ payload: {}, articleId: 'override-id' });
    });
  });

});
