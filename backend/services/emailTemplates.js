class EmailTemplates {
  constructor() {
    this.templates = {
      // Template welcome email
      WELCOME: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Chào mừng đến với ${data.appName}! 🎉</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.name},</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại ${
                data.appName
              }. Chúng tôi rất vui mừng được chào đón bạn!</p>
              <p>Để bắt đầu sử dụng tài khoản, vui lòng xác minh email của bạn bằng cách nhấp vào nút bên dưới:</p>
              <p style="text-align: center;">
                <a href="${
                  data.verificationLink
                }" class="button">Xác minh Email</a>
              </p>
              <p>Liên kết này sẽ hết hạn trong 24 giờ.</p>
              <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${
        data.appName || `Trân trọng,<br>Đội ngũ Autism Support`
      }. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,

      // đăng kí thành công
      REGISTRATION_SUCCESS: (data) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
      .content { padding: 30px; background: #f9f9f9; }
      .footer { padding: 20px; text-align: center; background: #333; color: white; }
      .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
      .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Chào Mừng Đến Với Autism Support! 🎉</h1>
      </div>
      <div class="content">
        <h2>Xin chào ${data.name},</h2>
        <p>Chúc mừng bạn đã đăng ký tài khoản Autism Support thành công!</p>
        
        <div class="feature">
          <strong>✅ Đăng ký thành công</strong>
          <p>Tài khoản của bạn đã sẵn sàng để sử dụng.</p>
        </div>

        <h3>Bạn có thể bắt đầu ngay:</h3>
        <div class="feature">
          <strong>💬 Tham gia thảo luận</strong> - Kết nối với cộng đồng
        </div>
        <div class="feature">
          <strong>👥 Tìm kiếm hỗ trợ</strong> - Kết nối với supporters và doctors
        </div>
        <div class="feature">
          <strong>📚 Chia sẻ kiến thức</strong> - Đóng góp cho cộng đồng
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.loginLink}" class="button">Bắt Đầu Ngay</a>
        </div>

        <p><strong>Thông tin tài khoản:</strong></p>
        <ul>
          <li>Tên đăng nhập: ${data.username}</li>
          <li>Email: ${data.email}</li>
          <li>Thời gian đăng ký: ${data.registrationTime}</li>
        </ul>

        <p><em>"Cùng nhau chúng ta xây dựng một cộng đồng Autism Support mạnh mẽ và thấu hiểu!"</em></p>
      </div>
      <div class="footer">
        <p><strong>Autism Support Platform</strong></p>
        <p>Nơi kết nối và hỗ trợ cộng đồng tự kỷ</p>
        <p>© ${new Date().getFullYear()} - Vì một cộng đồng an toàn và thấu hiểu</p>
      </div>
    </div>
  </body>
  </html>
`,

      // Template gửi OTP reset password
      PASSWORD_RESET_OTP: (data) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
      .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 30px; text-align: center; color: white; }
      .content { padding: 30px; background: #f9f9f9; }
      .footer { padding: 20px; text-align: center; background: #333; color: white; }
      .otp-box { background: white; padding: 25px; text-align: center; border: 2px dashed #ff6b6b; border-radius: 10px; margin: 20px 0; }
      .otp-code { font-size: 32px; font-weight: bold; color: #ff6b6b; letter-spacing: 5px; }
      .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Mã OTP Đặt Lại Mật Khẩu 🔒</h1>
      </div>
      <div class="content">
        <h2>Xin chào ${data.name},</h2>
        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Autism Support của bạn.</p>
        
        <div class="otp-box">
          <h3>Mã OTP của bạn:</h3>
          <div class="otp-code">${data.otp}</div>
          <p>Sử dụng mã này để đặt lại mật khẩu</p>
        </div>

        <div class="warning">
          <strong>⚠️ Lưu ý quan trọng:</strong>
          <p>Mã OTP này sẽ hết hạn trong <strong>${
            data.expiryTime
          }</strong>.</p>
          <p>Không chia sẻ mã OTP này với bất kỳ ai.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        </div>

        <p><strong>Hướng dẫn:</strong></p>
        <ol>
          <li>Quay lại trang đặt lại mật khẩu</li>
          <li>Nhập mã OTP: <strong>${data.otp}</strong></li>
          <li>Tạo mật khẩu mới</li>
          <li>Xác nhận đặt lại mật khẩu</li>
        </ol>
      </div>
      <div class="footer">
        <p><strong>Autism Support Platform</strong></p>
        <p>Đội ngũ hỗ trợ và bảo mật</p>
        <p>© ${new Date().getFullYear()}</p>
      </div>
    </div>
  </body>
  </html>
`,

      // Template xác nhận reset password thành công
      PASSWORD_RESET_SUCCESS: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Mật Khẩu Đã Được Đặt Lại Thành Công! ✅</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.name},</h2>
              
              <div class="success-box">
                <h3>🎉 Thành công!</h3>
                <p>Mật khẩu cho tài khoản Autism Support của bạn đã được đặt lại thành công.</p>
              </div>

              <p><strong>Thông tin bảo mật:</strong></p>
              <ul>
                <li>Thời gian đặt lại: ${data.resetTime}</li>
                <li>Địa chỉ IP: ${data.ipAddress || "Không xác định"}</li>
                <li>Thiết bị: ${data.deviceInfo || "Không xác định"}</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.loginLink}" class="button">Đăng Nhập Ngay</a>
              </div>

              <div class="warning">
                <strong>🔒 Bảo mật tài khoản:</strong>
                <p>Nếu bạn không thực hiện hành động này, vui lòng:</p>
                <ul>
                  <li>Liên hệ ngay với đội ngũ hỗ trợ</li>
                  <li>Kiểm tra các hoạt động đáng ngờ trên tài khoản</li>
                  <li>Đổi mật khẩu một lần nữa nếu cần</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p><strong>Autism Support Platform</strong></p>
              <p>Hỗ trợ bảo mật: ${data.supportEmail}</p>
              <p>© ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `,

      // Template thông báo website mới
      WEBSITE_LAUNCH: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .button { background: #4ecdc4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4ecdc4; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Website Mới Đã Ra Mắt!</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.name},</h2>
              <p>${data.message}</p>
              
              <h3>Những tính năng nổi bật:</h3>
              <div class="feature">
                <strong>🎯 Frontend:</strong> ReactJS với giao diện hiện đại
              </div>
              <div class="feature">
                <strong>⚡ Backend:</strong> Node.js hiệu suất cao
              </div>
              <div class="feature">
                <strong>🗄️ Database:</strong> MongoDB linh hoạt
              </div>
              <div class="feature">
                <strong>📱 Responsive:</strong> Tối ưu cho mọi thiết bị
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${data.websiteUrl}" class="button">Khám phá ngay!</a>
              </p>
            </div>
            <div class="footer">
              <p>Trân trọng,<br>Đội ngũ ${data.companyName}</p>
              <p>&copy; ${new Date().getFullYear()} ${data.companyName}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Template thông báo người dùng bị cấm
      USER_BANNED: (data) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #222; }
      .header { background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%); padding: 30px; text-align: center; color: white; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .content { padding: 28px; background: #ffffff; }
      .footer { padding: 18px; text-align: center; background: #f5f5f5; color: #666; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
      .ban-box { background: #fff0f0; border: 1px solid #ffd6d6; padding: 18px; border-radius: 6px; margin: 16px 0; }
      .info-box { background: #ffffff; padding: 16px; border-radius: 6px; margin: 12px 0; border-left: 4px solid #dc3545; }
      .muted { color: #777; font-size: 14px; }
      .big-count { font-size: 22px; font-weight: 700; color: #b02a37; margin: 6px 0; }
      .button { background: #007bff; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 6px 8px; }
      .button-green { background: #28a745; }
      .small { font-size: 13px; color: #555; }
      a { color: inherit; }
      ul { padding-left: 18px; }
      @media (max-width: 480px) {
        .container { padding: 0 12px; }
        .header { padding: 20px; }
      }
    </style>
  </head>
  <body style="background:#f0f2f5; padding: 20px 0;">
    <div class="container" role="article" aria-label="Thông báo cấm tài khoản">
      <div class="header">
        <h1>🚫 Tài khoản bị cấm</h1>
      </div>

      <div class="content" role="main">
        <h2>Xin chào ${data.userName || "Người dùng"},</h2>

        <div class="ban-box" role="note" aria-label="Thông tin cấm">
          <p style="margin:0 0 6px 0;"><strong>Lý do:</strong> ${
            data.banReason || "Vi phạm quy tắc cộng đồng"
          }</p>
          <p style="margin:0;"><strong>Thời gian:</strong> ${
            data.banDuration || "Bị cấm vĩnh viễn"
          }</p>
        </div>

        <div class="info-box" aria-live="polite">
          <p class="muted">Thông tin chi tiết:</p>
          <p class="small"><strong>Bắt đầu cấm:</strong> ${
            data.bannedAt || new Date().toISOString().slice(0, 10)
          }</p>
          ${
            data.violationSummary
              ? `<p class="small"><strong>Tóm tắt vi phạm:</strong> ${data.violationSummary}</p>`
              : ""
          }
          ${
            data.relatedPost
              ? `<p class="small"><strong>Bài viết/bình luận liên quan:</strong> ${data.relatedPost}</p>`
              : ""
          }
        </div>

        <div class="info-box">
          <h3 style="margin-top:0;">Bạn có thể làm gì tiếp theo</h3>
          <ul>
            ${
              data.canAppeal
                ? `<li>Nộp đơn kháng cáo: nhấn "Nộp kháng cáo" bên dưới để gửi yêu cầu xem xét lại.</li>`
                : `<li>Quyết định cấm này không thể kháng cáo.</li>`
            }
            <li>Xem lại nguyên tắc cộng đồng để tránh vi phạm trong tương lai.</li>
            <li>Nếu cần trợ giúp, liên hệ đội ngũ hỗ trợ.</li>
          </ul>
        </div>

        <div style="text-align:center; margin: 18px 0;">
          ${
            data.canAppeal
              ? `<a href="${
                  data.appealLink || "#"
                }" class="button">Nộp kháng cáo</a>`
              : ""
          }
          <a href="${
            data.contactLink || "#"
          }" class="button button-green">Liên hệ hỗ trợ</a>
          <a href="${
            data.guidelinesLink || "#"
          }" class="button" style="background:#6c757d;">Nguyên tắc cộng đồng</a>
        </div>

        <p class="small muted">Ghi chú: Nếu tài khoản bị tạm dừng do nhiều lần vi phạm, bạn có thể cần khôi phục thông tin từ hệ thống theo chính sách lưu trữ của nền tảng.</p>

        <p style="margin-top:18px;"><em>Trân trọng,</em><br><strong>${
          data.adminName || "Đội ngũ Autism Support"
        }</strong></p>
      </div>

      <div class="footer">
        <p class="small">Autism Support Platform — Hỗ trợ & Thấu hiểu</p>
        <p class="small">© ${new Date().getFullYear()}</p>
      </div>
    </div>
  </body>
  </html>
`,

      // Template thông báo bài viết bị báo cáo
      POST_REPORTED: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .info-box { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ff6b6b; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .post-content { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; font-style: italic; }
            .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📢 Thông Báo Báo Cáo</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.postOwnerName},</h2>
              <p>Bài viết của bạn trên <strong>Autism Support Platform</strong> đã nhận được một báo cáo từ cộng đồng.</p>
              
              <div class="info-box">
                <h3>📋 Thông tin báo cáo:</h3>
                <p><strong>Lý do báo cáo:</strong> ${data.reason}</p>
                ${
                  data.notes
                    ? `<p><strong>Ghi chú từ người báo cáo:</strong> ${data.notes}</p>`
                    : ""
                }
                <p><strong>Thời gian báo cáo:</strong> ${data.reportTime}</p>
                <p><strong>Mã báo cáo:</strong> ${data.reportId}</p>
              </div>

              <div class="info-box">
                <h3>📝 Nội dung bài viết:</h3>
                <div class="post-content">
                  <p>${
                    data.postContent ||
                    "<em>Bài viết không có nội dung văn bản</em>"
                  }</p>
                </div>
                ${
                  data.postFiles > 0
                    ? `<p><strong>Tệp đính kèm:</strong> ${data.postFiles} tệp</p>`
                    : ""
                }
                <p><strong>Thời gian đăng:</strong> ${data.postTime}</p>
              </div>

              <div class="warning">
                <strong>⚠️ Quy trình xử lý:</strong>
                <p>Đội ngũ kiểm duyệt sẽ xem xét báo cáo trong vòng 24-48 giờ. 
                   Chúng tôi cam kết đảm bảo sự công bằng và an toàn cho tất cả thành viên.</p>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${data.postLink}" class="button">Xem bài viết</a>
                <a href="${
                  data.contactLink
                }" class="button" style="background: #6c757d;">Liên hệ hỗ trợ</a>
              </div>

              <p><em>"Cảm ơn bạn đã góp phần xây dựng cộng đồng Autism Support tích cực và an toàn!"</em></p>
            </div>
            <div class="footer">
              <p><strong>Autism Support Platform</strong></p>
              <p>Nơi kết nối và hỗ trợ cộng đồng tự kỷ</p>
              <p>© ${new Date().getFullYear()} - Một cộng đồng an toàn và thấu hiểu</p>
            </div>
          </div>
        </body>
        </html>
      `,

      // Template thông báo bài viết bị ẩn
      POST_BLOCKED: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .alert-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545; }
            .guidelines { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚫 Bài Viết Đã Bị Ẩn</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.userName},</h2>
              
              <div class="alert-box">
                <h3>⚠️ Thông báo quan trọng</h3>
                <p>Bài viết của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng Autism Support.</p>
              </div>

              <div class="info-box">
                <h3>📋 Chi tiết vi phạm:</h3>
                <p><strong>Lý do:</strong> ${data.violationReason}</p>
                <p><strong>Mức độ vi phạm:</strong> ${data.severityLevel}</p>
                <p><strong>Thời gian xử lý:</strong> ${data.actionTime}</p>
                <p><strong>Người xử lý:</strong> ${data.adminName}</p>
                ${
                  data.details
                    ? `<p><strong>Chi tiết:</strong> ${data.details}</p>`
                    : ""
                }
              </div>

              <div class="info-box">
                <h3>📝 Nội dung bài viết đã bị ẩn:</h3>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                  <p><em>${data.postContent || "Nội dung đã bị ẩn"}</em></p>
                </div>
              </div>

              <div class="guidelines">
                <h3>📚 Nguyên tắc cộng đồng:</h3>
                <ul>
                  <li>Tôn trọng các thành viên khác</li>
                  <li>Không đăng nội dung thù ghét, phân biệt đối xử</li>
                  <li>Không chia sẻ thông tin sai lệch về tự kỷ</li>
                  <li>Bảo vệ quyền riêng tư của mọi người</li>
                  <li>Hỗ trợ và thấu hiểu lẫn nhau</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${
                  data.guidelinesLink
                }" class="button">Xem nguyên tắc cộng đồng</a>
                <a href="${
                  data.appealLink
                }" class="button" style="background: #28a745;">Khiếu nại quyết định</a>
              </div>

              <p><strong>Lưu ý:</strong> Việc tiếp tục vi phạm có thể dẫn đến hạn chế quyền sử dụng tài khoản.</p>
            </div>
            <div class="footer">
              <p><strong>Autism Support Platform</strong></p>
              <p>Hỗ trợ: ${data.supportEmail} | Đường dây nóng: 1800-XXXX</p>
              <p>© ${new Date().getFullYear()} - Vì một cộng đồng an toàn và thấu hiểu</p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Template thông báo bài viết bị ẩn comment
      POST_COMMENT_BLOCKED: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .alert-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545; }
            .guidelines { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚫 Bài Viết Đã Bị Ẩn Comment</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.userName},</h2>
              
              <div class="alert-box">
                <h3>⚠️ Thông báo quan trọng</h3>
                <p>Bài viết của bạn đã bị ẩn do vi phạm nguyên tắc cộng đồng Autism Support.</p>
              </div>

              <div class="info-box">
                <h3>📋 Chi tiết vi phạm:</h3>
                <p><strong>Lý do:</strong> ${data.violationReason}</p>
                <p><strong>Mức độ vi phạm:</strong> ${data.severityLevel}</p>
                <p><strong>Thời gian xử lý:</strong> ${data.actionTime}</p>
                <p><strong>Người xử lý:</strong> ${data.adminName}</p>
                ${
                  data.details
                    ? `<p><strong>Chi tiết:</strong> ${data.details}</p>`
                    : ""
                }
              </div>

              <div class="info-box">
                <h3>📝 Nội dung bài viết đã bị ẩn Comment:</h3>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                  <p><em>${data.postContent || "Nội dung đã bị ẩn"}</em></p>
                </div>
              </div>

              <div class="guidelines">
                <h3>📚 Nguyên tắc cộng đồng:</h3>
                <ul>
                  <li>Tôn trọng các thành viên khác</li>
                  <li>Không đăng nội dung thù ghét, phân biệt đối xử</li>
                  <li>Không chia sẻ thông tin sai lệch về tự kỷ</li>
                  <li>Bảo vệ quyền riêng tư của mọi người</li>
                  <li>Hỗ trợ và thấu hiểu lẫn nhau</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${
                  data.guidelinesLink
                }" class="button">Xem nguyên tắc cộng đồng</a>
                <a href="${
                  data.appealLink
                }" class="button" style="background: #28a745;">Khiếu nại quyết định</a>
              </div>

              <p><strong>Lưu ý:</strong> Việc tiếp tục vi phạm có thể dẫn đến hạn chế quyền sử dụng tài khoản.</p>
            </div>
            <div class="footer">
              <p><strong>Autism Support Platform</strong></p>
              <p>Hỗ trợ: ${data.supportEmail} | Đường dây nóng: 1800-XXXX</p>
              <p>© ${new Date().getFullYear()} - Vì một cộng đồng an toàn và thấu hiểu</p>
            </div>
          </div>
        </body>
        </html>
      `,

      // Template thông báo người dùng bị cảnh cáo
      USER_WARNING: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
            .count-box { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
            .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Cảnh Báo Cộng Đồng</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.userName},</h2>
              
              <div class="warning-box">
                <h3>🎯 Thông báo cảnh cáo</h3>
                <p>Tài khoản của bạn đã nhận được một cảnh cáo từ đội ngũ Autism Support.</p>
              </div>

              <div class="info-box">
                <h3>📊 Thống kê vi phạm:</h3>
                <div class="count-box">
                  <p style="font-size: 24px; font-weight: bold; color: #dc3545;">${
                    data.violationCount
                  } LẦN VI PHẠM</p>
                  <p>Lần vi phạm gần nhất: ${data.lastViolationDate}</p>
                </div>
                <p><strong>Vi phạm mới nhất:</strong> ${
                  data.currentViolation
                }</p>
                <p><strong>Mức cảnh cáo:</strong> ${data.warningLevel}</p>
              </div>

              <div class="info-box">
                <h3>📝 Hành động vi phạm:</h3>
                <p>${data.violationDetails}</p>
                ${
                  data.relatedPost
                    ? `<p><strong>Bài viết liên quan:</strong> ${data.relatedPost}</p>`
                    : ""
                }
              </div>

              <div class="info-box">
                <h3>🔔 Hậu quả có thể xảy ra:</h3>
                <ul>
                  ${
                    data.violationCount >= 3
                      ? '<li style="color: #dc3545;">🚫 Tài khoản có nguy cơ bị tạm ngưng</li>'
                      : ""
                  }
                  <li>📉 Hạn chế một số tính năng đăng bài</li>
                  <li>⏰ Thời gian kiểm duyệt lâu hơn</li>
                  <li>👀 Bài viết được giám sát chặt chẽ hơn</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${
                  data.guidelinesLink
                }" class="button">Xem lại nguyên tắc</a>
                <a href="${
                  data.contactLink
                }" class="button" style="background: #28a745;">Liên hệ hỗ trợ</a>
              </div>

              <p><em>Chúng tôi tin rằng bạn có thể cùng chúng tôi xây dựng một cộng đồng tốt đẹp hơn!</em></p>
            </div>
            <div class="footer">
              <p><strong>Autism Support Platform</strong></p>
              <p>Hỗ trợ và thấu hiểu - Vì một cộng đồng an toàn</p>
              <p>© ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `,

      // Template thông báo cho admin về báo cáo mới
      ADMIN_REPORT_ALERT: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .alert-box { background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #17a2b8; }
            .priority-high { background: #f8d7da; border-left: 4px solid #dc3545; }
            .priority-medium { background: #fff3cd; border-left: 4px solid #ffc107; }
            .button { background: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Báo Cáo Mới Cần Xử Lý</h1>
            </div>
            <div class="content">
              <h2>Thông báo cho Quản trị viên</h2>
              
              <div class="alert-box">
                <h3>🚨 Có báo cáo mới cần được xem xét</h3>
                <p>Một thành viên đã báo cáo nội dung vi phạm trên hệ thống.</p>
              </div>

              <div class="info-box ${
                data.priority === "high"
                  ? "priority-high"
                  : data.priority === "medium"
                  ? "priority-medium"
                  : ""
              }">
                <h3>📋 Thông tin báo cáo:</h3>
                <p><strong>Mã báo cáo:</strong> ${data.reportId}</p>
                <p><strong>Loại nội dung:</strong> ${data.contentType}</p>
                <p><strong>Lý do báo cáo:</strong> ${data.reason}</p>
                <p><strong>Mức độ ưu tiên:</strong> 
                  <span style="color: ${
                    data.priority === "high"
                      ? "#dc3545"
                      : data.priority === "medium"
                      ? "#ffc107"
                      : "#28a745"
                  };">
                    ${
                      data.priority === "high"
                        ? "CAO"
                        : data.priority === "medium"
                        ? "TRUNG BÌNH"
                        : "THẤP"
                    }
                  </span>
                </p>
                <p><strong>Thời gian báo cáo:</strong> ${data.reportTime}</p>
                <p><strong>Người báo cáo:</strong> ${data.reporterName}</p>
              </div>

              <div class="info-box">
                <h3>👤 Thông tin người đăng:</h3>
                <p><strong>Tên:</strong> ${data.postOwnerName}</p>
                <p><strong>Lịch sử vi phạm:</strong> ${
                  data.ownerViolationCount
                } lần</p>
                <p><strong>Vai trò:</strong> ${data.ownerRole}</p>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${data.reviewLink}" class="button">Xem xét báo cáo</a>
                <a href="${
                  data.adminDashboardLink
                }" class="button" style="background: #6c757d;">Truy cập Dashboard</a>
              </div>

              <p><small><em>Vui lòng xử lý báo cáo này trong vòng 24 giờ.</em></small></p>
            </div>
            <div class="footer">
              <p><strong>Autism Support Admin System</strong></p>
              <p>Hệ thống quản lý nội dung tự động</p>
              <p>© ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `,

      // Template thông báo chung
      GENERAL_NOTIFICATION: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.title}</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.name},</h2>
              <div>${data.content}</div>
              
              ${
                data.buttonText && data.buttonUrl
                  ? `
                <p style="text-align: center; margin-top: 30px;">
                  <a href="${data.buttonUrl}" class="button">${data.buttonText}</a>
                </p>
              `
                  : ""
              }
              
              ${
                data.note
                  ? `
                <p style="color: #666; font-style: italic; margin-top: 20px;">${data.note}</p>
              `
                  : ""
              }
            </div>
            <div class="footer">
              <p>${data.footer || `Trân trọng,<br>Đội ngũ Autism Support`}</p>
            </div>
          </div>
        </body>
        </html>
      `,

      // Templet thông báo SOS
      EMERGENCY_NEW_REQUEST: (data) => `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                  .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #222; }
                  .header { background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
                  .content { padding: 28px; background: #ffffff; }
                  .footer { padding: 18px; text-align: center; background: #f5f5f5; color: #666; border-radius: 0 0 8px 8px; }
                  .alert-box { background: #fff0f0; border: 2px solid #dc3545; padding: 20px; border-radius: 8px; margin: 16px 0; }
                  .info-box { background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 12px 0; border-left: 4px solid #007bff; }
                  .button { background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 8px; }
                  .button-secondary { background: #6c757d; }
                  .small { font-size: 13px; color: #666; }
              </style>
          </head>
          <body style="background:#f0f2f5; padding: 20px 0;">
              <div class="container">
                  <div class="header">
                      <h1>🚨 YÊU CẦU KHẨN CẤP MỚI</h1>
                      <p>Hệ thống nhận được yêu cầu hỗ trợ khẩn cấp</p>
                  </div>

                  <div class="content">
                      <div class="alert-box">
                          <h2 style="margin-top:0; color: #dc3545;">CẦN PHẢN HỒI NGAY LẬP TỨC</h2>
                          <p>Một yêu cầu hỗ trợ khẩn cấp mới vừa được gửi đến hệ thống.</p>
                      </div>

                      <div class="info-box">
                          <h3>Thông tin yêu cầu</h3>
                          <p><strong>Mã yêu cầu:</strong> ${
                            data.requestId || "Đang cập nhật"
                          }</p>
                          <p><strong>Thời gian:</strong> ${
                            data.createdAt || new Date().toLocaleString("vi-VN")
                          }</p>
                          <p><strong>Loại yêu cầu:</strong> ${
                            data.type || "Khẩn cấp"
                          }</p>
                          <p><strong>Trạng thái:</strong> ${
                            data.status || "Pending"
                          }</p>
                      </div>

                      <div class="info-box">
                          <h3>Thông tin người dùng</h3>
                          <p><strong>ID người dùng:</strong> ${
                            data.userId || "Chưa xác định"
                          }</p>
                          <p><strong>Số điện thoại:</strong> ${
                            data.phoneNumber || "Chưa cung cấp"
                          }</p>
                      </div>

                      <div class="info-box">
                          <h3>Vị trí & Thông tin thêm</h3>
                          <p><strong>Địa chỉ:</strong> ${
                            data.address || "Đang xác định..."
                          }</p>
                          <p><strong>Tọa độ:</strong> ${data.latitude}, ${
        data.longitude
      }</p>
                          <p><strong>Tin nhắn:</strong> ${
                            data.message || "Không có tin nhắn"
                          }</p>
                          <p><strong>Chế độ im lặng:</strong> ${
                            data.isSilent ? "CÓ" : "KHÔNG"
                          }</p>
                      </div>

                      <div style="text-align: center; margin: 25px 0;">
                          <a href="${
                            data.adminLink || "#"
                          }" class="button">XEM CHI TIẾT & XỬ LÝ</a>
                          <a href="${
                            data.mapLink || "#"
                          }" class="button button-secondary">XEM VỊ TRÍ TRÊN BẢN ĐỒ</a>
                      </div>

                      <div class="small" style="background: #fff3cd; padding: 12px; border-radius: 4px;">
                          <strong>Lưu ý quan trọng:</strong> Vui lòng phản hồi yêu cầu này càng sớm càng tốt để đảm bảo an toàn cho người dùng.
                      </div>
                  </div>

                  <div class="footer">
                      <p class="small">Hệ thống Quản lý Khẩn cấp - Autism Support Platform</p>
                      <p class="small">© ${new Date().getFullYear()} - Tự động gửi từ hệ thống</p>
                  </div>
              </div>
          </body>
          </html>
        `,

      EMERGENCY_CONTACT_NOTIFICATION: (data) => {
        const {
          contactName = "Người nhận",
          userName = "Người dùng",
          userPhone = "Không có",
          emergencyType = "Khẩn cấp",
          address = "Không xác định",
          mapLink = "#",
          message = "Cần hỗ trợ khẩn cấp",
          timestamp = "",
          googleMapsLink = "#",
          what3wordsLink = "#",
          actionRequired = "Vui lòng liên hệ ngay",
          relationship = "liên hệ",
          priority = "medium",
        } = data;

        const priorityColor =
          priority === "high"
            ? "#dc3545"
            : priority === "medium"
            ? "#ffc107"
            : "#28a745";

        return `
              <!DOCTYPE html>
              <html>
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Thông báo khẩn cấp</title>
                  <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                      .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid #dc3545; border-radius: 10px; }
                      .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                      .content { padding: 20px; background-color: #f8f9fa; }
                      .alert-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
                      .info-box { background-color: #e7f3ff; border: 1px solid #b3d7ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
                      .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
                      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                      .priority-badge { display: inline-block; padding: 5px 10px; border-radius: 20px; color: white; font-weight: bold; }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <div class="header">
                          <h1>🚨 THÔNG BÁO KHẨN CẤP</h1>
                      </div>
                      
                      <div class="content">
                          <p>Xin chào <strong>${contactName}</strong>,</p>
                          
                          <div class="alert-box">
                              <h3>⚠️ Bạn được liệt kê là liên hệ khẩn cấp của <strong>${userName}</strong></h3>
                              <p><strong>Mối quan hệ:</strong> ${relationship}</p>
                              <div style="background-color: ${priorityColor}; color: white; padding: 8px; border-radius: 5px; text-align: center;">
                                  Mức độ ưu tiên: ${
                                    priority === "high"
                                      ? "CAO"
                                      : priority === "medium"
                                      ? "TRUNG BÌNH"
                                      : "THẤP"
                                  }
                              </div>
                          </div>
                          
                          <div class="info-box">
                              <h4>📋 Thông tin yêu cầu hỗ trợ:</h4>
                              <ul>
                                  <li><strong>Người cần trợ giúp:</strong> ${userName}</li>
                                  <li><strong>Số điện thoại:</strong> ${userPhone}</li>
                                  <li><strong>Loại khẩn cấp:</strong> ${emergencyType}</li>
                                  <li><strong>Thời gian:</strong> ${timestamp}</li>
                                  <li><strong>Địa chỉ:</strong> ${address}</li>
                                  <li><strong>Tin nhắn:</strong> ${message}</li>
                              </ul>
                          </div>
                          
                          <h4>📍 Vị trí trên bản đồ:</h4>
                          <p>
                              <a href="${googleMapsLink}" class="button" target="_blank">
                                  Xem trên Google Maps
                              </a>
                          </p>
                          <p>
                              <small>Hoặc truy cập: <a href="${what3wordsLink}" target="_blank">what3words</a></small>
                          </p>
                          
                          <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
                              <h4 style="color: #721c24; margin-top: 0;">🚑 HÀNH ĐỘNG CẦN THỰC HIỆN:</h4>
                              <ol>
                                  <li>Liên hệ ngay với <strong>${userName}</strong> qua số điện thoại: ${userPhone}</li>
                                  <li>Nếu không liên lạc được, hãy đến vị trí đã cung cấp</li>
                                  <li>Trong trường hợp khẩn cấp, hãy gọi 113 (cảnh sát) hoặc 115 (cấp cứu)</li>
                                  <li>Cập nhật trạng thái cho đội ngũ hỗ trợ nếu có thể</li>
                              </ol>
                          </div>
                          
                          <p><em>Thông báo này được gửi tự động từ hệ thống Autism Support khi người dùng kích hoạt tính năng SOS.</em></p>
                      </div>
                      
                      <div class="footer">
                          <p>© ${new Date().getFullYear()} Autism Support Platform. All rights reserved.</p>
                          <p>Nếu bạn nhận được email này nhầm lẫn, vui lòng liên hệ với quản trị viên.</p>
                      </div>
                  </div>
              </body>
              </html>`;
      },
      // Template thông báo đổi mật khẩu thành công
      PASSWORD_CHANGED: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; background: #333; color: white; }
            .info-box { background: #e9f7fe; border: 1px solid #b8e0f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Mật Khẩu Đã Được Thay Đổi</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.name},</h2>
              <p>Bạn vừa thay đổi mật khẩu cho tài khoản <strong>${
                data.appName || "Autism Support"
              }</strong>.</p>

              <div class="info-box">
                <h3>📅 Thông tin chi tiết</h3>
                <p><strong>Thời gian thay đổi:</strong> ${data.changedAt}</p>
                <p><strong>Địa chỉ IP:</strong> ${
                  data.ipAddress || "Không xác định"
                }</p>
                <p><strong>Thiết bị:</strong> ${
                  data.deviceInfo || "Không xác định"
                }</p>
              </div>

              <p>Thay đổi này giúp bảo vệ tài khoản của bạn an toàn hơn. Hãy đảm bảo rằng chỉ bạn biết mật khẩu mới.</p>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${data.loginLink}" class="button">Đăng Nhập Ngay</a>
              </div>

              <div class="warning">
                <strong>⚠️ Nếu không phải bạn thay đổi:</strong>
                <ul>
                  <li>Vui lòng đổi lại mật khẩu ngay lập tức.</li>
                  <li>Kiểm tra hoạt động đáng ngờ trên tài khoản.</li>
                  <li>Liên hệ đội ngũ hỗ trợ tại: ${data.supportEmail}</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p><strong>${
                data.appName || "Autism Support Platform"
              }</strong></p>
              <p>© ${new Date().getFullYear()} - Bảo mật là ưu tiên hàng đầu của chúng tôi.</p>
            </div>
          </div>
        </body>
        </html>
      `,

      // gửi mail todo
      TODO_REMINDER: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: linear-gradient(135deg, #3788d8 0%, #0d6efd 100%); padding: 30px; text-align: center; color: white; }
    .content { padding: 30px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; background: #333; color: white; }
    .alert-box { background: #fff3cd; border: 1px solid #ffeeba; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .info-box { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3788d8; }
    .button { background: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; color: white; }
    .high { background: #dc3545; }
    .medium { background: #ffc107; color: #000; }
    .low { background: #28a745; }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Nhắc Việc Todo</h1>
    </div>

    <div class="content">
      <h2>Xin chào ${data.userName},</h2>

      <div class="alert-box">
        <p>
          ${
            data.isOverdue
              ? "⚠️ Công việc này đã <strong>QUÁ HẠN</strong>."
              : "🔔 Đây là nhắc nhở cho công việc sắp đến hạn."
          }
        </p>
      </div>

      <div class="info-box">
        <h3>📌 Thông tin công việc</h3>
        <p><strong>Tiêu đề:</strong> ${data.title}</p>
        <p><strong>Mô tả:</strong> ${data.description || "Không có mô tả"}</p>
        <p><strong>Loại:</strong> ${data.type}</p>
        <p>
          <strong>Ưu tiên:</strong>
          <span class="badge ${data.priority}">
            ${data.priority.toUpperCase()}
          </span>
        </p>
        <p><strong>Trạng thái:</strong> ${data.status}</p>
        ${
          data.dueDate
            ? `<p><strong>Hạn chót:</strong> ${data.dueDate}</p>`
            : ""
        }
        ${data.start ? `<p><strong>Bắt đầu:</strong> ${data.start}</p>` : ""}
        ${data.end ? `<p><strong>Kết thúc:</strong> ${data.end}</p>` : ""}
        ${
          data.location
            ? `<p><strong>Địa điểm:</strong> ${data.location}</p>`
            : ""
        }
      </div>

      ${
        data.subtasks?.length
          ? `
        <div class="info-box">
          <h3>🧩 Subtasks</h3>
          <ul>
            ${data.subtasks
              .map((st) => `<li>${st.completed ? "✅" : "⬜"} ${st.title}</li>`)
              .join("")}
          </ul>
        </div>
      `
          : ""
      }

      <div style="text-align: center; margin: 25px 0;">
        <a href="${data.todoLink}" class="button">Xem chi tiết công việc</a>
      </div>

      <p>
        👉 Hãy hoàn thành công việc đúng hạn để đảm bảo tiến độ của bạn.
      </p>
    </div>

    <div class="footer">
      <p><strong>Autism Support Platform</strong></p>
      <p>Hỗ trợ: ${data.supportEmail}</p>
      <p>© ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
`,
    };
  }

  /**
   * Lấy template theo tên
   */
  getTemplate(templateName, data) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }
    return template(data);
  }

  /**
   * Thêm template mới
   */
  addTemplate(templateName, templateFunction) {
    this.templates[templateName] = templateFunction;
  }

  /**
   * Lấy danh sách template available
   */
  getAvailableTemplates() {
    return Object.keys(this.templates);
  }
}

module.exports = new EmailTemplates();
