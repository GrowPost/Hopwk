import { 
  User as UserModel, 
  Product as ProductModel, 
  Purchase as PurchaseModel, 
  Transaction as TransactionModel,
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type Purchase, 
  type InsertPurchase,
  type Transaction, 
  type InsertTransaction
} from "@shared/schema";
import { connectDB } from "./db";
import mongoose from "mongoose";

function toUser(doc: any): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    password: doc.password,
    balance: doc.balance,
    isAdmin: doc.isAdmin,
    isBanned: doc.isBanned,
    createdAt: doc.createdAt,
  };
}

function toProduct(doc: any): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description || null,
    price: doc.price,
    image: doc.image || null,
    stockData: doc.stockData || [],
    category: doc.category,
    createdAt: doc.createdAt,
  };
}

function toPurchase(doc: any): Purchase {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    productId: doc.productId.toString(),
    productName: doc.productName,
    price: doc.price,
    stockData: doc.stockData,
    purchaseDate: doc.purchaseDate,
  };
}

function toTransaction(doc: any): Transaction {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    amount: doc.amount,
    description: doc.description,
    createdAt: doc.createdAt,
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { isAdmin?: boolean }): Promise<User>;
  updateUserBalance(id: string, balance: number): Promise<User | undefined>;
  updateUserBanned(id: string, banned: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  getProduct(id: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(id: string, stockData: string[]): Promise<Product | undefined>;

  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getUserPurchases(userId: string): Promise<Purchase[]>;

  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findById(id);
    return user ? toUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await connectDB();
    const user = await UserModel.findOne({ email });
    return user ? toUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    await connectDB();
    const user = await UserModel.create({
      email: insertUser.email,
      password: insertUser.password,
      isAdmin: insertUser.isAdmin || false,
      balance: 0,
      isBanned: false,
    });
    return toUser(user);
  }

  async updateUserBalance(id: string, balance: number): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findByIdAndUpdate(id, { balance }, { new: true });
    return user ? toUser(user) : undefined;
  }

  async updateUserBanned(id: string, banned: boolean): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findByIdAndUpdate(id, { isBanned: banned }, { new: true });
    return user ? toUser(user) : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    await connectDB();
    const users = await UserModel.find().sort({ createdAt: -1 });
    return users.map(toUser);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const product = await ProductModel.findById(id);
    return product ? toProduct(product) : undefined;
  }

  async getAllProducts(): Promise<Product[]> {
    await connectDB();
    const products = await ProductModel.find().sort({ createdAt: -1 });
    return products.map(toProduct);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    await connectDB();
    const newProduct = await ProductModel.create({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      stockData: product.stockData || [],
      category: product.category || "general",
    });
    return toProduct(newProduct);
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const updated = await ProductModel.findByIdAndUpdate(id, product, { new: true });
    return updated ? toProduct(updated) : undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await ProductModel.findByIdAndDelete(id);
    return true;
  }

  async updateProductStock(id: string, stockData: string[]): Promise<Product | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const updated = await ProductModel.findByIdAndUpdate(id, { stockData }, { new: true });
    return updated ? toProduct(updated) : undefined;
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    await connectDB();
    const newPurchase = await PurchaseModel.create({
      userId: new mongoose.Types.ObjectId(purchase.userId),
      productId: new mongoose.Types.ObjectId(purchase.productId),
      productName: purchase.productName,
      price: purchase.price,
      stockData: purchase.stockData,
    });
    return toPurchase(newPurchase);
  }

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    const purchases = await PurchaseModel.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ purchaseDate: -1 });
    return purchases.map(toPurchase);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    await connectDB();
    const newTransaction = await TransactionModel.create({
      userId: new mongoose.Types.ObjectId(transaction.userId),
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
    });
    return toTransaction(newTransaction);
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    const transactions = await TransactionModel.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
    return transactions.map(toTransaction);
  }
}

export const storage = new DatabaseStorage();
