const mongoose = require("mongoose");
var XMLHttpRequest = require('xhr2');

const ProductSchema = new mongoose.Schema({
  producerId: {
    type: String,
    required: true,
  },
  name : {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  bidStartDate: {
    type: Date,
    required: true
  },
  bidEndDate: {
    type: Date,
    required: true
  },
  noOfUnits: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
});


module.exports = mongoose.model("products", ProductSchema);
