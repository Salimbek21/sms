import express from "express";
import bodyParser from "body-parser";
import { SMSCClient } from "./smsc-client.js";
import dotenv from 'dotenv'
dotenv.config();
import file from "./config.development.json" with { type: "json" };
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });
console.log('Running in:', process.env.NODE_ENV);
console.log('API URL:', process.env.URL);

const app = express();

const port = process.env.PORT || 3000;

const environment = process.env.NODE_ENV;

app.use(bodyParser.json());

const smscConfig = file.smsc;

const smscClient = new SMSCClient(
  smscConfig.host,
  smscConfig.port,
  smscConfig.username,
  smscConfig.password,
  smscConfig.type,
  smscConfig.address,
  false
);

// Route for sending SMS
app.post("/send-sms", async (req, res) => {
  const { phone, message } = req.body;
  console.log("env: " + environment);
  try {
    const msgLength = message.length;
    if (msgLength <= 254) {
      console.log("Send short msg");
      const result = await smscClient.sendShortSMS(phone, message);
      res.json({ success: true, result });
    } else {
      console.log("Send msg");
      const result = await smscClient.sendSMS(phone, message);
      res.json({ success: true, result });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port} in ${environment} mode`);
});
