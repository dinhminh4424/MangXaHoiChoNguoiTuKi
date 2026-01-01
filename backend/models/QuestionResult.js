const mongoose = require("mongoose");

const evaluationDetailSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true,
    },
    userChoice: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    analysis: {
      empathy_check: { type: String, default: "" },
      social_logic: { type: String, default: "" },
      correction: { type: String, default: "" },
    },
  },
  { _id: false }
); // Không tạo _id cho subdocument

const overallReviewSchema = new mongoose.Schema(
  {
    strengths: { type: String, default: "" },
    areas_for_improvement: { type: String, default: "" },
    actionable_advice: { type: String, default: "" },
  },
  { _id: false }
);

const questionResultSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  topic: {
    type: String,
    required: true,
    default: "Không xác định",
  },
  numberOfQuestions: {
    type: Number,
    required: true,
    min: 1,
  },
  questions: {
    type: [
      {
        id: { type: Number, required: true },
        type: { type: String, default: "question" },
        topic: { type: String, default: "" },
        title: { type: String, default: "" },
        question: { type: String, required: true },
        options: {
          type: Object, // Thay Map bằng Object
          default: {},
        },
      },
    ],
    required: true,
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "Phải có ít nhất một câu hỏi",
    },
  },
  userAnswers: {
    type: Object, // Thay Map bằng Object
    default: {},
  },
  score: {
    type: String,
    required: true,
    default: "0/0",
  },
  scorePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  details: {
    type: [evaluationDetailSchema],
    default: [],
  },
  overall_review: {
    type: overallReviewSchema,
    default: () => ({
      strengths: "",
      areas_for_improvement: "",
      actionable_advice: "",
    }),
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index
questionResultSchema.index({ userId: 1, completedAt: -1 });
questionResultSchema.index({ userId: 1, topic: 1 });

// Middleware để đảm bảo dữ liệu hợp lệ
questionResultSchema.pre("save", function (next) {
  // Đảm bảo userAnswers là Map
  if (this.userAnswers && !(this.userAnswers instanceof Map)) {
    this.userAnswers = new Map(Object.entries(this.userAnswers));
  }

  // Đảm bảo options trong mỗi câu hỏi là Map
  this.questions = this.questions.map((q) => ({
    ...q,
    options:
      q.options instanceof Map
        ? q.options
        : new Map(Object.entries(q.options || {})),
  }));

  next();
});

const QuestionResult = mongoose.model("QuestionResult", questionResultSchema);

module.exports = QuestionResult;
