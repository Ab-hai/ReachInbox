import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { eq } from "drizzle-orm";
import { db, users } from "../db/index.js";
import { isAuthenticated, AppUser } from "../middleware/auth.js";

const router = Router();

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        // Check if user exists
        let user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          // Create new user
          const [newUser] = await db
            .insert(users)
            .values({
              email,
              name: profile.displayName || email.split("@")[0],
              avatarUrl: profile.photos?.[0]?.value || null,
            })
            .returning();
          user = newUser;
          console.log(`✅ New user created: ${email}`);
        } else {
          // Update avatar if changed
          if (profile.photos?.[0]?.value && profile.photos[0].value !== user.avatarUrl) {
            await db
              .update(users)
              .set({ avatarUrl: profile.photos[0].value })
              .where(eq(users.id, user.id));
          }
          console.log(`✅ User logged in: ${email}`);
        }

        return done(null, user as AppUser);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error as Error);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as AppUser).id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    done(null, user as AppUser | null);
  } catch (error) {
    done(error);
  }
});

// Google OAuth redirect
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    // Successful authentication
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// Get current user
router.get("/me", isAuthenticated, (req, res) => {
  const user = req.user as AppUser;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
  });
});

// Logout
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Session destruction failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

// Check auth status
router.get("/status", (req, res) => {
  const user = req.user as AppUser | undefined;
  res.json({
    authenticated: req.isAuthenticated(),
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        }
      : null,
  });
});

export default router;
