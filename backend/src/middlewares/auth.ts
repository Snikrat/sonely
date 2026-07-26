import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function ensureAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não enviado" });
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    req.userId = decoded.userId;

    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}
