// backend/routes/quiz.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const File = require('../models/File');
const router = express.Router();

// Ensure dotenv is loaded
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not set in .env");
}

// POST /api/quiz/generate-from-file/:fileId
router.post('/generate-from-file/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { numQuestions = 5, quizTypes = [] } = req.body;

    console.log(`Generating quiz for file ${fileId} with ${numQuestions} questions.`);

    // Fetch file content
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file || !file.extractedText) {
      return res.status(404).json({ message: 'File not found or no extracted text.' });
    }

    // Limit text length to avoid API issues
    const materialText = file.extractedText.substring(0, 15000);

    // Construct prompt
    const prompt = `
Generate ${numQuestions} quiz questions from the following study material:
---
${materialText}
---
Include ${quizTypes.length > 0 ? quizTypes.join(", ") : "various"} question types.
Format the response *only* as a valid JSON array of objects, starting with [ and ending with ].
Each object must have:
- "question": string
- "type": string ("Multiple Choice", "Identification", "True or False")
- "options": array (only for Multiple Choice)
- "answer": string
`;

    // Call Google Gemini API directly
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error("AI API Error:", errorBody);
      return res.status(500).json({ message: 'Failed to get a valid response from the AI model.' });
    }

    const apiResult = await apiResponse.json();
    const aiText = apiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return res.status(500).json({ message: 'The AI returned an empty or invalid response.' });
    }

    // Clean and parse JSON
    let questions = [];
    try {
      const cleanedJson = aiText.replace(/```json|```/g, '').trim();
      questions = JSON.parse(cleanedJson);
    } catch (err) {
      console.error("Error parsing AI JSON:", err);
      return res.status(500).json({ message: 'Failed to parse quiz questions from AI response.', raw: aiText });
    }

    // Send back to frontend
    res.status(200).json({ questions, quizTitle: `Quiz for ${file.originalName}` });

  } catch (err) {
    console.error('Server error in /generate-from-file:', err);
    res.status(500).json({ message: 'Server error generating quiz.', error: err.message });
  }
});

module.exports = router;
