// Load the default region
// process.env.AWS_SDK_LOAD_CONFIG = 1;

const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const port = 80;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

AWS.config.getCredentials((err) => {
  if (err) {
    // credentials not loaded
    console.error(err.stack);
    console.error('AWS credentials aren\'t set! Is this an Amazon EC2 instance?');
    process.exit(1);
  }
});

const ses = new AWS.SES();

const emailQueue = [];

const tick = async () => {
  const start = Date.now();
  let mail;
  let count = 0;
  try {
    while (mail = emailQueue.shift()) {
      await ses.sendEmail({
        Destination: {
          ToAddresses: [mail.to],
        },
        Message: {
          Body: {
            Html: {
             Charset: 'UTF-8',
             Data: mail.body
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: mail.subject
          },
        },
        Source: mail.from,
      }).promise();
      count++;
    }
  } catch (e) {
    console.error(e);
    let json = JSON.stringify(e);
    if (~json.indexOf('Maximum sending rate exceeded') || ~json.indexOf('Daily sending quota exceeded')) {
      console.log('Quota reached, trying again next second');
      emailQueue.unshift(mail);
    }
  }

  if (count > 0) {
    console.log(`Sent ${count} emails (${Date.now() - start}ms)`);
  }
}

setInterval(tick, 1000);

const sendMail = (to, from, subject, body) => {
  emailQueue.push({
    to,
    from,
    subject,
    body
  });
}

app.post('/', async (req, res) => {
  if (!req.body || !req.body.to || !req.body.from || !req.body.subject || !req.body.body) {
    res.status(400).send('Missing parameters');
  }

  await sendMail(req.body.to, req.body.from, req.body.subject, req.body.body);
  res.send('Email queued');
});

app.listen(port, () => {
  console.log(`aws-ses-queue listening at http://0.0.0.0:${port}`);
});

module.export = sendMail;