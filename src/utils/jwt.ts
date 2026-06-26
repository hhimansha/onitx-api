import jwt from "jsonwebtoken";
import { UserRole } from "../types";

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

const secret = (): string => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
  return process.env.JWT_SECRET;
};

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, secret(), { expiresIn: "7d" });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, secret()) as JwtPayload;
