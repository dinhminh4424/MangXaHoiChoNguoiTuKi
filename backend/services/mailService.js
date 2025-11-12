const nodemailer = require("nodemailer");
const emailTemplates = require("./emailTemplates");
const User = require("../models/User");

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  /**
   * Xác minh kết nối email
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ Kết nối email server thành công");
    } catch (error) {
      console.error("❌ Lỗi kết nối email server:", error);
    }
  }

  /**
   * Hàm gửi mail chính - có thể dùng ở mọi controller
   */

  // async sendEmail(mailOptions) {
  //   try {
  //     const { to, subject, templateName, templateData, cc, bcc, attachments } =
  //       mailOptions;

  //     if (!to || !subject || !templateName) {
  //       throw new Error(
  //         "Thiếu thông tin bắt buộc: to, subject, hoặc templateName"
  //       );
  //     }

  //     // Lấy template, bọc try để biết rõ lỗi nếu template không tồn tại
  //     let htmlContent;
  //     try {
  //       htmlContent = emailTemplates.getTemplate(templateName, templateData);
  //     } catch (err) {
  //       console.error(`❌ Template error (${templateName}):`, err);
  //       throw new Error(`Lỗi template: ${templateName}`);
  //     }

  //     const normalizeAddr = (addr) =>
  //       Array.isArray(addr) ? addr.join(", ") : addr || undefined;

  //     const options = {
  //       from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  //       to: normalizeAddr(to),
  //       subject,
  //       html: htmlContent,
  //       cc: normalizeAddr(cc),
  //       bcc: normalizeAddr(bcc),
  //       attachments: Array.isArray(attachments) ? attachments : undefined,
  //     };

  //     const result = await this.transporter.sendMail(options);

  //     console.log(
  //       `✅ Email sent to ${options.to} | Template: ${templateName} | MessageID: ${result.messageId}`
  //     );

  //     return {
  //       success: true,
  //       messageId: result.messageId,
  //       to: options.to,
  //       template: templateName,
  //     };
  //   } catch (error) {
  //     console.error("❌ Lỗi gửi email:", error && (error.stack || error));
  //     return {
  //       success: false,
  //       error: error && (error.message || String(error)),
  //       to: mailOptions.to,
  //       template: mailOptions.templateName,
  //     };
  //   }
  // }

  async sendEmail(mailOptions) {
    try {
      const { to, subject, templateName, templateData, cc, bcc, attachments } =
        mailOptions;

      if (!to || !subject || !templateName) {
        throw new Error(
          "Thiếu thông tin bắt buộc: to, subject, hoặc templateName"
        );
      }

      // Lấy template
      let htmlContent;
      try {
        htmlContent = emailTemplates.getTemplate(templateName, templateData);
      } catch (err) {
        console.error(`❌ Template error (${templateName}):`, err);
        throw new Error(`Lỗi template: ${templateName}`);
      }

      // === FIX: XỬ LÝ FILTER EMAIL ĐÚNG CÁCH ===
      const normalizeToArray = (addr) => {
        if (Array.isArray(addr)) return addr;
        if (typeof addr === "string") return [addr];
        return [];
      };

      const toArray = normalizeToArray(to);
      const mailFilter = [];

      // Kiểm tra từng email
      for (let email of toArray) {
        try {
          const user = await User.findOne({
            email: email.trim().toLowerCase(),
          });

          // Nếu không tìm thấy user hoặc user cho phép notifications -> GỬI
          if (
            !user ||
            (user.settings && user.settings.emailNotifications !== false)
          ) {
            mailFilter.push(email);
            console.log(`✅ Cho phép gửi email cho: ${email}`);
          } else {
            console.log(`⏸️ Bỏ qua ${email} - đã tắt email notifications`);
          }
        } catch (error) {
          console.error(`❌ Lỗi kiểm tra user ${email}:`, error);
          mailFilter.push(email); // Mặc định gửi nếu có lỗi
        }
      }

      // Nếu không còn email nào hợp lệ
      if (mailFilter.length === 0) {
        console.log("📧 Không có người nhận hợp lệ");
        return {
          success: true,
          skipped: true,
          message: "Không gửi email vì không có người nhận hợp lệ",
          originalTo: toArray,
          filteredTo: [],
        };
      }

      const normalizeAddr = (addr) =>
        Array.isArray(addr) ? addr.join(", ") : addr || undefined;

      const options = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: normalizeAddr(mailFilter), // Dùng mảng đã filter
        subject,
        html: htmlContent,
        cc: normalizeAddr(cc),
        bcc: normalizeAddr(bcc),
        attachments: Array.isArray(attachments) ? attachments : undefined,
      };

      const result = await this.transporter.sendMail(options);

      console.log(
        `✅ Email sent to ${options.to} | Template: ${templateName} | MessageID: ${result.messageId}`
      );

      return {
        success: true,
        messageId: result.messageId,
        to: options.to,
        template: templateName,
        // Thêm thông tin filter
        originalRecipients: toArray,
        filteredRecipients: mailFilter,
      };
    } catch (error) {
      console.error("❌ Lỗi gửi email:", error && (error.stack || error));
      return {
        success: false,
        error: error && (error.message || String(error)),
        to: mailOptions.to,
        template: mailOptions.templateName,
      };
    }
  }

  /**
   * Gửi mail cho nhiều người (Bulk)
   */
  async sendBulkEmail(emailsList) {
    try {
      console.log(
        `📧 Starting bulk email send for ${emailsList.length} recipients`
      );

      const results = [];
      const BATCH_SIZE = 10; // Send 10 emails at a time to avoid rate limiting

      for (let i = 0; i < emailsList.length; i += BATCH_SIZE) {
        const batch = emailsList.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (emailData, index) => {
          // Add small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, index * 100));

          const result = await this.sendEmail(emailData);
          return result;
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        console.log(
          `✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} completed: ${
            batchResults.filter((r) => r.success).length
          }/${batch.length} successful`
        );
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      console.log(
        `📊 Bulk email completed: ${successful} successful, ${failed} failed`
      );

      return {
        success: true,
        total: results.length,
        successful: successful,
        failed: failed,
        results: results,
      };
    } catch (error) {
      console.error("❌ Error in bulk email send:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gửi test email
   */
  async sendTestEmail(to = process.env.EMAIL_USER) {
    return await this.sendEmail({
      to: to,
      subject: "Test Email - Hệ thống gửi mail",
      templateName: "GENERAL_NOTIFICATION",
      templateData: {
        name: "Developer",
        title: "Test Email Thành Công! 🎉",
        content: "Hệ thống gửi mail của bạn đã được cấu hình thành công.",
        buttonText: "Truy cập Dashboard",
        buttonUrl: "https://yourapp.com/dashboard",
        appName: "Your App",
      },
    });
  }
}

module.exports = new MailService();
