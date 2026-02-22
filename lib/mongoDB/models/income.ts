import { Schema, model, models } from "mongoose";

const IncomeSchema = new Schema(
  {
    date: {
      type: Date,
    },
    amount: {
      type: Number,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    compamy: {
      type: String,
      default: false,
    },

    notice: {
      type: String,
    },
  },
  { timestamps: true }
);
const Income = models?.Income || model("Income", IncomeSchema);
export default Income;
