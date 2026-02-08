import { sendVerificationCodeViaManus } from "./manus-email";

export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  // 使用 Manus 内置邮件服务发送验证码
  return sendVerificationCodeViaManus(email, code);
}
