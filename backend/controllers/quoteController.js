const Quote = require("../models/Quote");

// Lấy tất cả các câu trích dẫn : [GET] api/quote/
const index = async (req, res) => {
  try {
    const quotes = await Quote.find(); // cần await
    res.status(200).json({
      success: true,
      message: "Lấy câu trích dẫn thành công",
      data: quotes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lấy câu trích dẫn thất bại",
      error: error.message,
    });
  }
};

// Tạo câu trích dẫn mới : [POST] api/quote/create
const createQuote = async (req, res) => {
  const { content, author, active } = req.body;
  try {
    const newQuote = new Quote({ content, author, active });
    await newQuote.save();
    res.status(201).json({
      success: true,
      message: "Tạo câu trích dẫn thành công",
      data: newQuote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Tạo câu trích dẫn thất bại",
      error: error.message,
    });
  }
};

// Xoá câu trích dẫn : [DELETE] api/quote/:id
const deleteQuote = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedQuote = await Quote.findByIdAndDelete(id);
    if (!deletedQuote) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy câu trích dẫn",
      });
    }
    res.status(200).json({
      success: true,
      message: "Xoá câu trích dẫn thành công",
      data: deletedQuote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Xoá câu trích dẫn thất bại",
      error: error.message,
    });
  }
};

// Cập nhật câu trích dẫn [PUT] api/quote/:id
const updateQuote = async (req, res) => {
  const { id } = req.params;
  const { content, author, active } = req.body;
  try {
    const updatedQuote = await Quote.findByIdAndUpdate(
      id,
      { content, author, active },
      { new: true }
    );
    if (!updatedQuote) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy câu trích dẫn",
      });
    }
    res.status(200).json({
      success: true,
      message: "Cập nhật câu trích dẫn thành công",
      data: updatedQuote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cập nhật câu trích dẫn thất bại",
      error: error.message,
    });
  }
};

// Lấy câu trích dẫn ngẫu nhiên [GET] api/quote/random
const randomQuote = async (req, res) => {
  try {
    const count = await Quote.countDocuments({ active: true });
    if (count === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có câu trích dẫn nào",
      });
    }
    const randomIndex = Math.floor(Math.random() * count);
    const randomQuote = await Quote.findOne({ active: true }).skip(randomIndex);

    res.status(200).json({
      success: true,
      message: "Lấy câu trích dẫn ngẫu nhiên thành công",
      data: randomQuote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lấy câu trích dẫn ngẫu nhiên thất bại",
      error: error.message,
    });
  }
};

// Lấy câu trích dẫn theo ID [GET] api/quote/:id
const detailQuote = async (req, res) => {
  const { id } = req.params;
  try {
    const quote = await Quote.findById(id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy câu trích dẫn",
      });
    }
    res.status(200).json({
      success: true,
      message: "Lấy câu trích dẫn thành công",
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lấy câu trích dẫn thất bại",
      error: error.message,
    });
  }
};

// Cập nhật trạng thái kích hoạt [PATCH] api/quote/:id/activate
const activateQuote = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    const updatedQuote = await Quote.findByIdAndUpdate(
      id,
      { active },
      { new: true }
    );
    if (!updatedQuote) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy câu trích dẫn",
      });
    }
    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái câu trích dẫn thành công",
      data: updatedQuote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cập nhật trạng thái câu trích dẫn thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  index,
  createQuote,
  deleteQuote,
  updateQuote,
  randomQuote,
  detailQuote,
  activateQuote,
};
