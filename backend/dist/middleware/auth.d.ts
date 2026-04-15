import { Request, Response, NextFunction } from "express";
export interface AppUser {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    createdAt: Date;
}
declare global {
    namespace Express {
        interface User extends AppUser {
        }
    }
}
export declare const isAuthenticated: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCurrentUser: (req: Request) => AppUser | null;
//# sourceMappingURL=auth.d.ts.map