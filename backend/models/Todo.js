// // models/Todo.js
// const mongoose = require("mongoose");

// const subtaskSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: [200, "Tiêu đề subtask không được vượt quá 200 ký tự"],
//     },
//     completed: {
//       type: Boolean,
//       default: false,
//     },
//     completedAt: {
//       type: Date,
//     },
//   },
//   { _id: true }
// );

// const estimatedTimeSchema = new mongoose.Schema(
//   {
//     value: {
//       type: Number,
//       default: 0,
//       min: [0, "Thời gian ước tính phải >= 0"],
//     },
//     unit: {
//       type: String,
//       enum: ["minutes", "hours", "days"],
//       default: "minutes",
//     },
//   },
//   { _id: false }
// );

// const todoSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: [true, "Tiêu đề không được để trống"],
//       trim: true,
//       maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
//     },
//     description: {
//       type: String,
//       trim: true,
//       maxlength: [1000, "Mô tả không được vượt quá 1000 ký tự"],
//     },

//     // Calendar fields
//     start: {
//       type: Date,
//       required: function () {
//         return this.hasCalendarEvent;
//       },
//     },
//     end: {
//       type: Date,
//       validate: {
//         validator: function (value) {
//           if (!this.hasCalendarEvent) return true;
//           return value > this.start;
//         },
//         message: "Thời gian kết thúc phải sau thời gian bắt đầu",
//       },
//     },
//     type: {
//       type: String,
//       enum: [
//         "Meeting",
//         "Business travel",
//         "Personal Work",
//         "Team Project",
//         "Appointment",
//         "Task",
//         "Other",
//       ],
//       default: "Task",
//     },
//     color: {
//       type: String,
//       default: "#3788d8",
//     },
//     location: {
//       type: String,
//       trim: true,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     attendees: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],
//     isAllDay: {
//       type: Boolean,
//       default: false,
//     },
//     reminder: {
//       type: Date,
//     },
//     status: {
//       type: String,
//       enum: ["scheduled", "in-progress", "done", "cancelled"],
//       default: "scheduled",
//     },

//     // Todo-specific fields
//     hasCalendarEvent: {
//       type: Boolean,
//       default: false,
//     },
//     priority: {
//       type: String,
//       enum: ["low", "medium", "high"],
//       default: "medium",
//     },
//     dueDate: {
//       type: Date,
//     },
//     tags: {
//       type: [String],
//       trim: true,
//       default: [],
//     },
//     completedAt: {
//       type: Date,
//     },
//     isImportant: {
//       type: Boolean,
//       default: false,
//     },
//     estimatedTime: {
//       type: estimatedTimeSchema,
//       default: () => ({ value: 0, unit: "minutes" }),
//     },
//     category: {
//       type: String,
//       trim: true,
//     },
//     subtasks: {
//       type: [subtaskSchema],
//       default: [],
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Indexes
// todoSchema.index({ createdBy: 1, start: 1 });
// todoSchema.index({ createdBy: 1, dueDate: 1 });
// todoSchema.index({ createdBy: 1, status: 1 });
// todoSchema.index({ createdBy: 1, priority: 1 });
// todoSchema.index({ createdBy: 1, hasCalendarEvent: 1 });
// todoSchema.index({ createdBy: 1, tags: 1 });
// todoSchema.index({ createdBy: 1, status: 1, priority: 1, type: 1 });

// // Virtuals
// todoSchema.virtual("duration").get(function () {
//   if (!this.start || !this.end) return null;
//   return Math.round((this.end - this.start) / (1000 * 60)); // phút
// });

// todoSchema.virtual("progress").get(function () {
//   if (this.status === "done") return 100;
//   if (this.status === "cancelled") return 0;
//   if (this.subtasks.length === 0) return 0;

//   const completedSubtasks = this.subtasks.filter((st) => st.completed).length;
//   return Math.round((completedSubtasks / this.subtasks.length) * 100);
// });

// // Static methods
// todoSchema.statics.getCalendarEvents = function (userId, startDate, endDate) {
//   return this.find({
//     createdBy: userId,
//     hasCalendarEvent: true,
//     $or: [
//       { start: { $gte: startDate, $lte: endDate } },
//       { end: { $gte: startDate, $lte: endDate } },
//       { start: { $lte: startDate }, end: { $gte: endDate } },
//     ],
//   })
//     .populate("createdBy", "username fullName profile.avatar")
//     .populate("attendees", "username fullName profile.avatar")
//     .sort({ start: 1 });
// };

// todoSchema.statics.getTodos = function (userId, filters = {}, options = {}) {
//   const query = { createdBy: userId };

//   if (filters.status) query.status = filters.status;
//   if (filters.priority) query.priority = filters.priority;
//   if (filters.hasCalendarEvent !== undefined)
//     query.hasCalendarEvent = filters.hasCalendarEvent;
//   if (filters.type) query.type = filters.type;

//   const limit = options.limit || 20;
//   const skip = options.skip || 0;

//   return this.find(query)
//     .populate("createdBy", "username fullName profile.avatar")
//     .populate("attendees", "username fullName profile.avatar")
//     .sort({ [filters.sortBy || "createdAt"]: -1 })
//     .skip(skip)
//     .limit(limit);
// };

// // Instance methods
// todoSchema.methods.markComplete = function () {
//   this.status = "done";
//   this.completedAt = new Date();
//   this.subtasks.forEach((st) => (st.completed = true));
//   return this.save();
// };

// todoSchema.methods.addToCalendar = function (calendarData) {
//   this.hasCalendarEvent = true;
//   this.start = calendarData.start;
//   this.end = calendarData.end;
//   this.location = calendarData.location;
//   this.attendees = calendarData.attendees || [];
//   this.isAllDay = calendarData.isAllDay || false;
//   return this.save();
// };

// todoSchema.methods.removeFromCalendar = function () {
//   this.hasCalendarEvent = false;
//   this.start = undefined;
//   this.end = undefined;
//   this.location = undefined;
//   this.isAllDay = false;
//   this.attendees = [];
//   return this.save();
// };

// // Middleware
// todoSchema.pre("validate", function (next) {
//   if (this.hasCalendarEvent) {
//     if (!this.start || !this.end)
//       return next(
//         new Error("Sự kiện lịch cần có thời gian bắt đầu và kết thúc")
//       );
//     if (this.end <= this.start)
//       return next(new Error("Thời gian kết thúc phải sau thời gian bắt đầu"));
//   }
//   next();
// });

// todoSchema.pre("save", function (next) {
//   // Auto-set color based on type
//   const colorMap = {
//     Meeting: "#3788d8",
//     "Business travel": "#28a745",
//     "Personal Work": "#ffc107",
//     "Team Project": "#dc3545",
//     Appointment: "#6f42c1",
//     Task: "#17a2b8",
//     Other: "#6c757d",
//   };

//   if (this.isModified("type") && colorMap[this.type])
//     this.color = colorMap[this.type];

//   // Set completedAt if marked as done
//   if (this.isModified("status") && this.status === "done" && !this.completedAt)
//     this.completedAt = new Date();

//   next();
// });

// module.exports = mongoose.model("Todo", todoSchema);

// models/Todo.js
const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Tiêu đề subtask không được vượt quá 200 ký tự"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const estimatedTimeSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      default: 0,
      min: [0, "Thời gian ước tính phải >= 0"],
    },
    unit: {
      type: String,
      enum: ["minutes", "hours", "days"],
      default: "minutes",
    },
  },
  { _id: false }
);

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề không được để trống"],
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Mô tả không được vượt quá 1000 ký tự"],
    },

    // Calendar fields
    start: {
      type: Date,
      required: function () {
        return this.hasCalendarEvent;
      },
    },
    end: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!this.hasCalendarEvent) return true;
          return value > this.start;
        },
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      },
    },
    type: {
      type: String,
      enum: [
        "Meeting",
        "BusinessTravel",
        "PersonalWork",
        "TeamProject",
        "Appointment",
        "Task",
        "Other",
      ],
      default: "Task",
    },
    color: {
      type: String,
      default: "#3788d8",
    },
    location: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isAllDay: {
      type: Boolean,
      default: false,
    },
    reminder: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "done", "cancelled"],
      default: "scheduled",
    },

    // Todo-specific fields
    hasCalendarEvent: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    tags: {
      type: [String],
      trim: true,
      default: [],
    },
    completedAt: {
      type: Date,
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    estimatedTime: {
      type: estimatedTimeSchema,
      default: () => ({ value: 0, unit: "minutes" }),
    },
    category: {
      type: String,
      trim: true,
    },
    subtasks: {
      type: [subtaskSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
todoSchema.index({ createdBy: 1, start: 1 });
todoSchema.index({ createdBy: 1, dueDate: 1 });
todoSchema.index({ createdBy: 1, status: 1 });
todoSchema.index({ createdBy: 1, priority: 1 });
todoSchema.index({ createdBy: 1, hasCalendarEvent: 1 });
todoSchema.index({ createdBy: 1, tags: 1 });
todoSchema.index({ createdBy: 1, status: 1, priority: 1, type: 1 });
todoSchema.index({ createdBy: 1, dueDate: 1, status: 1 });
todoSchema.index({ createdBy: 1, isImportant: 1, status: 1 });
todoSchema.index({ createdBy: 1, dueDate: 1, isImportant: 1 });
todoSchema.index({ createdBy: 1, status: 1, priority: 1 });

// Virtuals
todoSchema.virtual("duration").get(function () {
  if (!this.start || !this.end) return null;
  return Math.round((this.end - this.start) / (1000 * 60)); // phút
});

todoSchema.virtual("progress").get(function () {
  if (this.status === "done") return 100;
  if (this.status === "cancelled") return 0;
  if (this.subtasks.length === 0) return 0;

  const completedSubtasks = this.subtasks.filter((st) => st.completed).length;
  return Math.round((completedSubtasks / this.subtasks.length) * 100);
});

// Middleware
todoSchema.pre("validate", function (next) {
  if (this.hasCalendarEvent) {
    if (!this.start || !this.end)
      return next(
        new Error("Sự kiện lịch cần có thời gian bắt đầu và kết thúc")
      );
    if (this.end <= this.start)
      return next(new Error("Thời gian kết thúc phải sau thời gian bắt đầu"));
  }
  next();
});

todoSchema.pre("save", function (next) {
  // Auto-set color based on type
  const colorMap = {
    Meeting: "#3788d8",
    BusinessTravel: "#28a745",
    PersonalWork: "#ffc107",
    TeamProject: "#dc3545",
    Appointment: "#804ae5ff",
    Task: "#04dbfcff",
    Other: "#6e7072ff",
  };

  if (this.isModified("type") && colorMap[this.type])
    this.color = colorMap[this.type];

  // Set completedAt if marked as done
  if (this.isModified("status") && this.status === "done" && !this.completedAt)
    this.completedAt = new Date();

  next();
});

module.exports = mongoose.model("Todo", todoSchema);
