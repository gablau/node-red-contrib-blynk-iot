module.exports = (RED) => {
  function BlynkOutWriteNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.pin = n.pin;
    this.pinmode = n.pinmode;

    if (this.pinmode == 1) { // eslint-disable-line eqeqeq
      this.connected_label = RED._('blynk-iot-out-write.status.connected-dynamic');
    } else this.connected_label = RED._('blynk-iot-out-write.status.connected-fixed') + this.pin;


    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.on('status-connecting', () => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-iot-out-write.status.connecting'),
        });
      });
      this.blynkClient.on('status-connected', () => {
        node.status({
          fill: 'green',
          shape: 'dot',
          text: node.connected_label,
        });
      });
      this.blynkClient.on('status-error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-out-write.status.error',
        });
      });
      this.blynkClient.on('status-disconnnected', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-out-write.status.disconnected',
        });
      });
      this.blynkClient.on('status-disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-iot-out-write.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-iot-out-write.errors.missing-conf'));
    }
    this.on('input', (msg) => {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        node.log(`## logged is FALSE`);
        return;
      }

      if (msg.hasOwnProperty('payload')) {
        const payload = Array.isArray(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
        let pin = node.pin;
        if (node.pinmode == 1) { // eslint-disable-line eqeqeq
          if (!msg.hasOwnProperty('pin')) {
            node.warn('Write node - Setting "pin mode" to "dynamic" but no msg.pin found.');
            return;
          }
          if (msg.pin < 0 || msg.pin > 255) {
            node.warn('Write node - The msg.pin must be between 0 and 255.');
            return;
          }
          pin = msg.pin;
        }
        node.blynkClient.virtualWrite(pin, payload);
      }
    });
  }

  RED.nodes.registerType('blynk-iot-out-write', BlynkOutWriteNode);
};
