import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import bcrypt from "bcryptjs";

// Mock database functions
vi.mock("./db");

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendCode", () => {
    it("should send code for login when email exists", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Mock existing user
      vi.mocked(db.getUserByEmail).mockResolvedValue({
        id: 1,
        openId: "email_test@example.com",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "email",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        password: null,
      });

      vi.mocked(db.createVerificationCode).mockResolvedValue(undefined);

      const result = await caller.auth.sendCode({
        email: "test@example.com",
        type: "login",
      });

      expect(result).toEqual({ success: true, message: "验证码已发送" });
      expect(db.createVerificationCode).toHaveBeenCalled();
    });

    it("should reject login for non-existent email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getUserByEmail).mockResolvedValue(null);

      try {
        await caller.auth.sendCode({
          email: "nonexistent@example.com",
          type: "login",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("未注册");
      }
    });

    it("should reject register for existing email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getUserByEmail).mockResolvedValue({
        id: 1,
        openId: "email_existing@example.com",
        email: "existing@example.com",
        name: "Existing User",
        loginMethod: "email",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        password: null,
      });

      try {
        await caller.auth.sendCode({
          email: "existing@example.com",
          type: "register",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("已注册");
      }
    });
  });

  describe("register", () => {
    it("should register a new user with email and password", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.verifyCode).mockResolvedValue(true);
      vi.mocked(db.getUserByEmail).mockResolvedValue(null);
      vi.mocked(db.upsertUser).mockResolvedValue(undefined);

      const newUser = {
        id: 1,
        openId: "email_newuser@example.com",
        email: "newuser@example.com",
        name: "New User",
        loginMethod: "email",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        password: "hashed_password",
      };

      vi.mocked(db.getUserByOpenId).mockResolvedValue(newUser);
      vi.mocked(db.updateUserPassword).mockResolvedValue(undefined);

      const result = await caller.auth.register({
        email: "newuser@example.com",
        password: "password123",
        name: "New User",
        code: "123456",
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe("newuser@example.com");
      expect(db.upsertUser).toHaveBeenCalled();
      expect(db.updateUserPassword).toHaveBeenCalled();
    });

    it("should reject registration with invalid code", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.verifyCode).mockResolvedValue(false);

      try {
        await caller.auth.register({
          email: "newuser@example.com",
          password: "password123",
          name: "New User",
          code: "123456",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("验证码无效");
      }
    });
  });

  describe("loginWithCode", () => {
    it("should login user with valid code", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const existingUser = {
        id: 1,
        openId: "email_test@example.com",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "email",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        password: null,
      };

      vi.mocked(db.verifyCode).mockResolvedValue(true);
      vi.mocked(db.getUserByEmail).mockResolvedValue(existingUser);

      const result = await caller.auth.loginWithCode({
        email: "test@example.com",
        code: "123456",
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe("test@example.com");
      expect(ctx.res.cookie).toHaveBeenCalled();
    });

    it("should reject login with invalid code", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.verifyCode).mockResolvedValue(false);

      try {
        await caller.auth.loginWithCode({
          email: "test@example.com",
          code: "000000",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("验证码无效");
      }
    });
  });

  describe("loginWithPassword", () => {
    it("should login user with correct password", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const hashedPassword = await bcrypt.hash("password123", 10);

      const existingUser = {
        id: 1,
        openId: "email_test@example.com",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "email",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        password: hashedPassword,
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(existingUser);

      const result = await caller.auth.loginWithPassword({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe("test@example.com");
      expect(ctx.res.cookie).toHaveBeenCalled();
    });

    it("should reject login with wrong password", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const hashedPassword = await bcrypt.hash("password123", 10);

      const existingUser = {
        id: 1,
        openId: "email_test@example.com",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "email",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        password: hashedPassword,
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(existingUser);

      try {
        await caller.auth.loginWithPassword({
          email: "test@example.com",
          password: "wrongpassword",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("邮箱或密码错误");
      }
    });

    it("should reject login when user has no password set", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const existingUser = {
        id: 1,
        openId: "email_test@example.com",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "email",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        password: null,
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(existingUser);

      try {
        await caller.auth.loginWithPassword({
          email: "test@example.com",
          password: "password123",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("未设置密码");
      }
    });
  });
});
