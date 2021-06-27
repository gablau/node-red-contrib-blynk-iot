// blynk enum
const srs = require('secure-random-string');
const utf8 = require('utf8');
const blynkEnum = require('./blynk-enum');

const MsgStatus = blynkEnum.MsgStatus;
const MsgType = blynkEnum.MsgType;

// blynk util
const blynkUtil = require('./blynk-util');

const messageToDebugString = blynkUtil.messageToDebugString;
const commandToDebugString = blynkUtil.commandToDebugString;
const blynkHeader = blynkUtil.blynkHeader;
const getStatusByCode = blynkUtil.getStatusByCode;
const getTimestamp = blynkUtil.getTimestamp;

// iniziate SRS
srs({ length: 16, alphanumeric: true });

/* ##### BLYNK STUFF ###### */

// C++ Library Version
// 1.0.0 - 2021-05-25

// Server Version
// public cloud

// Blynk library constant
const BLYNK_VERSION = '1.0.0'; // blynk library version
const BLYNK_HEARTBEAT = 45; // seconds
const BLYNK_PROTOCOL_MAX_LENGTH = 32767; // java Short.MAX_VALUE
const BLYNK_MAX_CMD_IN_MESSAGE = 1024; // max command in a single message

// ### PROTOCOL ###

/* build a blynk command */
const blynkCmd = function blynkCmd(msgType, vals, forceMsgId) {
  const self = this;
  let msgId = forceMsgId;
  let values = vals || [''];

  if (msgType === MsgType.RSP) {
    return blynkHeader(msgType, (forceMsgId - 1), values);
  }

  // set id and check max 2 byte limit
  if (self.msgId > 0xFFFF) self.msgId = 1;
  if (msgId > 0xFFFF) msgId = 1;

  msgId = msgId || (self.msgId++);

  if (typeof values === 'string' || typeof values === 'number') {
    values = [values];
  }

  // utf8 convert
  if (Array.isArray(values) && values.length > 0) {
    for (let i = 0; i < values.length; i++) {
      if (typeof values[i] === 'string') {
        values[i] = utf8.encode(values[i]);
      }
    }
  }

  const data = values.join('\0');
  return blynkHeader(msgType, msgId, data.length) + data;
};

const sendRsp = function sendRsp(msgType, msgId, msgLen, msgData) {
  const data = msgData || '';
  let msg = null;
  if (msgType === MsgType.RSP) {
    msg = this.blynkCmd(msgType, msgLen, msgId);
  } else {
    msg = this.blynkCmd(msgType, data, msgId);
  }

  this.sendMsg(msg);
};

/* send binary message througth tlsClient */
const sendMsg = function sendMsg(data) {
  if (data.length < 5 || data === undefined) {
    this.log('ERROR sendMsg - No data to send');
    return;
  }

  if (data.length > BLYNK_PROTOCOL_MAX_LENGTH) {
    this.log(`ERROR sendMsg - Message too long: ${data.length}bytes`);
    return;
  }
  if (this.dbg_low) {
    this.log(`SEND -> ${messageToDebugString(data)}`);
  }
  // convert to Uint8Array
  const rawdata = new Uint8Array(data.length);
  for (let i = 0, j = data.length; i < j; ++i) {
    rawdata[i] = data.charCodeAt(i);
  }
  const currTimestamp = getTimestamp();
  this.lastHeartBeat = currTimestamp;
  this.lastActivityOut = currTimestamp;
  // this.log(rawdata);
  this.log(`## TLS state: ${this.tlsClient.readyState}`);
  this.tlsClient.write(rawdata);
};

/* Send multiple command message - delete key */
const sendMsgMulti = function sendMsgMulti(key) {
  this.sendMsg(this.msgList[key]);
  delete this.msgList[key]; // unset key
};

/* Start multiple command message - generate key */
const startMsgMulti = function startMsgMulti() {
  const key = srs({ length: 16, alphanumeric: true });
  this.msgList[key] = '';
  return key;
};

const processCommand = function processCommand(cmd) {
  const RED = this.RED;

  if (!this.logged) {
    if (cmd.type === MsgType.RSP && cmd.msgId === 1) {
      switch (cmd.len) {
        case MsgStatus.OK:
        case MsgStatus.ALREADY_REGISTERED:
          this.log('Client logged');
          this.logged = true;
          this.log('## SET logged TRUE');
          this.sendInfo();
          this.emit('status-connected', '');
          break;
        case MsgStatus.INVALID_TOKEN:
          this.log('Invalid auth token');
          this.logged = false;
          this.log('## SET logged FALSE');
          break;
        case MsgStatus.NOT_AUTHENTICATED:
          this.log('Not autenticated');
          this.logged = false;
          this.log('## SET logged FALSE');
          break;
        default:
          this.log(`Connect failed. code: ${getStatusByCode(cmd.len)}`);
          this.logged = false;
          this.log('## SET logged FALSE');
          break;
      }
    }
    if (cmd.type === MsgType.RSP && cmd.len === MsgStatus.NOT_AUTHENTICATED) {
      this.log('Not autenticated');
    }
    if (cmd.type === MsgType.REDIRECT) {
      // handle server redirect
      const values = cmd.body.split('\0');
      const servername = values[0];
      let port = 443;
      if (values[1] > 0) port = values[1];
      const newpath = `${servername}:${port}`;
      this.path = newpath;
      this.log(`Connection redirecting to: ${newpath}`);
      // this.warn(`Connection redirecting to: ${newpath}`);
    }
  } else {
    // logged

    // update received activity not update heartbeat
    if (cmd.type !== MsgType.RSP) {
      this.lastActivityIn = getTimestamp();
    }

    switch (cmd.type) {
      case MsgType.RSP:
        if (cmd.status !== MsgStatus.OK) {
          // handle not ok response message
          let error = false;
          for (const k in MsgStatus) {// eslint-disable-line 
            if (MsgStatus.hasOwnProperty(k)) { // eslint-disable-line
              if (cmd.status == MsgStatus[k]) error = true; // eslint-disable-line
            }
          }
          if (error) {
            // handle know error
            switch (cmd.status) {
              case MsgStatus.NOT_AUTHENTICATED:
                this.log('Not autenticated');
                break;
              case MsgStatus.INVALID_TOKEN:
                this.log('Invalid auth token');
                break;
              case MsgStatus.ILLEGAL_COMMAND_BODY:
                // this.log("Illegal command body");
                break;
              default:
                this.warn(
                  RED._(`Response Error: ${getStatusByCode(cmd.status)}`),
                );
                break;
            }
          } else {
            this.warn(
              RED._(`Unhandled RSP type: ${commandToDebugString(cmd)}`),
            );
          }
        }
        break;
      case MsgType.HW_LOGIN:
      case MsgType.LOGIN:
      case MsgType.PING:
        this.sendRsp(MsgType.RSP, this.msgId, MsgStatus.OK);
        break;
      case MsgType.HW:
      case MsgType.BRIDGE:
        // this.warn(cmd.typeString+" cmd: " + JSON.stringify(cmd));
        switch (cmd.operation) {
          // input nodes
          case 'vw':
            this.handleWriteEvent(cmd);
            break;
          case 'vr':
            this.handleReadEvent(cmd);
            break;
          case 'pm':
            // skip message "pin mode"
            break;
          default:
            this.warn(
              RED._(
                `Invalid ${
                  cmd.typeString
                } cmd: ${
                  commandToDebugString(cmd)}`,
              ),
            );
            this.sendRspIllegalCmd(this.msgId);
        }
        break;
      case MsgType.INTERNAL:
        switch (cmd.body) {
          // app event node
          case 'acon':
          case 'adis':
            this.handleAppEvent(cmd.body);
            break;
          case 'rtc':
          case 'utc':
          case 'ota':
          case 'vfs':
          case 'dbg':
          case 'meta':
            this.warn(
              RED._(`Not implemented INTERNAL cmd: ${commandToDebugString(cmd)}`),
            );
            break;
          default:
            this.warn(
              RED._(`Invalid INTERNAL cmd: ${commandToDebugString(cmd)}`),
            );
        }
        break;
      case MsgType.DEBUG_PRINT:
        this.log(`Server: ${cmd.body}`);
        break;
      default:
        this.warn(RED._(`Invalid header type: ${commandToDebugString(cmd)}`));
        this.sendRspIllegalCmd(this.msgId);
    }
  }
};

// ### PROTOCOL COMMAND ###

/* send login message */
const login = function login(token) {
  if (this.dbg_all) {
    this.log(
      `login -> ${
        String(`********************************${token.slice(-5)}`).slice(-32)}`,
    );
  }
  this.sendMsg(this.blynkCmd(MsgType.HW_LOGIN, token, 1));
};

/* send Illegal command response message */
const sendRspIllegalCmd = function sendRspIllegalCmd(msgId) {
  this.sendRsp(MsgType.RSP, msgId, MsgStatus.ILLEGAL_COMMAND);
};

/* send info message */
const sendInfo = function sendInfo() {
  const info = [
    'ver', BLYNK_VERSION,
    'h-beat', BLYNK_HEARTBEAT,
    'buff-in', BLYNK_PROTOCOL_MAX_LENGTH,
    'dev', 'node-red',
    'con', 'blynk-tls',
    'fw-type', this.tmpl,
    'fw', this.LIBRARY_VERSION,
    'build', this.LIBRARY_DATE,
    'tmpl', this.tmpl,
  ];
  this.msgId++;
  this.sendMsg(this.blynkCmd(MsgType.INTERNAL, info));
};

/* send ping message */
const ping = function ping() {
  if (this.dbg_all || this.dbg_read) {
    this.log('ping');
  }
  this.lastHeartbeat = getTimestamp();
  this.sendMsg(this.blynkCmd(MsgType.PING));
};

/* send syncAll message */
const syncAll = function syncAll(msgkey) {
  if (this.dbg_all || this.dbg_sync) {
    this.log('syncAll: -> all');
  }
  const msg = this.blynkCmd(MsgType.HW_SYNC);
  if (this.multi_cmd && msgkey !== undefined) {
    this.msgList[msgkey] = this.msgList[msgkey] + msg;
  } else this.sendMsg(msg);
};

/* send syncVirtual message */
const syncVirtual = function syncVirtual(vpin, msgkey) {
  if (this.dbg_all || this.dbg_sync || this.isLogPin(vpin)) {
    this.log(`syncVirtual: -> ${JSON.stringify(['vr', vpin])}`);
  }
  const msg = this.blynkCmd(MsgType.HW_SYNC, ['vr', vpin]);
  if (this.multi_cmd && msgkey !== undefined) {
    this.msgList[msgkey] = this.msgList[msgkey] + msg;
  } else this.sendMsg(msg);
};

/* send virtualWrite message */
const virtualWrite = function virtualWrite(vpin, val, msgkey) {
  if (this.dbg_all || this.dbg_write || this.isLogPin(vpin)) {
    this.log(`virtualWrite: -> ${JSON.stringify(['vw', vpin].concat(val))}`);
  }
  const msg = this.blynkCmd(MsgType.HW, ['vw', vpin].concat(val));
  if (this.multi_cmd && msgkey !== undefined) {
    this.msgList[msgkey] = this.msgList[msgkey] + msg;
  } else this.sendMsg(msg);
};

/* send setProperty message - set msgkey form multimple command message */
const setProperty = function setProperty(vpin, prop, val, msgkey) {
  if (this.dbg_all || this.dbg_prop || this.isLogPin(vpin)) {
    this.log(`setProperty -> ${JSON.stringify([vpin, prop].concat(val))}`);
  }
  const msg = this.blynkCmd(MsgType.PROPERTY, [vpin, prop].concat(val));
  if (this.multi_cmd && msgkey !== undefined) {
    this.msgList[msgkey] = this.msgList[msgkey] + msg;
  } else this.sendMsg(msg);
};

module.exports = {
  // constants
  BLYNK_VERSION,
  BLYNK_HEARTBEAT,
  BLYNK_PROTOCOL_MAX_LENGTH,
  BLYNK_MAX_CMD_IN_MESSAGE,
  // protocol functions
  blynkCmd,
  sendRsp,
  sendMsg,
  sendMsgMulti,
  startMsgMulti,
  processCommand,
  // protocol commands
  login,
  sendInfo,
  sendRspIllegalCmd,
  ping,
  syncAll,
  syncVirtual,
  virtualWrite,
  setProperty,
};
