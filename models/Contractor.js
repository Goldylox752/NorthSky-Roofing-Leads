import mongoose from "mongoose";

const ContractorSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,

  city: String,

  active: {
    type: Boolean,
    default: true,
  },

  plan: {
    type: String,
    enum: ["free", "paid", "premium"],
    default: "free",
  },

  leadsReceived: {
    type: Number,
    default: 0,
  },
});

export default mongoose.models.Contractor ||
  mongoose.model("Contractor", ContractorSchema);