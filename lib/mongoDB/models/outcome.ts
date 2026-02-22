import { Schema, model, models } from "mongoose"

const OutcomeSchema = new Schema(
    {
        date: {
            type: Date,
                   
        },
        amount: {
            type: String,
            required: true,
        },
        shop: {
            type: String,
            default: false,
        },
        bank: {
            type: String,
            default: true,
        },
        notice: {
            type: String,
          },
    },
    { timestamps: true },
    
);
const Outcome = models?.Outcome || model("Outcome", OutcomeSchema)
export default Outcome
