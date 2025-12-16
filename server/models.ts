import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  balance: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: Date;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  image?: string;
  stockData: string[];
  category: string;
  createdAt: Date;
}

export interface IPurchase extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  price: number;
  stockData: string;
  purchaseDate: Date;
}

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  amount: number;
  description: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  isAdmin: { type: Boolean, required: true, default: false },
  isBanned: { type: Boolean, required: true, default: false },
  createdAt: { type: Date, default: Date.now },
});

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  stockData: { type: [String], default: [] },
  category: { type: String, required: true, default: "general" },
  createdAt: { type: Date, default: Date.now },
});

const PurchaseSchema = new Schema<IPurchase>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  stockData: { type: String, required: true },
  purchaseDate: { type: Date, default: Date.now },
});

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
export const PurchaseModel = mongoose.models.Purchase || mongoose.model<IPurchase>("Purchase", PurchaseSchema);
export const TransactionModel = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
