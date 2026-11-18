import { Schema, model, models } from "mongoose";

const RemittanceSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    receiverName: {
      type: String,
      required: true,
      trim: true,
    },
    receiverPhone: {
      type: String,
      default: "",
      trim: true,
    },
    payoutMethod: {
      type: String,
      required: true,
      trim: true,
    },
    yenAmount: {
      type: Number,
      required: true,
    },
    exchangeRate: {
      type: Number,
      required: true,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

RemittanceSchema.index({ createdAt: -1 });
RemittanceSchema.index({ status: 1 });

const Remittance =
  models?.Remittance || model("Remittance", RemittanceSchema);

export default Remittance;
