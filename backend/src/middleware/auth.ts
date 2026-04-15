import { Request, Response, NextFunction } from "express";

// Type for our User from database
export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User extends AppUser {}
  }
}

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  
  res.status(401).json({ error: "Unauthorized. Please login first." });
};

export const getCurrentUser = (req: Request): AppUser | null => {
  return (req.user as AppUser) || null;
};
