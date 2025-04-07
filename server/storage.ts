import { 
  users, 
  gameHistory, 
  type User, 
  type InsertUser, 
  type GameHistory, 
  type InsertGameHistory 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  getGameHistory(userId: number): Promise<GameHistory[]>;
  addGameHistory(history: InsertGameHistory): Promise<GameHistory>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set({ balance: user.balance + amount })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async getGameHistory(userId: number): Promise<GameHistory[]> {
    return await db
      .select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, userId));
  }

  async addGameHistory(insertHistory: InsertGameHistory): Promise<GameHistory> {
    const [history] = await db
      .insert(gameHistory)
      .values(insertHistory)
      .returning();
    return history;
  }
}

// Create a default user for demo purposes if it doesn't exist
const initializeDefaultUser = async (storage: DatabaseStorage) => {
  const defaultUser = await storage.getUserByUsername("player123");
  if (!defaultUser) {
    await storage.createUser({
      username: "player123",
      password: "$admin", // Updated to user's suggested password
      balance: 5000
    });
  }
};

// Use database storage
export const storage = new DatabaseStorage();

// Initialize default user
initializeDefaultUser(storage).catch(console.error);
