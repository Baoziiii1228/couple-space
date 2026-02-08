import { ENV } from "./env";

/**
 * 使用 Manus 内置邮件 API 发送验证码邮件
 */
export async function sendVerificationCodeViaManus(
  email: string,
  code: string
): Promise<boolean> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.warn("[Manus Email] Forge API not configured, falling back to console log");
    // 开发模式：打印到控制台
    console.log(`\n========================================`);
    console.log(`📧 验证码邮件 (Manus API 未配置)`);
    console.log(`收件人: ${email}`);
    console.log(`验证码: ${code}`);
    console.log(`========================================\n`);
    return true;
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
    const endpoint = new URL(
      "webdevtoken.v1.WebDevService/SendEmail",
      ENV.forgeApiUrl
    ).toString();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({
        to: email,
        subject: `【Couple Space】你的验证码是 ${code}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[Manus Email] Failed to send email (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    console.log(`[Manus Email] Verification code sent to ${email}`);
    return true;
  } catch (error) {
    console.error("[Manus Email] Error sending email:", error);
    return false;
  }
}
