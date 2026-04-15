export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return next();
    }
    res.status(401).json({ error: "Unauthorized. Please login first." });
};
export const getCurrentUser = (req) => {
    return req.user || null;
};
//# sourceMappingURL=auth.js.map