const tls = require('tls');

// blynk util
const blynkUtil = require('../libs/blynk-util');

// blynk lib
const blynkLib = require('../libs/blynk-lib');

module.exports = (RED) => {
  const LIBRARY_VERSION = '0.2.0'; // node-red lib version
  const LIBRARY_DATE = '2021-06-27'; // node-red lib date

  const RECONNECT_TIMEOUT_SECONDS = 5; // number of seconds for reconnection when disconnected or socket error

  // A node-red node that setup a tsl connection to blynk server
  function BlynkClientNode(n) {
    const node = this;
    // compatibility: enable config node from old version < 0.8.0 library
    if (n.enabled === undefined) {
      n.enabled = true; // eslint-disable-line no-param-reassign
    }
    // Create a RED node
    RED.nodes.createNode(this, n);
    // Store local copies of the node configuration (as defined in the .html)
    this.path = n.path;
    this.key = n.key;
    this.tmpl = n.tmpl;
    this.dbg_all = n.dbg_all;
    this.dbg_read = n.dbg_read;
    this.dbg_write = n.dbg_write;
    this.dbg_prop = n.dbg_prop;
    this.dbg_low = n.dbg_low;
    this.dbg_sync = n.dbg_sync;
    this.dbg_pins = n.dbg_pins;
    this.multi_cmd = n.multi_cmd;

    this.enabled = n.enabled;

    this.log_pins = [];
    if (typeof this.dbg_pins === 'string') {
      const tmpPins = this.dbg_pins.split(',').map((m) => parseInt(m.trim(), 10));
      for (let i = 0; i < tmpPins.length; i++) {
        tmpPins[i] = +tmpPins[i];
        if (!Number.isNaN(tmpPins[i]) && tmpPins[i] >= 0 && tmpPins[i] <= 255) {
          this.log_pins.push(tmpPins[i].toString());
        }
      }
    }

    this.inputNodes = []; // collection of nodes that want to receive events
    this.closing = false;
    this.logged = false;
    this.msgId = 1;

    this.LIBRARY_VERSION = LIBRARY_VERSION;
    this.LIBRARY_DATE = LIBRARY_DATE;
    this.RECONNECT_TIMEOUT_SECONDS = RECONNECT_TIMEOUT_SECONDS;
    this.RED = RED;

    // heartbit
    this.lastActivityIn = 0;
    this.lastActivityOut = 0;
    this.lastHeartBeat = 0;

    this.setMaxListeners(100);

    this.pinger = setInterval(() => {
      // only ping if connected and working
      if (node.logged) {
        const now = blynkUtil.getTimestamp();
        const diff = now - node.lastHeartBeat;
        // node.log("PING " + now + " - " + diff + " - "+node.lastHeartBeat+" "+node.last_activity_in+" "+node.last_activity_out);
        if (diff >= blynkLib.BLYNK_HEARTBEAT) {
          node.ping();
        }
      }
    }, 1000);

    this.msgList = {};
    this.reconnect_timeout = null;


    node.log(`LOG PINS ${JSON.stringify(this.log_pins)}`);

    function resetReconnect(err) {
      node.log(`## FUNC resetReconnect`);
      node.logged = false;
      node.log(`## SET logged FALSE`);
      node.log(`## TLS state: ${node.tlsClient.readyState}`);
      if (node.tlsClient) {
        node.tlsClient.destroy(err);
        node.log(`TLS destroy`);
        node.emit('status-disconnnected'); // set disconnect on Node-Red UI
      }
      if (node.reconnect_timeout) {
        clearTimeout(node.reconnect_timeout);
      }
    }


    function reconnect() {
      node.log(`## FUNC reconnect`);
      node.logged = false;
      node.log(`## SET logged FALSE`);
      node.log(`## TLS state: ${node.tlsClient.readyState}`);
      if (!node.closing) {
        node.log(`Reconnect in ${node.RECONNECT_TIMEOUT_SECONDS} seconds...`);
        clearTimeout(node.reconnect_timeout);
        node.reconnect_timeout = setTimeout(() => {
          startconn(); // eslint-disable-line no-use-before-define
        }, node.RECONNECT_TIMEOUT_SECONDS * 1000); // try to reconnect
      }
    }

    function startconn() { // Connect to remote endpoint
      // should not start connection if no server or key
      node.log(`## FUNC startconn`);
      node.logged = false;
      node.log(`## SET logged FALSE`);
      node.emit('status-connecting');

      const values = node.path.split(':');
      const host = values[0];
      let port = 443;
      if (values[1] > 0) port = values[1];

      const tlsOptions = {
        host: host,
        port: port,
        rejectUnauthorized: false,
      };

      node.log(`Start TLS connection: ${tlsOptions.host}:${tlsOptions.port}`);
      const tlsClient = tls.connect(tlsOptions, () => {
        if (!tlsClient.authorized) {
          node.log(`Connection not authorized: ${tlsClient.authorizationError}`);
        }
        tlsClient.setNoDelay(true);
        tlsClient.setEncoding('binary');
      });
      node.tlsClient = tlsClient; // keep for closing

      const currTimestamp = blynkUtil.getTimestamp();
      node.lastHeartBeat = currTimestamp;
      node.lastActivityIn = currTimestamp;
      node.lastActivityOut = currTimestamp;

      /*
      tlsClient.on('connect', () => {
        node.log('TLS: connect');
      });
      */

      tlsClient.on('timeout', () => {
        node.log('TLS: timeout');
      });


      tlsClient.on('ready', () => {
        // node.log('TLS: ready');
        node.login(node.key);
      });

      tlsClient.on('data', (msgData) => {
        // console.log('TLS: data');
        // console.log("Received " + msgData.length + " bytes " + msgData + " hex " + msgData.toString('hex'));
        let data = msgData.toString(); // convert to string
        // console.log("Conv " + data.length + " char " + data.toString('hex'));
        // let data = msgData; // convert to string
        if (data.length > blynkLib.BLYNK_PROTOCOL_MAX_LENGTH) {
          node.warn(`Message too long: ${data.length}bytes`);
          node.sendRspIllegalCmd(node.msgId);
          return;
        }
        let msgcount = 0;

        if (node.dbg_low) {
          node.log(`RECV <- ${blynkUtil.messageToDebugString(data)}`);
        }
        while (data.length > 0) {
          msgcount++;
          if (msgcount > blynkLib.BLYNK_MAX_CMD_IN_MESSAGE) {
            node.warn(`Too Blynk commands in a single message: ${msgcount}`);
            node.sendRspIllegalCmd(node.msgId);
            break;
          }

          const cmd = blynkUtil.decodeCommand(data);
          data = data.substr(cmd.msgLength); // remove current message from data

          node.processCommand(cmd);
        } // process message
      });

      tlsClient.on('close', (hadError) => {
        if (hadError) return;
        // node.log('TLS: close');
        node.log(`Socket closed: ${node.path}`);
        node.log(`## TLS state: ${tlsClient.readyState}`);
        //node.emit('status-disconnnected'); // set disconnect on Node-Red UI
        if (tlsClient.readyState !== 'open') {
          node.log('## socket is close -> reconnect');
          reconnect();
        }
      });

      tlsClient.on('error', (err) => {
        // node.log('TLS: error');
        node.error(`Socket error${err}`);
        node.log(`## TLS state: ${tlsClient.readyState}`);
        node.emit('error', err);
        reconnect();
      });

      tlsClient.on('end', () => {
        // node.log('TLS: end');
        node.log(`Socket end: ${node.path}`);
        node.log(`## TLS state: ${tlsClient.readyState}`);
        //node.emit('end');
        //reconnect();
      });
    }


    node.on('close', (removed, done) => {
      node.log('Client Close');
      node.closing = true;
      node.log(`## TLS state: ${this.tlsClient.readyState}`);
      resetReconnect();
      if (removed) {
        // This node has been disabled/deleted
      } else {
        // This node is being restarted
      }
      done();
    });

    node.on('error', (err) => {
      node.log('Client Error');
      node.log(`## TLS state: ${this.tlsClient.readyState}`);
      node.emit('status-error');
      node.closing = false;
      resetReconnect(err);
    });

    // test enabled check
    if (this.enabled) {
      node.emit('status-connecting');
      //setTimeout(() => {
        startconn(); // start outbound connection
      //}, 4000);
    } else {
      node.emit('status-disabled');
      setTimeout(() => {
        node.emit('status-disabled');
        node.log('Connection disabled by configuration');
      }, 2000);
    }
  }

  RED.nodes.registerType('blynk-iot-client', BlynkClientNode);

  BlynkClientNode.prototype.registerInputNode = function registerInputNode(handler) {
    let pinlog = '';
    if (handler.pin !== undefined) {
      pinlog = ` pin: ${handler.pin}`;
    }
    this.log(`${'Register input node - type: '}${handler.nodeType}${pinlog}`);
    this.inputNodes.push(handler);
  };

  BlynkClientNode.prototype.removeInputNode = function removeInputNode(handler) {
    let pinlog = '';
    if (handler.pin !== undefined) {
      pinlog = ` pin: ${handler.pin}`;
    }
    this.log(`${'Remove input node - type: '}${handler.nodeType}${pinlog}`);
    this.inputNodes.forEach((node, i, inputNodes) => {
      if (node === handler) {
        inputNodes.splice(i, 1);
      }
    });
  };

  BlynkClientNode.prototype.registerGenericNode = function registerGenericNode(handler, name) {
    let pinlog = '';
    let nodeType = '';
    if (handler.pin !== undefined) {
      pinlog = ` pin: ${handler.pin}`;
    }
    if (handler.nodeType !== undefined) {
      nodeType = ` type: ${handler.nodeType}`;
    }
    this.log(`Register ${name} node${nodeType}${pinlog}`);
  };

  /* check is pin need to be logged */
  BlynkClientNode.prototype.isLogPin = function isLogPin(pin) {
    return this.log_pins.indexOf(pin) > -1;
  };

  /* Load property from Blink lib and add as client prototype */
  const skipProperty = ['BLYNK_VERSION', 'BLYNK_HEARTBEAT', 'BLYNK_PROTOCOL_MAX_LENGTH', 'BLYNK_MAX_CMD_IN_MESSAGE'];
  const validProperty = Object.keys(blynkLib).filter((item) => (skipProperty.indexOf(item) === -1));
  for (let i = 0; i < validProperty.length; i++) {
    BlynkClientNode.prototype[validProperty[i]] = blynkLib[validProperty[i]];
  }

  BlynkClientNode.prototype.handleWriteEvent = function handleWriteEvent(command) {
    if (this.dbg_all || this.dbg_write || this.isLogPin(command.pin)) {
      this.log(`writeEvent: -> cmd ${JSON.stringify(command)}`);
    }
    for (let i = 0; i < this.inputNodes.length; i++) {
      if ((this.inputNodes[i].nodeType === 'write' || this.inputNodes[i].nodeType === 'zergba'
           || this.inputNodes[i].nodeType === 'style-btn' /* || this.inputNodes[i].nodeType == "image-gallery" */)
      && (this.inputNodes[i].pin === command.pin || this.inputNodes[i].pin_all)) {
        let msg;

        switch (this.inputNodes[i].nodeType) {
          case 'write':
          case 'style-btn':
          case 'image-gallery':

            msg = {
              payload: command.value,
              pin: command.pin,
            };

            if (command.array) {
              msg.arrayOfValues = command.array;
            }
            break;
          case 'zergba':

            msg = {
              payload: command.value,
              pin: command.pin,
            };

            if (Array.isArray(command.array) && command.array.length === 3) {
              msg.hex = blynkUtil.rgbToHex(parseInt(command.array[0], 10), parseInt(command.array[1], 10), parseInt(command.array[2], 10));
              const color = blynkUtil.hexToRgb(msg.hex);
              msg.r = color.r;
              msg.g = color.g;
              msg.b = color.b;
              msg.rgb = `${color.r};${color.g};${color.b}`;
              msg.payload = [color.r, color.g, color.b];

              this.inputNodes[i].status({
                fill: 'green',
                shape: 'dot',
                text: `${this.inputNodes[i].connected_label} [${color.r}, ${color.g}, ${color.b}]`,
              });
            } else {
              this.warn(RED._('blynk-iot-client.warn.zergba'));
            }
            break;
          default:
            return;
        }

        if (this.dbg_all || this.dbg_write || this.isLogPin(command.pin)) {
          this.log(`writeEvent: -> output ${JSON.stringify(msg)}`);
        }

        this.inputNodes[i].send(msg);
      }
    }
  };

  BlynkClientNode.prototype.handleReadEvent = function handleReadEvent(command) {
    if (this.dbg_all || this.dbg_read || this.isLogPin(command.pin)) {
      this.log(`readEvent: -> cmd ${JSON.stringify(command)}`);
    }
    for (let i = 0; i < this.inputNodes.length; i++) {
      if (this.inputNodes[i].nodeType === 'read' && (this.inputNodes[i].pin == command.pin || this.inputNodes[i].pin_all)) { // eslint-disable-line eqeqeq, max-len
        const msg = {
          payload: command.pin,
        };

        if (this.dbg_all || this.dbg_read || this.isLogPin(command.pin)) {
          this.log(`readEvent: -> output ${JSON.stringify(msg)}`);
        }

        this.inputNodes[i].send(msg);
      }
    }
  };

  BlynkClientNode.prototype.handleAppEvent = function handleAppEvent(command) {
    for (let i = 0; i < this.inputNodes.length; i++) {
      if (this.inputNodes[i].nodeType === 'app') {
        const msg = {
          payload: command,
        };

        this.inputNodes[i].send(msg);
      }
    }
  };
};
