// models/Territory.js
const mongoose = require("mongoose");

const TerritorySchema = new mongoose.Schema({
  name: String, // "Edmonton"
  maxBuyers: {
    type: Number,
    default: 1, // exclusivity
  },
  activeBuyers: {
    type: Number,
    default: 0,
  },
  leadsAvailable: {
    type: Number,
    default: 0,
  },
});

module.exports =
  mongoose.models.Territory ||
  mongoose.model("Territory", TerritorySchema);