// // controllers/todoController.js
// const Todo = require("../models/Todo");

// // === LẤY TẤT CẢ TODOS VỚI FILTER ===
// exports.getTodos = async (req, res) => {
//   try {
//     const {
//       status,
//       priority,
//       hasCalendarEvent,
//       type,
//       sortBy = "createdAt",
//       limit = 20,
//       page = 1,
//     } = req.query;

//     const filters = { createdBy: req.user.userId };

//     if (status) filters.status = status;
//     if (priority) filters.priority = priority;
//     if (hasCalendarEvent !== undefined)
//       filters.hasCalendarEvent = hasCalendarEvent === "true";
//     if (type) filters.type = type;

//     const options = {
//       limit: parseInt(limit),
//       skip: (parseInt(page) - 1) * parseInt(limit),
//     };

//     const todos = await Todo.getTodos(req.user.userId, filters, options);
//     const total = await Todo.countDocuments(filters);

//     return res.status(200).json({
//       success: true,
//       todos,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         totalPages: Math.ceil(total / parseInt(limit)),
//       },
//     });
//   } catch (error) {
//     console.error("Lỗi lấy todos:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // === LẤY SỰ KIỆN LỊCH ===
// exports.getCalendarEvents = async (req, res) => {
//   try {
//     const { start, end } = req.query;

//     if (!start || !end) {
//       return res.status(400).json({
//         success: false,
//         message: "Thiếu tham số start và end",
//       });
//     }

//     const events = await Todo.getCalendarEvents(
//       req.user.userId,
//       new Date(start),
//       new Date(end)
//     );

//     return res.status(200).json({
//       success: true,
//       events,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy sự kiện lịch:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // === TẠO TODO MỚI ===
// exports.createTodo = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       start,
//       end,
//       type = "Task",
//       color,
//       location,
//       attendees = [],
//       isAllDay = false,
//       reminder,
//       priority = "medium",
//       dueDate,
//       tags = [],
//       isImportant = false,
//       estimatedTime,
//       category,
//       subtasks = [],
//     } = req.body;

//     const hasCalendarEvent = !!(start && end);

//     const todoData = {
//       title,
//       description,
//       createdBy: req.user.userId,
//       type,
//       color,
//       location,
//       attendees,
//       isAllDay,
//       reminder: reminder ? new Date(reminder) : undefined,
//       priority,
//       dueDate: dueDate ? new Date(dueDate) : undefined,
//       tags: Array.isArray(tags)
//         ? tags
//         : tags.split(",").map((tag) => tag.trim()),
//       isImportant,
//       category,
//       subtasks: Array.isArray(subtasks) ? subtasks : [],
//       hasCalendarEvent,
//     };

//     // Thêm calendar fields nếu có
//     if (hasCalendarEvent) {
//       todoData.start = new Date(start);
//       todoData.end = new Date(end);
//     }

//     // Xử lý estimatedTime
//     if (estimatedTime) {
//       if (typeof estimatedTime === "object") {
//         todoData.estimatedTime = estimatedTime;
//       } else if (typeof estimatedTime === "string") {
//         try {
//           todoData.estimatedTime = JSON.parse(estimatedTime);
//         } catch {
//           // Giữ nguyên default
//         }
//       }
//     }

//     const newTodo = new Todo(todoData);
//     await newTodo.save();

//     // Populate thông tin user
//     await newTodo.populate("createdBy", "username fullName profile.avatar");
//     await newTodo.populate("attendees", "username fullName profile.avatar");

//     return res.status(201).json({
//       success: true,
//       message: "Tạo todo thành công",
//       todo: newTodo,
//     });
//   } catch (error) {
//     console.error("Lỗi tạo todo:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // === CẬP NHẬT TODO ===
// exports.updateTodo = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = { ...req.body };

//     const todo = await Todo.findById(id);
//     if (!todo) {
//       return res.status(404).json({
//         success: false,
//         message: "Todo không tồn tại",
//       });
//     }

//     // Kiểm tra quyền sở hữu
//     if (!todo.createdBy.equals(req.user.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: "Không có quyền chỉnh sửa todo này",
//       });
//     }

//     // Xử lý datetime fields
//     if (updateData.start) updateData.start = new Date(updateData.start);
//     if (updateData.end) updateData.end = new Date(updateData.end);
//     if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
//     if (updateData.reminder)
//       updateData.reminder = new Date(updateData.reminder);

//     // Xử lý mảng
//     if (updateData.tags && typeof updateData.tags === "string") {
//       updateData.tags = updateData.tags.split(",").map((tag) => tag.trim());
//     }

//     if (updateData.subtasks && typeof updateData.subtasks === "string") {
//       try {
//         updateData.subtasks = JSON.parse(updateData.subtasks);
//       } catch {
//         updateData.subtasks = [];
//       }
//     }

//     // Cập nhật hasCalendarEvent
//     if (updateData.start && updateData.end) {
//       updateData.hasCalendarEvent = true;
//     } else if (updateData.start === null && updateData.end === null) {
//       updateData.hasCalendarEvent = false;
//     }

//     const updatedTodo = await Todo.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     })
//       .populate("createdBy", "username fullName profile.avatar")
//       .populate("attendees", "username fullName profile.avatar");

//     return res.status(200).json({
//       success: true,
//       message: "Cập nhật todo thành công",
//       todo: updatedTodo,
//     });
//   } catch (error) {
//     console.error("Lỗi cập nhật todo:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // === XÓA TODO ===
// exports.deleteTodo = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const todo = await Todo.findById(id);
//     if (!todo) {
//       return res.status(404).json({
//         success: false,
//         message: "Todo không tồn tại",
//       });
//     }

//     if (!todo.createdBy.equals(req.user.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: "Không có quyền xóa todo này",
//       });
//     }

//     await Todo.findByIdAndDelete(id);

//     return res.status(200).json({
//       success: true,
//       message: "Xóa todo thành công",
//     });
//   } catch (error) {
//     console.error("Lỗi xóa todo:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // === ĐÁNH DẤU HOÀN THÀNH ===
// exports.markComplete = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const todo = await Todo.findById(id);
//     if (!todo) {
//       console.log("Todo không tồn tại: " + id);
//       return res.status(400).json({
//         success: false,
//         message: "Todo không tồn tại",
//       });
//     }

//     if (!todo.createdBy.equals(req.user.userId)) {
//       console.log("Không có quyền thao tác todo này: " + todo);
//       return res.status(403).json({
//         success: false,
//         message: "Không có quyền thao tác todo này",
//       });
//     }

//     // const updatedTodo = await todo.markComplete();

//     const updatedTodo = await Todo.findOne({ _id: id }, { $set: {} });

//     return res.status(200).json({
//       success: true,
//       message: "Đánh dấu hoàn thành thành công",
//       todo: updatedTodo,
//     });
//   } catch (error) {
//     console.error("Lỗi đánh dấu hoàn thành:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // === THÊM VÀO LỊCH ===
// exports.addToCalendar = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { start, end, location, attendees, isAllDay } = req.body;

//     const todo = await Todo.findById(id);
//     if (!todo) {
//       return res.status(404).json({
//         success: false,
//         message: "Todo không tồn tại",
//       });
//     }

//     if (!todo.createdBy.equals(req.user.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: "Không có quyền thao tác todo này",
//       });
//     }

//     const calendarData = {
//       start: new Date(start),
//       end: new Date(end),
//       location,
//       attendees: attendees || [],
//       isAllDay: isAllDay || false,
//     };

//     const updatedTodo = await todo.addToCalendar(calendarData);

//     return res.status(200).json({
//       success: true,
//       message: "Thêm vào lịch thành công",
//       todo: updatedTodo,
//     });
//   } catch (error) {
//     console.error("Lỗi thêm vào lịch:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // === XÓA KHỎI LỊCH ===
// exports.removeFromCalendar = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const todo = await Todo.findById(id);
//     if (!todo) {
//       return res.status(404).json({
//         success: false,
//         message: "Todo không tồn tại",
//       });
//     }

//     if (!todo.createdBy.equals(req.user.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: "Không có quyền thao tác todo này",
//       });
//     }

//     const updatedTodo = await todo.removeFromCalendar();

//     return res.status(200).json({
//       success: true,
//       message: "Xóa khỏi lịch thành công",
//       todo: updatedTodo,
//     });
//   } catch (error) {
//     console.error("Lỗi xóa khỏi lịch:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // === THÊM SUBTASK ===
// exports.addSubtask = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title } = req.body;

//     if (!title) {
//       return res.status(400).json({
//         success: false,
//         message: "Tiêu đề subtask là bắt buộc",
//       });
//     }

//     const todo = await Todo.findById(id);
//     if (!todo) {
//       return res.status(404).json({
//         success: false,
//         message: "Todo không tồn tại",
//       });
//     }

//     if (!todo.createdBy.equals(req.user.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: "Không có quyền thao tác todo này",
//       });
//     }

//     const newSubtask = {
//       title,
//       completed: false,
//     };

//     todo.subtasks.push(newSubtask);
//     await todo.save();

//     return res.status(200).json({
//       success: true,
//       message: "Thêm subtask thành công",
//       subtasks: todo.subtasks,
//     });
//   } catch (error) {
//     console.error("Lỗi thêm subtask:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // === TOGGLE SUBTASK ===
// exports.toggleSubtask = async (req, res) => {
//   try {
//     const { id, subtaskId } = req.params;

//     const todo = await Todo.findById(id);
//     if (!todo) {
//       return res.status(404).json({
//         success: false,
//         message: "Todo không tồn tại",
//       });
//     }

//     if (!todo.createdBy.equals(req.user.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: "Không có quyền thao tác todo này",
//       });
//     }

//     const subtask = todo.subtasks.id(subtaskId);
//     if (!subtask) {
//       return res.status(404).json({
//         success: false,
//         message: "Subtask không tồn tại",
//       });
//     }

//     subtask.completed = !subtask.completed;
//     subtask.completedAt = subtask.completed ? new Date() : undefined;

//     await todo.save();

//     return res.status(200).json({
//       success: true,
//       message: `Subtask ${
//         subtask.completed ? "hoàn thành" : "chưa hoàn thành"
//       }`,
//       subtasks: todo.subtasks,
//       progress: todo.progress,
//     });
//   } catch (error) {
//     console.error("Lỗi toggle subtask:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// exports.getTodoById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const todo = await Todo.findById(id);
//     if (!todo) {
//       console.log("Ko có todo id: " + id + " này");
//       return res.status(400).json({
//         success: false,
//         message: "Todo không tồn tại",
//       });
//     }

//     if (!todo.createdBy.equals(req.user.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: "Không có quyền thao tác todo này",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Xem chi tiết thành công",
//       todo,
//     });
//   } catch (error) {
//     console.error("Lỗi ko xem đc chi tiết:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// controllers/todoController.js
const Todo = require("../models/Todo");

// === LẤY TẤT CẢ TODOS VỚI FILTER ===
exports.getTodos = async (req, res) => {
  try {
    const {
      status,
      priority,
      hasCalendarEvent,
      type,
      sortBy = "createdAt",
      limit = 20,
      page = 1,
    } = req.query;

    const filters = { createdBy: req.user.userId };

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (hasCalendarEvent !== undefined)
      filters.hasCalendarEvent = hasCalendarEvent === "true";
    if (type) filters.type = type;

    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    const todos = await Todo.find(filters)
      .populate("createdBy", "username fullName profile.avatar")
      .populate("attendees", "username fullName profile.avatar")
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Todo.countDocuments(filters);

    return res.status(200).json({
      success: true,
      todos,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy todos:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === LẤY SỰ KIỆN LỊCH ===
exports.getCalendarEvents = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tham số start và end",
      });
    }

    const events = await Todo.find({
      createdBy: req.user.userId,
      hasCalendarEvent: true,
      $or: [
        { start: { $gte: new Date(start), $lte: new Date(end) } },
        { end: { $gte: new Date(start), $lte: new Date(end) } },
        { start: { $lte: new Date(start) }, end: { $gte: new Date(end) } },
      ],
    })
      .populate("createdBy", "username fullName profile.avatar")
      .populate("attendees", "username fullName profile.avatar")
      .sort({ start: 1 });

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Lỗi lấy sự kiện lịch:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === TẠO TODO MỚI ===
exports.createTodo = async (req, res) => {
  try {
    const {
      title,
      description,
      start,
      end,
      type = "Task",
      color,
      location,
      attendees = [],
      isAllDay = false,
      reminder,
      priority = "medium",
      dueDate,
      tags = [],
      isImportant = false,
      estimatedTime,
      category,
      subtasks = [],
    } = req.body;

    const hasCalendarEvent = !!(start && end);

    const todoData = {
      title,
      description,
      createdBy: req.user.userId,
      type,
      color,
      location,
      attendees,
      isAllDay,
      reminder: reminder ? new Date(reminder) : undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim()),
      isImportant,
      category,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      hasCalendarEvent,
    };

    // Thêm calendar fields nếu có
    if (hasCalendarEvent) {
      todoData.start = new Date(start);
      todoData.end = new Date(end);
    }

    // Xử lý estimatedTime
    if (estimatedTime) {
      if (typeof estimatedTime === "object") {
        todoData.estimatedTime = estimatedTime;
      } else if (typeof estimatedTime === "string") {
        try {
          todoData.estimatedTime = JSON.parse(estimatedTime);
        } catch {
          // Giữ nguyên default
        }
      }
    }

    const newTodo = new Todo(todoData);
    await newTodo.save();

    // Populate thông tin user
    await newTodo.populate("createdBy", "username fullName profile.avatar");
    await newTodo.populate("attendees", "username fullName profile.avatar");

    return res.status(201).json({
      success: true,
      message: "Tạo todo thành công",
      todo: newTodo,
    });
  } catch (error) {
    console.error("Lỗi tạo todo:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === CẬP NHẬT TODO ===
exports.updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    // Kiểm tra quyền sở hữu
    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền chỉnh sửa todo này",
      });
    }

    // Xử lý datetime fields
    if (updateData.start) updateData.start = new Date(updateData.start);
    if (updateData.end) updateData.end = new Date(updateData.end);
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
    if (updateData.reminder)
      updateData.reminder = new Date(updateData.reminder);

    // Xử lý mảng
    if (updateData.tags && typeof updateData.tags === "string") {
      updateData.tags = updateData.tags.split(",").map((tag) => tag.trim());
    }

    if (updateData.subtasks && typeof updateData.subtasks === "string") {
      try {
        updateData.subtasks = JSON.parse(updateData.subtasks);
      } catch {
        updateData.subtasks = [];
      }
    }

    // Cập nhật hasCalendarEvent
    if (updateData.start && updateData.end) {
      updateData.hasCalendarEvent = true;
    } else if (updateData.start === null && updateData.end === null) {
      updateData.hasCalendarEvent = false;
    }

    const colorMap = {
      Meeting: "#3788d8",
      BusinessTravel: "#28a745",
      PersonalWork: "#ffc107",
      TeamProject: "#dc3545",
      Appointment: "#804ae5ff",
      Task: "#04dbfcff",
      Other: "#6e7072ff",
    };

    // Nếu client gửi type (thay đổi), set color tương ứng
    if (updateData.type) {
      if (colorMap[updateData.type]) {
        updateData.color = colorMap[updateData.type];
      }
    }

    const updatedTodo = await Todo.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "username fullName profile.avatar")
      .populate("attendees", "username fullName profile.avatar");

    await updatedTodo.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật todo thành công",
      todo: updatedTodo,
    });
  } catch (error) {
    console.error("Lỗi cập nhật todo:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === XÓA TODO ===
exports.deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xóa todo này",
      });
    }

    await Todo.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa todo thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa todo:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === ĐÁNH DẤU HOÀN THÀNH ===
exports.markComplete = async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thao tác todo này",
      });
    }

    // Logic markComplete từ Model
    todo.status = "done";
    todo.completedAt = new Date();
    todo.subtasks.forEach((st) => {
      st.completed = true;
      st.completedAt = new Date();
    });

    const updatedTodo = await todo.save();
    await updatedTodo.populate("createdBy", "username fullName profile.avatar");
    await updatedTodo.populate("attendees", "username fullName profile.avatar");

    return res.status(200).json({
      success: true,
      message: "Đánh dấu hoàn thành thành công",
      todo: updatedTodo,
    });
  } catch (error) {
    console.error("Lỗi đánh dấu hoàn thành:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === THÊM VÀO LỊCH ===
exports.addToCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, location, attendees, isAllDay } = req.body;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thao tác todo này",
      });
    }

    // Logic addToCalendar từ Model
    todo.hasCalendarEvent = true;
    todo.start = new Date(start);
    todo.end = new Date(end);
    todo.location = location;
    todo.attendees = attendees || [];
    todo.isAllDay = isAllDay || false;

    const updatedTodo = await todo.save();
    await updatedTodo.populate("createdBy", "username fullName profile.avatar");
    await updatedTodo.populate("attendees", "username fullName profile.avatar");

    return res.status(200).json({
      success: true,
      message: "Thêm vào lịch thành công",
      todo: updatedTodo,
    });
  } catch (error) {
    console.error("Lỗi thêm vào lịch:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === XÓA KHỎI LỊCH ===
exports.removeFromCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thao tác todo này",
      });
    }

    // Logic removeFromCalendar từ Model
    todo.hasCalendarEvent = false;
    todo.start = undefined;
    todo.end = undefined;
    todo.location = undefined;
    todo.isAllDay = false;
    todo.attendees = [];

    const updatedTodo = await todo.save();
    await updatedTodo.populate("createdBy", "username fullName profile.avatar");
    await updatedTodo.populate("attendees", "username fullName profile.avatar");

    return res.status(200).json({
      success: true,
      message: "Xóa khỏi lịch thành công",
      todo: updatedTodo,
    });
  } catch (error) {
    console.error("Lỗi xóa khỏi lịch:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === THÊM SUBTASK ===
exports.addSubtask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề subtask là bắt buộc",
      });
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thao tác todo này",
      });
    }

    const newSubtask = {
      title,
      completed: false,
    };

    todo.subtasks.push(newSubtask);
    await todo.save();

    return res.status(200).json({
      success: true,
      message: "Thêm subtask thành công",
      subtasks: todo.subtasks,
    });
  } catch (error) {
    console.error("Lỗi thêm subtask:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === TOGGLE SUBTASK ===
exports.toggleSubtask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thao tác todo này",
      });
    }

    const subtask = todo.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: "Subtask không tồn tại",
      });
    }

    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : undefined;

    await todo.save();

    return res.status(200).json({
      success: true,
      message: `Subtask ${
        subtask.completed ? "hoàn thành" : "chưa hoàn thành"
      }`,
      subtasks: todo.subtasks,
      progress: todo.progress,
    });
  } catch (error) {
    console.error("Lỗi toggle subtask:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === LẤY TODO THEO ID ===
exports.getTodoById = async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findById(id)
      .populate("createdBy", "username fullName profile.avatar")
      .populate("attendees", "username fullName profile.avatar");

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thao tác todo này",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xem chi tiết thành công",
      todo,
    });
  } catch (error) {
    console.error("Lỗi xem chi tiết:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === XÓA SUBTASK ===
exports.deleteSubtask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thao tác todo này",
      });
    }

    const subtask = todo.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: "Subtask không tồn tại",
      });
    }

    // Xóa subtask
    todo.subtasks.pull(subtaskId);
    await todo.save();

    return res.status(200).json({
      success: true,
      message: "Xóa subtask thành công",
      subtasks: todo.subtasks,
      progress: todo.progress,
    });
  } catch (error) {
    console.error("Lỗi xóa subtask:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === XÓA TẤT CẢ SUBTASKS ===
exports.deleteAllSubtasks = async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    if (!todo.createdBy.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thao tác todo này",
      });
    }

    // Xóa tất cả subtasks
    todo.subtasks = [];
    await todo.save();

    return res.status(200).json({
      success: true,
      message: "Xóa tất cả subtasks thành công",
      subtasks: todo.subtasks,
      progress: todo.progress,
    });
  } catch (error) {
    console.error("Lỗi xóa tất cả subtasks:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === LẤY CÔNG VIỆC HÔM NAY ===
exports.getTodayTodos = async (req, res) => {
  try {
    const {
      priority,
      type,
      sortBy = "dueDate",
      limit = 50,
      page = 1,
    } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filters = {
      createdBy: req.user.userId,
      // dueDate: {
      //   $gte: today,
      //   $lt: tomorrow,
      // },
    };

    // thêm bắt đầu và kết thuc nwuax
    filters.$or = [
      {
        start: { $lte: tomorrow },
        end: { $gte: today },
      },
      {
        // fallback: nếu chỉ có dueDate thì kiểm tra dueDate trong ngày
        // dueDate: { $gte: today, $lt: tomorrow },
      },
    ];

    if (priority) filters.priority = priority;
    if (type) filters.type = type;

    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    const todos = await Todo.find(filters)
      .populate("createdBy", "username fullName profile.avatar")
      .populate("attendees", "username fullName profile.avatar")
      .sort({ status: -1, [sortBy]: 1, priority: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Todo.countDocuments(filters);

    // Tính thống kê
    const stats = {
      total,
      completed: await Todo.countDocuments({ ...filters, status: "done" }),
      inProgress: await Todo.countDocuments({
        ...filters,
        status: "in-progress",
      }),
      scheduled: await Todo.countDocuments({ ...filters, status: "scheduled" }),
      overdue: await Todo.countDocuments({
        ...filters,
        dueDate: { $lt: new Date() },
        status: { $ne: "done" },
      }),
      highPriority: await Todo.countDocuments({ ...filters, priority: "high" }),
    };

    return res.status(200).json({
      success: true,
      todos,
      stats,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy công việc hôm nay:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === LẤY THỐNG KÊ CÔNG VIỆC ===
exports.getTodoStats = async (req, res) => {
  try {
    const { period = "today" } = req.query;
    const userId = req.user.userId;

    const now = new Date();

    let startDate, endDate;

    switch (period) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1); // start of next day (exclusive)
        break;

      case "week":
        // last 7 full days ending today (inclusive of today)
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 6); // 7 days: today and 6 previous
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7); // start of next period
        break;

      case "month":
        // start at first day of this month 00:00:00
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        // end = start of next month (exclusive)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;

      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }

    // Debug log (remove in production)
    // console.log("getTodoStats period:", period, {
    //   startDate: startDate.toISOString(),
    //   endDate: endDate.toISOString(),
    //   now: now.toISOString(),
    //   userId,
    // });

    const baseFilter = {
      createdBy: userId,
      dueDate: { $gte: startDate, $lt: endDate },
    };

    const stats = {
      period,
      total: await Todo.countDocuments(baseFilter),
      completed: await Todo.countDocuments({ ...baseFilter, status: "done" }),
      inProgress: await Todo.countDocuments({
        ...baseFilter,
        status: "in-progress",
      }),
      scheduled: await Todo.countDocuments({
        ...baseFilter,
        status: "scheduled",
      }),
      cancelled: await Todo.countDocuments({
        ...baseFilter,
        status: "cancelled",
      }),

      // overdue: nếu bạn muốn "overdue trong period" -> dùng {...baseFilter, dueDate: {$lt: now}, status: {$ne: 'done'}}
      // nếu bạn muốn "tổng overdue up-to-now" (bất kể period) -> không spread baseFilter's dueDate range
      overdue: await Todo.countDocuments({
        createdBy: userId,
        dueDate: { $lt: now },
        status: { $ne: "done" },
      }),

      highPriority: await Todo.countDocuments({
        ...baseFilter,
        priority: "high",
      }),
      withCalendar: await Todo.countDocuments({
        ...baseFilter,
        hasCalendarEvent: true,
      }),
      byType: await Todo.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      byPriority: await Todo.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
    };

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === LẤY CÔNG VIỆC SẮP TỚI ===
exports.getUpcomingTodos = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const userId = req.user.userId;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(days));

    const filters = {
      createdBy: userId,
      dueDate: {
        $gte: startDate,
        $lt: endDate,
      },
      status: { $ne: "done" },
    };

    const todos = await Todo.find(filters)
      .populate("createdBy", "username fullName profile.avatar")
      .populate("attendees", "username fullName profile.avatar")
      .sort({ dueDate: 1, priority: -1 })
      .limit(50);

    // Nhóm theo ngày
    const todosByDate = todos.reduce((acc, todo) => {
      const dateKey = todo.dueDate.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(todo);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      todos,
      todosByDate,
      period: {
        start: startDate,
        end: endDate,
        days: parseInt(days),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy công việc sắp tới:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// === LẤY CÔNG VIỆC QUAN TRỌNG ===
exports.getImportantTodos = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const userId = req.user.userId;

    const filters = {
      createdBy: userId,
      isImportant: true,
      status: { $ne: "done" },
    };

    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    const todos = await Todo.find(filters)
      .populate("createdBy", "username fullName profile.avatar")
      .populate("attendees", "username fullName profile.avatar")
      .sort({ dueDate: 1, priority: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Todo.countDocuments(filters);

    return res.status(200).json({
      success: true,
      todos,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy công việc quan trọng:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
