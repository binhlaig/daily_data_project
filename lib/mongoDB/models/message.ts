import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, enum: ["user", "ai"], required: true },
    text: { type: String, required: true },
    meta: { type: Schema.Types.Mixed }, // optional: store parsed JSON, confidence, etc.
  },
  { timestamps: true }
);

const Message = models.Message || model("Message", MessageSchema);
export default Message;