import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { userStore } from "../../../../lib/user-store";
import { generateToken } from "../../../../lib/jwt";
import { TRPCError } from "@trpc/server";

export const signupProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().min(1, "Name is required"),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[Auth] Signup attempt:', input.email);

    try {
      const user = await userStore.createUser(input.email, input.password, input.name);
      
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      console.log('[Auth] Signup successful:', user.email);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error: any) {
      console.error('[Auth] Signup error:', error.message);
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error.message || 'Failed to create account',
      });
    }
  });
