import { sendVerificationCodeViaResend } from "./resend-email";

export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  // 使用 Resend 邮件服务发送验证码
  return sendVerificationCodeViaResend(email, code);
}
