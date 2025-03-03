const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

mongoose.connect(process.env.DATABASE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

const app = express();

// Allow all origins and methods
app.use(cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const lead = require('./routes/leadapi');
const auth = require('./routes/auth');

app.use('/lead', lead);
app.use('/auth', auth);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
