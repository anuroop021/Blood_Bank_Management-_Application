const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  userType: {
    type: String,
    required: true,
    enum: ['individual', 'hospital'],
  },
  bloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  },
  bloodUnits: {
    type: Number,
    required: true,
    min: 1,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionStatus: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  transactionDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);

 
