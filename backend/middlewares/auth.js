const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/response");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-teamflow-jwt-key";

async function authMiddleware(req, res, next) {
  const auth = req.header("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return sendError(res, 401, "UNAUTHENTICATED", "Missing Bearer token");
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return sendError(res, 401, "UNAUTHENTICATED", "Empty Bearer token");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { uid: decoded.uid };
    return next();
  } catch (err) {
    return sendError(res, 401, "UNAUTHENTICATED", "Invalid token");
  }
}

module.exports = { authMiddleware };
