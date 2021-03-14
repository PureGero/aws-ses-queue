// Load the default region
// process.env.AWS_SDK_LOAD_CONFIG = 1;

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ses = new AWS.SES();

let emailsSent;
let emailsPerSecond;

async function getBucketNames() {
  return (await s3.listBuckets().promise()).Buckets.filter(b => b.Name.startsWith('mail-server-send-queue-')).map(bucket => bucket.Name);
}

async function sendFirstEmailInBucket(bucket) {
  const objects = (await s3.listObjects({ Bucket: bucket }).promise()).Contents;

  if (objects.length) {
    await sendEmails(bucket, objects[0].Key);
  }
}

async function sendEmails(bucket, key) {
  const data = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  
  try {
    const json = JSON.parse(data.Body);
    if (json.emails) {
      for (let i = 0; i < json.emails.length; i++) {
        await sendEmail(json.emails[i]);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function sendEmail(mail) {
  const throttle = new Promise(resolve => setTimeout(resolve, 1000 / emailsPerSecond + 1));

  try {
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
  } catch (e) {
    console.error(e);
  }

  await throttle;
}

async function main() {
  emailsPerSecond = (await ses.getSendQuota()).MaxSendRate;

  do {
    emailsSent = 0;

    const sendQuota = await ses.getSendQuota();

    if (sendQuota.SentLast24Hours + 5000 > sendQuota.Max24HourSend) {
      console.error('Daily send quota reached, trying again in an hour');
      setTimeout(main, 60 * 60 * 1000);
      return;
    }

    const buckets = await getBucketNames();

    for (let i = 0; i < buckets.length; i++) {
      await sendFirstEmailInBucket(buckets[i]);
    }

  } while (emailsSent);

  require('child_process').exec('shutdown -h now');
}

setTimeout(() => require('child_process').exec('shutdown -h now'), 12 * 60 * 60 * 1000);

main();