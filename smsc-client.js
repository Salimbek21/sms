import { Session } from 'smpp';

export class SMSCClient {
  constructor(host, port, system_id, password, system_type, source_addr, enableDebug = false) {
    this.host = host;
    this.port = port;
    this.system_id = system_id;
    this.password = password;
    this.system_type = system_type;
    this.source_addr = source_addr;
    this.enableDebug = enableDebug;
    this.session = null;
    this.isConnected = false;
  }
  
  async sendSMS(dest, messageText) {
    return new Promise((resolveFunc, rejectFunc) => {
      this.getSession().then((session) => {
        session.submit_sm({
          source_addr: this.source_addr,
          source_addr_ton: 0x05,
          source_addr_npi: 0x0,
          destination_addr: dest,
          message_payload: messageText
        }, function (pdu) {
          resolveFunc({ status: pdu.command_status, messageId: pdu.message_id })
          return;
        });
      }).catch(rejectFunc);
    });

  }
  
  async sendShortSMS(dest, messageText) {
    return new Promise((resolveFunc, rejectFunc) => {
      this.getSession().then((session) => {
        session.submit_sm({
          source_addr: this.source_addr,
          source_addr_ton: 0x05,
          source_addr_npi: 0x0,
          destination_addr: dest,
          short_message: messageText
        }, function (pdu) {
          resolveFunc({ status: pdu.command_status, messageId: pdu.message_id })
          return;
        });
      }).catch(rejectFunc);
    });

  }

  getSession() {
    return new Promise((resolveFunc, rejectFunc) => {

      if (this.session != null) {
        if (this.isConnected) {
          resolveFunc(this.session);
          return;
        } else {
          console.log("Session disconnected before, connecting...")
          this.session.connect();
          resolveFunc(this.session)
          return;
        }
      }

      this.session = new Session({ host: this.host, port: this.port, auto_enquire_link_period: 10000,
        debug: this.enableDebug });

      
      this.session.on('connect', () => {
        this.isConnected = true;
        console.log("Session established.");
        this.session.bind_transceiver({
          system_id: this.system_id,
          password: this.password,
          //interface_version: 1,
          system_type: this.system_type,
          //address_range: '',
          //addr_ton: 1,
          //addr_npi: 1,
        }, (pdu) => {
          console.log("bind_transceiver status (0 is success): " + pdu.command_status)
          if (pdu.command_status == 0) {
            resolveFunc(this.session);
            return;
          } else {
           rejectFunc(pdu.command_status);
          }
        })
      })

      this.session.on('close', () => {
        this.isConnected = false;
        if (this.enableDebug) {
          console.log('smpp is now disconnected')
        }
      })

      this.session.on('error', error => {
        console.log('smpp error', error)
        rejectFunc(error);
        return;
      });

      if (this.enableDebug) {
        this.session.on('debug', function (type, msg, payload) {
          console.log({ type: type, msg: msg, payload: payload });
        });
      }
    }
    )
  };
}

// process.stdin.resume();