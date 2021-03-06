import axios from 'axios'
import express from 'express'
import { CourierClient } from "@trycourier/courier";
import winston from 'winston';
import 'dotenv/config'

 const courier = CourierClient(
   { authorizationToken: process.env.AUTH_TOKEN });


  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });
 
const app = express()
const port = 3000
const minutes = 1
const the_interval = minutes * 60 * 1000;
let error = false;
let data;
const emails = []

const sendEmails = async (body) => {
  Promise.all(emails.map(email => {
    return  courier.send({
      message: {
        content: {
          title: "Passport appointment service",
          body,
        },
        to: {
          email
        }
      }
    });
  }))
}

app.listen(port, () => {

  console.log(`listening at http://localhost:${port}`)
  const getResponse = async () => {
    try {
      const res = await axios.get('https://www.passportappointment.service.gov.uk');
      if (error) {
        data = JSON.stringify(res.data);
        logger.info(`${new Date().toISOString()}${res.status}`)
        await sendEmails(
          `Website recovered from error, status : ${res.status}\n
          data: ${data}
        `)
      } else if (JSON.stringify(res.data) !== data) {
        data = JSON.stringify(res.data);
        logger.info(`${new Date().toISOString()}${res.status}`)
        await sendEmails(
          `status : ${res.status}\n
          data: ${data}
        `)
      }
      error = false;
    } catch(e) {
      if (!error) {
        await sendEmails(`Error response meaning website is probably down: ${e.message}`)
      }
      error = true;
      console.log(e.message)
      logger.error(`${new Date().toISOString()} ${e.message}`)
      
    }
  }
  getResponse();
  setInterval(() => {
    getResponse();
  }, the_interval);
})

