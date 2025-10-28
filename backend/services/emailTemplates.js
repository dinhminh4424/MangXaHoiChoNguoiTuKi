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
