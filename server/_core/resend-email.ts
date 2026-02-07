import { Resend } from "resend";
import { ENV } from "./env";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 使用 Resend 邮件服务发送验证码邮件
 */
export async function sendVerificationCodeViaResend(
  email: string,
  code: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Resend Email] API key not configured");
    return false;
  }

  const htmlContent = `
    <div style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: linear-gradient(135deg, #ff6b9d 0%, #ff8a65 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">💕 Couple Space</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">情侣专属空间</p>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #eee; border-top: none; border-radius: 0 0 16px 16px;">
        <p style="color: #333; font-size: 16px; margin: 0 0 16px;">你好！</p>
        <p style="color: #666; font-size: 14px; margin: 0 0 24px;">你的验证码是：</p>
        <div style="background: #f8f4f0; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e91e63;">${code}</span>
        </div>
        <p style="color: #999; font-size: 12px; margin: 0;">验证码 10 分钟内有效，请勿泄露给他人。</p>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: "Couple Space <noreply@couple.space.biz>",
      to: email,
      subject: `【Couple Space】你的验证码是 ${code}`,
      html: htmlContent,
    });

    if (result.error) {
      console.error("[Resend Email] Failed to send email:", result.error);
      return false;
    }

    console.log(`[Resend Email] Verification code sent to ${email}`);
    return true;
  } catch (error) {
    console.error("[Resend Email] Error sending email:", error);
    return false;
  }
}
