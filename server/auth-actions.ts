"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validations/item";

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/" });
}

export async function loginAction(input: unknown) {
  const data = loginSchema.parse(input);

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function registerAction(input: unknown) {
  const data = registerSchema.parse(input);

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "Email already registered" };
  }

  const password = await bcrypt.hash(data.password, 10);
  await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password,
      emailVerified: new Date(),
    },
  });

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but login failed" };
    }
    throw error;
  }
}
