import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
{
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },

  password: {
    type: String,
    select: false, // 🔥 important (hide password by default)
  },

  profileImagePath: {
    type: String,
    default: "",
  },

  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER",
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: "Product",
  }],

  cart: [{
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    qty: { type: Number, default: 1 },
  }],

  orders: [{
    type: Schema.Types.ObjectId,
    ref: "Order",
  }],

  works: [{
    type: String
  }],

},
{ timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;
