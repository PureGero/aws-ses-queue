Emails are stored in an s3 bucket called `mail-server-send-queue-*`. They are stored in the json format of:

```json
{
  emails: [
    {
      to: 'to@example.com',
      from: 'from@example.com',
      subject: 'Example email',
      body: 'This is an example email'
    }
  ]
}
```

`aws-ses-queue` will read from this bucket and delete the files of any emails it sends. The emails are sent with AWS SES.

This script will terminate the ec2 instance it is running on once it has sent all emails within the bucket.