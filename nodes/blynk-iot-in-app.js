module.exports = (RED) => {
  function BlynkInAppNode(n) {
    RED.nodes.createNode(this, n);
    this.client = n.client;
    const node = this;
    this.blynkClient = RED.nodes.getNode(this.client);

    this.nodeType = 'app';

    if (this.blynkClient) {
      this.blynkClient.registerInputNode(this);

      this.blynkClient.on('status-connecting', () => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-iot-in-app.status.connecting'),
        });
      });
      this.blynkClient.on('status-connected', () => {
        node.status({
          fill: 'green',
          shape: 'dot',
          text: 'blynk-iot-in-app.status.connected',
        });
      });
      this.blynkClient.on('status-error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-in-app.status.error',
        });
      });
      this.blynkClient.on('status-disconnnected', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-in-app.status.disconnected',
        });
      });
      this.blynkClient.on('status-disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-iot-in-app.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-iot-in-app.errors.missing-conf'));
    }

    this.on('close', () => {
      if (node.blynkClient) {
        node.blynkClient.removeInputNode(node);
      }
    });
  }

  RED.nodes.registerType('blynk-iot-in-app', BlynkInAppNode);
};
