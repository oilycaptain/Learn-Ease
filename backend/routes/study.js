const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const StudyMaterial = require('../models/StudyMaterial');
const auth = require('../middleware/authMiddleware');
const ollamaHelper = require('../utils/ollamaHelper');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.md'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, DOC, DOCX, and MD files are allowed'));
    }
  }
});

// Helper function to extract text from different file types
const extractTextFromFile = async (filePath, fileExt) => {
  try {
    if (fileExt === '.txt' || fileExt === '.md') {
      return fs.readFileSync(filePath, 'utf8');
    } 
    else if (fileExt === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    else if (fileExt === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    }
    else {
      return `File type ${fileExt} uploaded. Please note: Full text extraction may not be available for this file type.`;
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from ${fileExt} file: ${error.message}`);
  }
};

// Upload study material
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received:', req.file, req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let content = '';

    try {
      content = await extractTextFromFile(req.file.path, fileExt);
      
      // Limit content length to avoid token limits
      if (content.length > 10000) {
        content = content.substring(0, 10000) + '\n\n[Content truncated due to length limitations. For best results, use smaller files.]';
      }
      
      // Check if content is too minimal
      if (content.length < 50) {
        content = `File: ${req.file.originalname}\n\nNote: Very limited content extracted. For best AI reviewer results, please upload a .txt file with more substantial content.`;
      }
    } catch (extractionError) {
      console.error('Extraction failed:', extractionError);
      content = `File: ${req.file.originalname}\n\nNote: Could not fully extract text content. ${extractionError.message}\n\nRecommendation: Upload as a .txt file for best results.`;
    }

    const studyMaterial = new StudyMaterial({
      title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: fileExt,
      fileSize: req.file.size,
      content: content,
      userId: req.user.id
    });

    await studyMaterial.save();

    // Clean up uploaded file after processing
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Could not delete uploaded file:', cleanupError.message);
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      studyMaterial: studyMaterial
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not delete uploaded file on error:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to upload file: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all study materials for user
router.get('/materials', auth, async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(materials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch study materials' });
  }
});

// Get specific study material
router.get('/materials/:materialId', auth, async (req, res) => {
  try {
    const { materialId } = req.params;

    const studyMaterial = await StudyMaterial.findOne({
      _id: materialId,
      userId: req.user.id
    });

    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    res.json(studyMaterial);
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: 'Failed to fetch study material' });
  }
});

// Generate reviewer using AI
router.post('/generate-reviewer/:materialId', auth, async (req, res) => {
  try {
    const { materialId } = req.params;
    const { customInstructions, mode = 'enhanced' } = req.body;

    const studyMaterial = await StudyMaterial.findOne({
      _id: materialId,
      userId: req.user.id
    });

    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    // Check if content is sufficient for AI processing
    if (studyMaterial.content.length < 20) {
      return res.status(400).json({
        error: 'Insufficient content for AI review. Please upload a file with more content.'
      });
    }

    // Check if Ollama is available
    const isOllamaAvailable = await ollamaHelper.checkOllamaStatus();
    if (!isOllamaAvailable) {
      return res.status(503).json({ 
        error: 'Ollama service is not available. Please make sure Ollama is running with the qwen2.5:1.5b model.' 
      });
    }

    // Update material status
    studyMaterial.isProcessing = true;
    await studyMaterial.save();

    // Generate reviewer with selected mode
    const reviewerContent = await ollamaHelper.generateReviewer(
      studyMaterial.content,
      customInstructions,
      mode
    );

    // Update material with generated reviewer
    studyMaterial.generatedReviewer = reviewerContent;
    studyMaterial.isProcessing = false;
    await studyMaterial.save();

    res.json({
      message: 'Reviewer generated successfully',
      reviewer: reviewerContent,
      studyMaterial,
      modeUsed: mode
    });
  } catch (error) {
    console.error('Generate reviewer error:', error);
    
    // Update material status on error
    await StudyMaterial.findByIdAndUpdate(req.params.materialId, {
      isProcessing: false
    });

    res.status(500).json({ 
      error: error.message || 'Failed to generate reviewer' 
    });
  }
});

// Update study material
router.patch('/materials/:materialId', auth, async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title } = req.body;

    const studyMaterial = await StudyMaterial.findOneAndUpdate(
      { _id: materialId, userId: req.user.id },
      { title },
      { new: true }
    );

    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    res.json(studyMaterial);
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update study material' });
  }
});

// Delete study material
router.delete('/materials/:materialId', auth, async (req, res) => {
  try {
    const { materialId } = req.params;

    const studyMaterial = await StudyMaterial.findOneAndDelete({
      _id: materialId,
      userId: req.user.id
    });

    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    res.json({ message: 'Study material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete study material' });
  }
});

module.exports = router;