import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { env } from "../config/env";
import { UnauthorizedError, ConflictError, NotFoundError } from "../utils/errors";
import { LoginRequest, RegisterRequest } from "../validators/auth";

export async function register(req: RegisterRequest) {
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: req.email } });
  if (existing) {
    throw new ConflictError(`User with email '${req.email}' already exists`);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(req.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: req.name,
      email: req.email,
      passwordHash,
      role: req.role,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return user;
}

export async function login(req: LoginRequest) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: req.email },
    select: { id: true, name: true, email: true, role: true, passwordHash: true },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Verify password
  const valid = await bcrypt.compare(req.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Issue JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_SECRET as string,
    { expiresIn: env.JWT_EXPIRES_IN } as any
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
