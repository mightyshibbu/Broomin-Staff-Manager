const mysql = require('mysql2/promise');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT = 3306 } = process.env;

async function waitForDB() {
  const connectionConfig = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  console.log('Attempting to connect to MySQL...');
  
  let connection;
  let retries = 30;
  
  while (retries > 0) {
    try {
      connection = await mysql.createConnection(connectionConfig);
      await connection.connect();
      console.log('Successfully connected to MySQL!');
      await connection.end();
      return true;
    } catch (error) {
      console.log(`Waiting for MySQL to be ready... (${retries} retries left)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.error('Failed to connect to MySQL after multiple attempts');
  process.exit(1);
}

waitForDB().then(() => {
  console.log('Database is ready! Starting server...');
  require('./server.js');
}).catch(err => {
  console.error('Error waiting for database:', err);
  process.exit(1);
});
