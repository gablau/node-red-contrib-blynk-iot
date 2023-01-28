const blynkUtil = require('../libs/blynk-util.js');

module.exports = (RED) => {
  function BlynkMetadataNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.metaname = n.metaname;
    this.action = n.action;
    this.nodeType = 'metadata';

    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.registerInputNode(this);
      this.blynkClient.on('status-connecting', () => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-iot-metadata.status.connecting'),
        });
      });
      this.blynkClient.on('status-connected', () => {
        node.status({
          fill: 'green',
          shape: 'dot',
          text: RED._('blynk-iot-metadata.status.connected'),
        });
      });
      this.blynkClient.on('status-error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-metadata.status.error',
        });
      });
      this.blynkClient.on('status-disconnnected', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-metadata.status.disconnected',
        });
      });
      this.blynkClient.on('status-disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-iot-metadata.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-iot-metadata.errors.missing-conf'));
    }

    this.on('input', function input(msg) {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      const validAction = ['get', 'set'];



      if (msg.hasOwnProperty('payload')) {
        const metaname = RED.util.ensureString(msg.payload);
       // const pin = node.pin;
        //const newmsg = {};
        let action = null;
        if (metaname === null || metaname === '') {
          node.warn('missing metadata name (payload)');
          return;
        }

        if (msg.hasOwnProperty('action')) {
          action = RED.util.ensureString(msg.action);
          if (validAction.indexOf(action) === -1) {
            node.warn('invalid action (get or set)');
            return;
          }
        }

        if (action === 'get') {
          node.blynkClient.sendMeta(action, metaname);
        } else { // set
          if (msg.hasOwnProperty('value')) {
            value = RED.util.ensureString(msg.value);
            node.blynkClient.sendMeta(action, metaname, value);
          } else {
            node.warn('missing value');
            return;
          }
        }

      }
    });

    this.on('close', () => {
      if (node.blynkClient) {
        node.blynkClient.removeInputNode(node);
      }
    });
  }

  RED.nodes.registerType('blynk-iot-metadata', BlynkMetadataNode);
};
