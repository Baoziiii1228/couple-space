import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getCoupleByUserId: vi.fn(),
  getPendingCoupleByUserId: vi.fn(),
  getCoupleByInviteCode: vi.fn(),
  createCouple: vi.fn(),
  updateCouple: vi.fn(),
  getUserById: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("couple.getStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns single status when user has no couple relationship", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue(undefined);
    vi.mocked(db.getPendingCoupleByUserId).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.couple.getStatus();

    expect(result.status).toBe("single");
  });

  it("returns pending status when user has created an invite", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue(undefined);
    vi.mocked(db.getPendingCoupleByUserId).mockResolvedValue({
      id: 1,
      user1Id: 1,
      user2Id: null,
      inviteCode: "ABC12345",
      togetherDate: null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.couple.getStatus();

    expect(result.status).toBe("pending");
    expect(result).toHaveProperty("inviteCode", "ABC12345");
  });

  it("returns paired status when user is in a couple", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue({
      id: 1,
      user1Id: 1,
      user2Id: 2,
      inviteCode: "ABC12345",
      togetherDate: new Date("2024-01-01"),
      status: "paired",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getUserById).mockResolvedValue({
      id: 2,
      openId: "user-2",
      name: "Partner",
      email: "partner@example.com",
      avatar: null,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.couple.getStatus();

    expect(result.status).toBe("paired");
    expect(result).toHaveProperty("partner");
    if (result.status === "paired") {
      expect(result.partner?.name).toBe("Partner");
    }
  });
});

describe("couple.createInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new invite code when user has no existing relationship", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue(undefined);
    vi.mocked(db.getPendingCoupleByUserId).mockResolvedValue(undefined);
    vi.mocked(db.createCouple).mockResolvedValue(1);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.couple.createInvite({});

    expect(result).toHaveProperty("inviteCode");
    expect(result.inviteCode).toHaveLength(8);
    expect(db.createCouple).toHaveBeenCalledWith(
      expect.objectContaining({
        user1Id: 1,
        status: "pending",
      })
    );
  });

  it("returns existing invite code when user already has pending invite", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue(undefined);
    vi.mocked(db.getPendingCoupleByUserId).mockResolvedValue({
      id: 1,
      user1Id: 1,
      user2Id: null,
      inviteCode: "EXISTING",
      togetherDate: null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.couple.createInvite({});

    expect(result.inviteCode).toBe("EXISTING");
    expect(db.createCouple).not.toHaveBeenCalled();
  });

  it("throws error when user already has a couple relationship", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue({
      id: 1,
      user1Id: 1,
      user2Id: 2,
      inviteCode: "ABC12345",
      togetherDate: null,
      status: "paired",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.couple.createInvite({})).rejects.toThrow("你已经有情侣关系了");
  });
});

describe("couple.joinByCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully pairs two users with valid invite code", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue(undefined);
    vi.mocked(db.getCoupleByInviteCode).mockResolvedValue({
      id: 1,
      user1Id: 1,
      user2Id: null,
      inviteCode: "ABC12345",
      togetherDate: null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.updateCouple).mockResolvedValue(undefined);

    const ctx = createAuthContext(2); // Different user
    const caller = appRouter.createCaller(ctx);

    const result = await caller.couple.joinByCode({ inviteCode: "ABC12345" });

    expect(result.success).toBe(true);
    expect(db.updateCouple).toHaveBeenCalledWith(1, {
      user2Id: 2,
      status: "paired",
    });
  });

  it("throws error for invalid invite code", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue(undefined);
    vi.mocked(db.getCoupleByInviteCode).mockResolvedValue(undefined);

    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.couple.joinByCode({ inviteCode: "INVALID" })).rejects.toThrow("邀请码无效");
  });

  it("throws error when trying to pair with self", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue(undefined);
    vi.mocked(db.getCoupleByInviteCode).mockResolvedValue({
      id: 1,
      user1Id: 1,
      user2Id: null,
      inviteCode: "ABC12345",
      togetherDate: null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ctx = createAuthContext(1); // Same user who created the invite
    const caller = appRouter.createCaller(ctx);

    await expect(caller.couple.joinByCode({ inviteCode: "ABC12345" })).rejects.toThrow("不能和自己配对哦");
  });

  it("throws error when invite code is already used", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue(undefined);
    vi.mocked(db.getCoupleByInviteCode).mockResolvedValue({
      id: 1,
      user1Id: 1,
      user2Id: 2,
      inviteCode: "ABC12345",
      togetherDate: null,
      status: "paired",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ctx = createAuthContext(3);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.couple.joinByCode({ inviteCode: "ABC12345" })).rejects.toThrow("该邀请码已被使用");
  });
});
