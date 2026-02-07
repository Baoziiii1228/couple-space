import { describe, expect, it } from "vitest";
import { sendVerificationCode } from "./_core/email";

describe("email.sendVerificationCode", () => {
  it("should send verification code email successfully", async () => {
    // 测试发送验证码邮件
    const result = await sendVerificationCode("test@example.com", "123456");
    
    // 如果配置了 SMTP，应该返回 true
    // 如果没有配置 SMTP，也会返回 true（开发模式下打印到控制台）
    expect(result).toBe(true);
  });

  it("should handle email sending with valid code format", async () => {
    const result = await sendVerificationCode("2603673310@qq.com", "654321");
    expect(result).toBe(true);
  });

  it("should handle multiple verification codes", async () => {
    const emails = ["user1@example.com", "user2@example.com"];
    
    for (const email of emails) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const result = await sendVerificationCode(email, code);
      expect(result).toBe(true);
    }
  }, { timeout: 15000 });
});
