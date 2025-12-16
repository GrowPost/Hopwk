import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import MongoStore from "connect-mongo";
import { connectDB, mongoose } from "./db";
import { loginSchema, registerSchema, insertProductSchema } from "@shared/schema";
import config, { validateConfig } from "./config";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  validateConfig();
  await connectDB();
  
  app.use(
    session({
      store: MongoStore.create({
        mongoUrl: config.mongodb.uri,
        collectionName: "sessions",
      }),
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        maxAge: config.cookie.maxAge,
        httpOnly: config.cookie.httpOnly,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
      },
    })
  );

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { email, password } = parseResult.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = email === "admin@grow4bot.com";
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        isAdmin,
      });

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { email, password } = parseResult.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Your account has been banned" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products/:id/purchase", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId!;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Your account has been banned" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!product.stockData || product.stockData.length === 0) {
        return res.status(400).json({ message: "Product is out of stock" });
      }

      if (user.balance < product.price) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const stockItem = product.stockData[0];
      const newStockData = product.stockData.slice(1);

      await storage.updateProductStock(id, newStockData);

      const newBalance = user.balance - product.price;
      await storage.updateUserBalance(userId, newBalance);

      const purchase = await storage.createPurchase({
        userId,
        productId: id,
        productName: product.name,
        price: product.price,
        stockData: stockItem,
      });

      await storage.createTransaction({
        userId,
        type: "purchase",
        amount: product.price,
        description: `Purchased ${product.name}`,
      });

      res.json({ purchase, stockData: stockItem });
    } catch (error: any) {
      console.error("Purchase error:", error);
      res.status(500).json({ message: "Purchase failed" });
    }
  });

  app.get("/api/purchases", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const purchases = await storage.getUserPurchases(userId);
      res.json(purchases);
    } catch (error: any) {
      console.error("Get purchases error:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/wallet/topup", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { amount } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBalance = user.balance + amount;
      await storage.updateUserBalance(userId, newBalance);

      await storage.createTransaction({
        userId,
        type: "topup",
        amount,
        description: `Topped up wallet with $${amount.toFixed(2)}`,
      });

      res.json({ balance: newBalance });
    } catch (error: any) {
      console.error("Top up error:", error);
      res.status(500).json({ message: "Top up failed" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...u }) => u);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/ban", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { banned } = req.body;

      if (typeof banned !== "boolean") {
        return res.status(400).json({ message: "Invalid banned value" });
      }

      const user = await storage.updateUserBanned(id, banned);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Ban user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/:id/balance", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBalance = user.balance + amount;
      await storage.updateUserBalance(id, newBalance);

      await storage.createTransaction({
        userId: id,
        type: "admin_add",
        amount,
        description: `Admin added $${amount.toFixed(2)} to wallet`,
      });

      res.json({ balance: newBalance });
    } catch (error: any) {
      console.error("Add balance error:", error);
      res.status(500).json({ message: "Failed to add balance" });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const parseResult = insertProductSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const product = await storage.createProduct(parseResult.data);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, image, stockData, category } = req.body;

      const product = await storage.updateProduct(id, {
        name,
        description,
        price,
        image,
        stockData,
        category,
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error: any) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted" });
    } catch (error: any) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  return httpServer;
}
