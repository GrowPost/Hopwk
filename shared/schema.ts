import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

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

export type User = {
  id: string;
  email: string;
  password: string;
  balance: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: Date;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stockData: string[];
  category: string;
  createdAt: Date;
};

export type Purchase = {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  price: number;
  stockData: string;
  purchaseDate: Date;
};

export type Transaction = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  description: string;
  createdAt: Date;
};

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().positive(),
  image: z.string().optional().nullable(),
  stockData: z.array(z.string()).optional(),
  category: z.string().optional(),
});

export const insertPurchaseSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  productName: z.string(),
  price: z.number(),
  stockData: z.string(),
});

export const insertTransactionSchema = z.object({
  userId: z.string(),
  type: z.string(),
  amount: z.number(),
  description: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
