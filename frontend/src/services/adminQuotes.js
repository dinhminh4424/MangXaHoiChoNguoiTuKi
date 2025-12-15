// src/services/accountService.js
import api from "./api";
// Quote management services
export const getAllQuotes = async (filters) => {
  const params = new URLSearchParams(filters);
  return api.get(`/api/admin/quotes?${params}`);
};

export const getQuoteById = async (quoteId) => {
  return api.get(`/api/admin/quotes/${quoteId}`);
};

export const createQuote = async (quoteData) => {
  return api.post("/api/admin/quotes", quoteData);
};

export const updateQuote = async (quoteId, quoteData) => {
  return api.put(`/api/admin/quotes/${quoteId}`, quoteData);
};

export const deleteQuote = async (quoteId) => {
  return api.delete(`/api/admin/quotes/${quoteId}`);
};

export const toggleQuoteStatus = async (quoteId) => {
  return api.put(`/api/admin/quotes/${quoteId}/toggle`);
};

// Public function for frontend
export const getRandomQuote = async () => {
  return api.get("/api/admin/quotes/random");
};
