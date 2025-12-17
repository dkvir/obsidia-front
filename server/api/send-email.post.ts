import { Resend } from "resend";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const resend = new Resend(config.resendApiKey);

  const body = await readBody(event);

  try {
    const { data, error } = await resend.emails.send({
      from: "Obsidia <onboarding@resend.dev>",
      to: config.mailAddress,
      subject: "New Lead from Website Form",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Lead from Website Form</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
            <p><strong>Name:</strong> ${body.name}</p>
            <p><strong>Last Name:</strong> ${body.lastName}</p>
            <p><strong>Phone:</strong> ${body.phone}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Submitted at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    if (error) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
      });
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Email sending error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to send email",
      data: error,
    });
  }
});
