import { Schema, model, models } from "mongoose";

const NoteSchema = new Schema(
  {
    title: { type: String, default: "Untitled" },
    content: { type: String, default: "" },
  },
  { timestamps: true } // createdAt, updatedAt
);

export const Note = models.Note || model("Note", NoteSchema);