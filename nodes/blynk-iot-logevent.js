const blynkUtil = require('../libs/blynk-util.js');

module.exports = (RED) => {
  function BlynkLogEventNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.eventcode = n.eventcode;
    this.description = n.description;
    this.nodeType = 'logevent';

    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.registerInputNode(this);
      this.blynkClient.on('status-connecting', () => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-iot-logevent.status.connecting'),
        });
      });
      this.blynkClient.on('status-connected', () => {
        node.status({
          fill: 'green',
          shape: 'dot',
          text: RED._('blynk-iot-logevent.status.connected'),
        });
      });
      this.blynkClient.on('status-error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-logevent.status.error',
        });
      });
      this.blynkClient.on('status-disconnnected', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-logevent.status.disconnected',
        });
      });
      this.blynkClient.on('status-disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-iot-logevent.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-iot-logevent.errors.missing-conf'));
    }

    this.on('input', function input(msg) {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      if (msg.hasOwnProperty('payload')) {
        let description = RED.util.ensureString(msg.payload);

        if (node.eventcode === null || node.eventcode === '') {
          node.warn('missing eventcode');
          return;
        }

        if (description === '') description = node.description;

        node.blynkClient.logEvent(node.eventcode, description);

      }
    });

    this.on('close', () => {
      if (node.blynkClient) {
        node.blynkClient.removeInputNode(node);
      }
    });
  }

  RED.nodes.registerType('blynk-iot-logevent', BlynkLogEventNode);
};
