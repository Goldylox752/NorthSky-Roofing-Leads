import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    // contact info
    name: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },

    // AI + funnel data
    status: {
      type: String,
      enum: ["new", "qualified", "booked", "rejected"],
      default: "new",
      index: true,
    },

    score: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
      index: true,
    },

    // monetization layer
    price: {
      type: Number,
      default: 0,
    },

    paid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// helpful index for scaling later
LeadSchema.index({ city: 1, status: 1, score: -1 });

export default mongoose.models.Lead ||
  mongoose.model("Lead", LeadSchema);