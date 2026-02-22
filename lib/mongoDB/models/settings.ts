import { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true }, // session.user.id (or email fallback)

    currency: { type: String, default: "JPY" },
    timezone: { type: String, default: "Asia/Tokyo" },

    theme: { type: String, default: "violet" },

    notifyEmail: { type: Boolean, default: true },
    notifyDailySummary: { type: Boolean, default: true },

    pinLock: { type: Boolean, default: false },
    twoFA: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Settings = models.Settings || model("Settings", SettingsSchema);
export default Settings;
