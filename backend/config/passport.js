// backend/config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User"); // Đường dẫn tới User model của bạn
const { generateUniqueUsernameFrom } = require("../utils/username");

// Chiến lược Google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback", // Phải khớp với Google Console
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const displayName = profile.displayName;
        const avatarUrl = profile.photos[0].value;
        // 1. Kiểm tra xem user đã tồn tại với googleId này chưa
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user); // User đã tồn tại, trả về
        }

        // 2. Nếu chưa, kiểm tra xem có user nào dùng email này không
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Email đã tồn tại (có thể đăng ký bằng password trước đó)
          // Cập nhật user này với googleId
          user.googleId = profile.id;

          // --- SỬA LỖI TẠI ĐÂY ---
          // Cập nhật avatar nếu chưa có, lưu vào đúng schema
          if (!user.profile.avatar) {
            user.profile.avatar = avatarUrl;
          }
          if (!user.fullName) {
            user.fullName = displayName;
          }
          await user.save();
          return done(null, user);
        }

        // 3. Nếu không có, tạo user mới
        const baseName =
          profile.displayName || (email ? email.split("@")[0] : "user");
        const username = await generateUniqueUsernameFrom(baseName, profile.id);

        const newUser = new User({
          googleId: profile.id,
          username: username,
          email: email,

          fullName: displayName,
          profile: {
            avatar: avatarUrl,
          },
          // Mật khẩu có thể để trống vì họ dùng social login
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/auth/facebook/callback", // Phải khớp với Facebook App Dashboard
      profileFields: ["id", "displayName", "emails", "photos"], // Yêu cầu các trường cụ thể
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Facebook trả về email trong mảng 'emails'
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!email) {
          // Đôi khi người dùng FB không chia sẻ email
          return done(new Error("Facebook không cung cấp email."), false);
        }

        // 1. Kiểm tra xem user đã tồn tại với facebookId này chưa
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
          return done(null, user); // User đã tồn tại, trả về
        }

        // 2. Nếu chưa, kiểm tra xem có user nào dùng email này không
        user = await User.findOne({ email: email });

        if (user) {
          // Email đã tồn tại (có thể đăng ký bằng password/Google)
          // Cập nhật user này với facebookId
          user.facebookId = profile.id;
          // Cập nhật avatar nếu chưa có
          if (!user.profile.avatar) {
            user.profile.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // 3. Nếu không có, tạo user mới
        const newUser = new User({
          facebookId: profile.id,
          // Tạo username/fullName từ displayName
          username: profile.displayName.replace(/\s/g, "") + profile.id,
          fullName: profile.displayName,
          email: email,
          profile: {
            avatar: profile.photos[0].value,
          },
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);
