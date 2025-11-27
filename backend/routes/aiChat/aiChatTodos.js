// routes/aiChat.routes.js

const express = require("express");
const router = express.Router();
const todoController = require("../../controllers/todoController");

const auth = require("../../middleware/auth");

// POST /api/ai-chat/todos
router.post("/", todoController.createTodoAI);

// GET /api/ai-chat/todos/:id
router.get("/:id", auth, todoController.getTodoById);

// GET /api/ai-chat/todos
router.get("/", auth, todoController.getTodos);

// PATCH /api/ai-chat/todos/:id
router.patch("/:id", auth, todoController.updateTodo);

// DELETE /api/ai-chat/todos/:id
router.delete("/:id", auth, todoController.deleteTodo);

module.exports = router;
