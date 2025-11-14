const cron = require('node-cron');
const User = require('../models/User');

// Hàm này sẽ chạy mỗi ngày vào lúc 00:05 sáng
const checkLostStreaks = () => {
    cron.schedule('5 0 * * *', async () => {
        console.log('Running daily streak check...');

        // Lấy thời điểm bắt đầu của ngày hôm qua (00:00:00)
        const startOfYesterday = new Date();
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);

        try {
            // Tìm tất cả user có chuỗi và hoạt động cuối cùng của họ là TRƯỚC ngày hôm qua
            // Điều này có nghĩa là họ đã không hoạt động vào ngày hôm qua
            const result = await User.updateMany(
                {
                    checkInStreak: { $gt: 0 }, // Chỉ kiểm tra user có chuỗi
                    last_activity_date: { $lt: startOfYesterday }
                },
                {
                    $set: { has_lost_streak: true }
                    // Chúng ta không reset streak về 0 ở đây để cho người dùng cơ hội khôi phục
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`Marked ${result.modifiedCount} users as having lost their streak.`);
            } else {
                console.log('No users lost their streak today.');
            }

        } catch (error) {
            console.error('Error during daily streak check:', error);
        }
    }, {
        timezone: "Asia/Ho_Chi_Minh" // Rất quan trọng: Đặt múi giờ cho server
    });
};

module.exports = checkLostStreaks;