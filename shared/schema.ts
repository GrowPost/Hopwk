import { z } from "zod";

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
