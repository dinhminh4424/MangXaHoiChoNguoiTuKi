// routes/todoRoutes.js
const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const auth = require("../middleware/auth");

// Tất cả routes đều cần authentication

router.use(auth);

// CRUD routes
router.get("/", todoController.getTodos);
router.get("/calendar-events", todoController.getCalendarEvents);
router.get("/:id", todoController.getTodoById);
router.post("/", todoController.createTodo);
router.put("/:id", todoController.updateTodo);

// Action routes
router.put("/:id/complete", todoController.markComplete);
router.put("/:id/add-to-calendar", todoController.addToCalendar);
router.put("/:id/remove-from-calendar", todoController.removeFromCalendar);

// Subtask routes
router.post("/:id/subtasks", todoController.addSubtask);
router.put("/:id/subtasks/:subtaskId/toggle", todoController.toggleSubtask);

router.delete("/:id/subtasks/:subtaskId", todoController.deleteSubtask); // THÊM XÓA SUBTASK
router.delete("/:id/subtasks", todoController.deleteAllSubtasks); // THÊM XÓA TẤT CẢ SUBTASKS
router.delete("/:id", todoController.deleteTodo);

router.get("/today/todos", todoController.getTodayTodos); // Công việc hôm nay
router.get("/stats/overview", todoController.getTodoStats); // Thống kê
router.get("/upcoming/todos", todoController.getUpcomingTodos); // Công việc sắp tới
router.get("/important/todos", todoController.getImportantTodos); // Công việc quan trọng

module.exports = router;
