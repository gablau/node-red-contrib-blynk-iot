module.exports = (RED) => {
  function BlynkOutSyncNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.pin = n.pin;
    this.pinmode = n.pinmode;

    if (this.pinmode == 1) this.connected_label = RED._('blynk-iot-out-sync.status.connected-all'); // eslint-disable-line eqeqeq
    else this.connected_label = RED._('blynk-iot-out-sync.status.connected-fixed') + this.pin;


    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.on('status-connecting', () => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-iot-out-sync.status.connecting'),
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
          text: 'blynk-iot-out-sync.status.error',
        });
      });
      this.blynkClient.on('status-disconnnected', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-iot-out-sync.status.disconnected',
        });
      });
      this.blynkClient.on('status-disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-iot-out-sync.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-iot-out-sync.errors.missing-conf'));
    }

    this.on('input', (msg) => {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        node.log('## logged is FALSE');
        return;
      }

      if (msg.hasOwnProperty('payload')) {
        if (node.pinmode == 1) { // eslint-disable-line eqeqeq
          node.blynkClient.syncAll();
        } else {
          const pins = [];
          const tmpPins = node.pin.split(',').map((m) => parseInt(m.trim(), 10));
          node.log(tmpPins);
          for (let i = 0; i < tmpPins.length; i++) {
            tmpPins[i] = +tmpPins[i];
            if (!Number.isNaN(tmpPins[i]) && tmpPins[i] >= 0 && tmpPins[i] <= 255) {
              pins.push(tmpPins[i].toString());
            }
          }
          node.blynkClient.syncVirtual(pins.join('\0'));
        }
      }
    });
  }

  RED.nodes.registerType('blynk-iot-out-sync', BlynkOutSyncNode);
};
