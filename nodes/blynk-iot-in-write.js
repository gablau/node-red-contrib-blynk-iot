module.exports = (RED) => {
  function BlynkInWriteNode(n) {
    RED.nodes.createNode(this, n);
    this.client = n.client;
    const node = this;
    this.blynkClient = RED.nodes.getNode(this.client);
    this.nodeType = 'write';
    this.pin = n.pin;
    this.pin_all = n.pin_all;

    if (this.pin_all) this.connected_label = RED._('blynk-iot-in-write.status.connected-all');
    else this.connected_label = RED._('blynk-iot-in-write.status.connected-fixed') + this.pin;

    if (this.blynkClient) {
      this.blynkClient.registerInputNode(this);

      this.blynkClient.on('status-connecting', () => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-iot-in-write.status.connecting'),
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
          text: 'blynk-iot-in-write.status.error',
        });
      });
      this.blynkClient.on('status-disconnnected', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-in-write.status.disconnected',
        });
      });
      this.blynkClient.on('status-disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-iot-in-write.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-iot-in-write.errors.missing-conf'));
    }

    this.on('close', () => {
      if (node.blynkClient) {
        node.blynkClient.removeInputNode(node);
      }
    });
  }

  RED.nodes.registerType('blynk-iot-in-write', BlynkInWriteNode);
};
