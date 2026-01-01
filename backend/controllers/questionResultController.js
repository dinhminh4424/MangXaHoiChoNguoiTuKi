const QuestionResult = require("../models/QuestionResult");

class QuestionResultController {
  // Lưu kết quả bài tập
  async saveResult(req, res) {
    try {
      const userId = req.user.userId;
      const {
        topic,
        numberOfQuestions,
        questions,
        userAnswers,
        score,
        details,
        overall_review,
      } = req.body;

      console.log("Received data:", {
        topic,
        numberOfQuestions,
        questionsLength: questions?.length,
        userAnswersType: typeof userAnswers,
        userAnswersKeys: Object.keys(userAnswers || {}),
        score,
        detailsLength: details?.length,
      });

      // Kiểm tra và chuyển đổi dữ liệu
      let questionsArray = questions;

      // Nếu questions là string, parse thành array
      if (typeof questions === "string") {
        try {
          questionsArray = JSON.parse(questions);
        } catch (parseError) {
          console.error("Parse questions error:", parseError);
          return res.status(400).json({
            success: false,
            message: "Định dạng câu hỏi không hợp lệ",
            error: parseError.message,
          });
        }
      }

      // Đảm bảo questions là mảng
      if (!Array.isArray(questionsArray)) {
        return res.status(400).json({
          success: false,
          message: "Câu hỏi phải là một mảng",
        });
      }

      // Validate từng câu hỏi
      const validatedQuestions = questionsArray.map((q, index) => ({
        id: q.id || index + 1,
        type: q.type || "question",
        topic: q.topic || topic,
        title: q.title || "",
        question: q.question || "",
        // Chuyển options từ Object sang Map
        options: q.options || {},
      }));

      // Validate details
      const validatedDetails = (details || []).map((detail, index) => ({
        questionId: detail.questionId || detail.id || index + 1,
        userChoice: detail.userChoice || "",
        correctAnswer: detail.correctAnswer || "",
        isCorrect: detail.isCorrect || false,
        analysis: detail.analysis || {
          empathy_check: detail.analysis?.empathy_check || "",
          social_logic: detail.analysis?.social_logic || "",
          correction: detail.analysis?.correction || "",
        },
      }));

      // Tính phần trăm điểm
      const scoreMatch = score?.match(/(\d+)\/(\d+)/);
      const scorePercentage = scoreMatch
        ? Math.round((parseInt(scoreMatch[1]) / parseInt(scoreMatch[2])) * 100)
        : 0;

      // SỬA QUAN TRỌNG: Chuyển userAnswers từ Object sang Map
      let userAnswersMap = new Map();
      if (userAnswers && typeof userAnswers === "object") {
        // Chuyển Object thành Map
        Object.entries(userAnswers).forEach(([key, value]) => {
          userAnswersMap.set(key, value);
        });
      }

      // Tạo đối tượng kết quả - SỬA DÒNG NÀY
      const result = new QuestionResult({
        userId,
        topic: topic || "Không xác định",
        numberOfQuestions: numberOfQuestions || validatedQuestions.length,
        questions: validatedQuestions,
        userAnswers: userAnswersMap, // Gửi Map, không phải Object
        score: score || "0/0",
        scorePercentage,
        details: validatedDetails,
        overall_review: overall_review || {
          strengths: "",
          areas_for_improvement: "",
          actionable_advice: "",
        },
      });

      // Không cần validateSync vì sẽ được middleware xử lý
      await result.save();

      console.log("Result saved successfully:", result._id);

      res.status(201).json({
        success: true,
        message: "Kết quả đã được lưu thành công",
        data: {
          resultId: result._id,
          topic: result.topic,
          score: result.score,
          scorePercentage: result.scorePercentage,
          completedAt: result.completedAt,
        },
      });
    } catch (error) {
      console.error("Lỗi khi lưu kết quả:", error);

      // Xử lý lỗi cụ thể
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          error: error.message,
          errors: error.errors,
        });
      }

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Định dạng dữ liệu không đúng",
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Lỗi khi lưu kết quả",
        error: error.message,
      });
    }
  }
  // Lấy danh sách kết quả
  async getResults(req, res) {
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 10,
        topic,
        sortBy = "completedAt",
        sortOrder = "desc",
      } = req.query;

      const query = { userId };
      if (topic && topic !== "all") {
        query.topic = topic;
      }

      const skip = (page - 1) * limit;

      // Sắp xếp
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      const total = await QuestionResult.countDocuments(query);

      const results = await QuestionResult.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select(
          "topic score scorePercentage numberOfQuestions completedAt createdAt"
        );

      res.json({
        success: true,
        data: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách kết quả:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách kết quả",
        error: error.message,
      });
    }
  }

  // Lấy chi tiết kết quả
  async getResultDetails(req, res) {
    try {
      const userId = req.user.userId;
      const { resultId } = req.params;

      const result = await QuestionResult.findOne({
        _id: resultId,
        userId,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy kết quả",
        });
      }

      // Convert to object (không cần xử lý Map nữa)
      const resultObj = result.toObject();

      // KHÔNG cần dòng này nữa vì userAnswers đã là Object
      // resultObj.userAnswers = Object.fromEntries(result.userAnswers);

      // Nếu muốn đảm bảo userAnswers là Object (trong trường hợp đặc biệt)
      if (result.userAnswers instanceof Map) {
        resultObj.userAnswers = Object.fromEntries(result.userAnswers);
      } else {
        resultObj.userAnswers = result.userAnswers || {};
      }

      res.json({
        success: true,
        data: resultObj,
      });
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết kết quả:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy chi tiết kết quả",
        error: error.message,
      });
    }
  }

  // Lấy thống kê
  async getStatistics(req, res) {
    try {
      const userId = req.user.userId;
      const { period = "all" } = req.query;

      // Tạo filter theo thời gian
      let dateFilter = {};
      if (period !== "all") {
        const days = period === "week" ? 7 : period === "month" ? 30 : 365;
        dateFilter.completedAt = {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        };
      }

      // Tổng quan
      const overview = await QuestionResult.aggregate([
        {
          $match: {
            userId,
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            totalQuestions: { $sum: "$numberOfQuestions" },
            averageScore: { $avg: "$scorePercentage" },
            bestScore: { $max: "$scorePercentage" },
            worstScore: { $min: "$scorePercentage" },
          },
        },
      ]);

      // Phân bổ theo chủ đề
      const topicsStats = await QuestionResult.aggregate([
        {
          $match: {
            userId,
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: "$topic",
            attempts: { $sum: 1 },
            avgScore: { $avg: "$scorePercentage" },
            bestScore: { $max: "$scorePercentage" },
            totalQuestions: { $sum: "$numberOfQuestions" },
          },
        },
        { $sort: { attempts: -1 } },
      ]);

      // Tiến trình theo thời gian
      const timeline = await QuestionResult.aggregate([
        {
          $match: {
            userId,
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$completedAt" },
            },
            attempts: { $sum: 1 },
            avgScore: { $avg: "$scorePercentage" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]);

      res.json({
        success: true,
        data: {
          overview: overview[0] || {
            totalAttempts: 0,
            totalQuestions: 0,
            averageScore: 0,
            bestScore: 0,
            worstScore: 0,
          },
          topics: topicsStats,
          timeline,
          period,
        },
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê",
        error: error.message,
      });
    }
  }

  // Xóa kết quả
  async deleteResult(req, res) {
    try {
      const userId = req.user.userId;
      const { resultId } = req.params;

      const result = await QuestionResult.findOneAndDelete({
        _id: resultId,
        userId,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy kết quả",
        });
      }

      res.json({
        success: true,
        message: "Đã xóa kết quả thành công",
      });
    } catch (error) {
      console.error("Lỗi khi xóa kết quả:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa kết quả",
        error: error.message,
      });
    }
  }
}

module.exports = new QuestionResultController();
