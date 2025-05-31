// const mongoose = require('mongoose')

// function connectToDb(){
//     mongoose.connect(process.env.MONGO_URI).then(()=>{
//         console.log('connected to database')
//     })
// }

// module.exports = connectToDb;


require('dotenv').config();
const mongoose = require('mongoose');

const dbOptions = {
  maxPoolSize: 10,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000
};

async function connectToDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI, dbOptions);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

// Event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose default connection open');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose default connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination');
  process.exit(0);
});

module.exports = connectToDb;