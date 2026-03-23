# Using Azure Flexible server

## Create Flexible Server Instance on Azure

-> Azure Database for MySQL flexible servers -> Create -> Flexible Server

Create Resource group or choose an existing one

Configure Server name, Region, Availability Zone, Administraotr and password

Choose workload type: Dev/Test

## Allowing connection from internet

Choose the database instance created

Settings -> Networking -> Add Firewall rules from IP ranges, for example 0.0.0.0-255.255.255.255

## Download SSL certificate

We need the certificate to connect to an Azure Flexible Server

Settings -> Networking->Download SSL Certificate

## Connect to MySQL from NodeJS

Configure the database connection string in .dev like:

DATABASE_URL=mysql://user:password@endpoint:port/cs732db
DB_SSL_CA_PATH=./cert/DigiCertGlobalRootG2.crt.pem

We don't relly need to protect the certificate as it is a public certificate and everyone can download from Azure

## Install mysql2

```sh
  npm install mysql2
```

## Connect to the database using the following code( ):

```javascript
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    ca: fs.readFileSync(
      path.resolve(__dirname, `../${process.env.DB_SSL_CA_PATH}`),
    ),
    rejectUnauthorized: true,
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export { pool };
```

## Test the DB connection

## Create db-test.js as the following content:

```javascript
//test connection
import { pool } from "./db.js";
import chalk from "chalk";

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(chalk.green("✅ Connected to mysql!"));
    const [rows] = await connection.query(
      'SELECT "Connection Active" as status',
    );
    console.log(`[DB] db status: ${rows[0].status}`);
    connection.release();
  } catch (err) {
    console.error(chalk.red("❌ [DB] connect failed!"));
    console.error(chalk.red("errcode:", err.code));
    console.error(chalk.red("errmsg:", err.message));
  }
})();
```

and run the code to test the db connection

```sh
node ./src/db/db-test.js
```
