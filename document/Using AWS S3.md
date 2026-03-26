# Using AWS S3

This guide explains how to configure Amazon S3 and integrate it into the project. It assumes you have a basic understanding of the AWS Management Console or CLI.

---

## 1. Create an AWS S3 Bucket

You can create a bucket named `cs732-uoa-230326` via the AWS Console or by using the following AWS CLI command:

```sh
aws s3api create-bucket \
    --bucket cs732-uoa-230326 \
    --region ap-southeast-2 \
    --create-bucket-configuration LocationConstraint=ap-southeast-2
```

## 2. Configure IAM User and Permissions

Create a new IAM user and attach a Custom Inline Policy to grant the necessary S3 permissions. This ensures your application can upload and manage files.

Use the following JSON configuration for the policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor1",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::cs732-uoa-230326",
        "arn:aws:s3:::cs732-uoa-230326/*"
      ]
    }
  ]
}
```

## 3. Enable Public Read Access

To allow the frontend or external users to view uploaded files (e.g., images), update the Bucket Policy.

⚠️ Important: You must first go to the "Permissions" tab of your bucket and turn off "Block all public access" for this policy to work.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cs732-uoa-230326/*"
    }
  ]
}
```

## 4. Credentials and Environment Variables

Generate an Access Key ID and Secret Access Key for your IAM user. Add these to your .env file inside the backend directory:

```js
# AWS S3 Configuration
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
AWS_S3_BUCKET_NAME=cs732-uoa-230326

```

## 5. Install AWS SDK in Node.js

We use the modular AWS SDK v3. Run these commands from the root directory to install them in the backend workspace:

```sh
npm install @aws-sdk/client-s3 --workspace backend
npm install @aws-sdk/s3-request-presigner --workspace backend
```

## 6. Test S3

You can verify your configuration using the following test script. Ensure you have initialized your s3Client in ../db/s3Client.js.

### 📄 `backend/src/db/s3Client.js`

Create a centralized client to interact with AWS:

```js
import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
//aws s3
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export { s3Client };
```

### 📄 `backend/src/tools/s3-test.js`

Create a centralized client to interact with AWS:

```js
import { s3Client } from "../db/s3Client.js";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import chalk from "chalk";

(async () => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      MaxKeys: 5, // get the first 5 files
    });

    const { Contents } = await s3Client.send(command);
    if (!Contents || Contents.length === 0) {
      console.log(chalk.green("no files found in S3 bucket"));
      return;
    }
    console.log(
      chalk.green("The following files(top 5) is found in S3 bucket"),
    );
    Contents.map((file) => {
      console.log(
        chalk.white("\t", file.Key, ":"),
        chalk.green(
          `https://${bucketName}.s3.${region}.amazonaws.com/${file.Key}`,
        ),
      );
    });
    console.log(
      chalk.green(
        "The S3 is configured correctly if you can access those files",
      ),
    );
  } catch (err) {
    console.error(chalk.red("❌ unable to connect to S3"));
    console.error(chalk.red(`error: ${err.name}`));
    console.error(chalk.red(`message: ${err.message}`));
  }
})();
```
