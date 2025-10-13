const express = require("express");

const router = express.Router();
const {
  index,
  createQuote,
  deleteQuote,
  updateQuote,
  randomQuote,
  detailQuote,
  activateQuote,
} = require("../controllers/quoteController");

// Tạo câu trích dẫn mới
router.post("/create", createQuote);

// Lấy câu trích dẫn ngẫu nhiên
router.get("/random", randomQuote);

// Cập nhật trạng thái kích hoạt của câu trích dẫn
router.patch("/:id/activate", activateQuote);

// Lấy câu trích dẫn theo ID
router.get("/:id", detailQuote);
// Cập nhật câu trích dẫn
router.put("/:id", updateQuote);
// Xoá câu trích dẫn
router.delete("/:id", deleteQuote);

// Lấy tất cả các câu trích dẫn
router.get("/", index);

module.exports = router;
