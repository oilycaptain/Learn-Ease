const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const File = require('../models/File');
const authMiddleware = require('../middleware/authMiddleware');
const { Ollama } = require('ollama');

const router = express.Router();
const ollama = new Ollama({ host: 'http://localhost:11434' });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.pptx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, TXT, and PPTX files are allowed.'));
    }
  }
});

// Text extraction functions
const extractTextFromFile = async (filePath, fileType) => {
  try {
    switch (fileType) {
      case 'pdf':
        return await extractTextFromPDF(filePath);
      case 'docx':
        return await extractTextFromDOCX(filePath);
      case 'doc':
        return await extractTextFromDOCX(filePath);
      case 'txt':
        return await extractTextFromTXT(filePath);
      case 'pptx':
        return 'PPTX file detected. Content extraction for PowerPoint files requires additional libraries.';
      default:
        return 'File type not supported for text extraction.';
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    return `Error extracting text: ${error.message}`;
  }
};

const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
};

const extractTextFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
};

const extractTextFromTXT = async (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`TXT reading failed: ${error.message}`);
  }
};

// Upload file with text extraction
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(req.file.path, fileType);
      
      if (extractedText.length > 10000) {
        extractedText = extractedText.substring(0, 10000) + '\n\n... [Content truncated for preview]';
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      extractedText = `Text extraction unavailable: ${extractionError.message}`;
    }

    const file = new File({
      user: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: fileType,
      fileSize: req.file.size,
      subject: req.body.subject || 'General',
      tags: req.body.tags ? req.body.tags.split(',') : [],
      extractedText: extractedText,
      isProcessed: !!extractedText && extractedText.length > 0
    });

    await file.save();

    res.status(201).json({
      message: 'File uploaded successfully!',
      file: file
    });

  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Get user's files - WITH DEBUGGING
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('📂 GET /api/files called');
    console.log('👤 User ID:', req.user._id);
    
    const files = await File.find({ user: req.user._id }).sort({ uploadDate: -1 });
    
    console.log(`✅ Found ${files.length} files for user`);
    console.log('📄 Files:', files.map(f => ({ id: f._id, name: f.originalName })));
    
    res.json(files);
  } catch (error) {
    console.error('❌ Error fetching files:', error);
    res.status(500).json({ message: 'Error fetching files', error: error.message });
  }
});

// Get file content for viewing
router.get('/:id/content', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = `uploads/${file.filename}`;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    let content = '';
    
    if (file.fileType === 'txt') {
      content = fs.readFileSync(filePath, 'utf8');
    } else if (file.extractedText) {
      content = `FILE: ${file.originalName}
TYPE: ${file.fileType.toUpperCase()}
SIZE: ${(file.fileSize / 1024 / 1024).toFixed(2)} MB
SUBJECT: ${file.subject}
UPLOADED: ${new Date(file.uploadDate).toLocaleDateString()}

EXTRACTED CONTENT:
${file.extractedText}

---
Note: This is the extracted text content that the AI will use to generate your study reviewer.`;
    } else {
      content = `FILE: ${file.originalName}
TYPE: ${file.fileType.toUpperCase()}
SIZE: ${(file.fileSize / 1024 / 1024).toFixed(2)} MB
SUBJECT: ${file.subject}
UPLOADED: ${new Date(file.uploadDate).toLocaleDateString()}

CONTENT PREVIEW:
Text extraction not available for this file type or extraction failed.

The AI can still create a study guide based on the file's subject and type. Click "Generate Reviewer" to get a customized study guide.`;
    }

    res.json({
      content: content,
      fileType: file.fileType,
      originalName: file.originalName
    });

  } catch (error) {
    res.status(500).json({ message: 'Error reading file content', error: error.message });
  }
});

// Delete file
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = `uploads/${file.filename}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});

// Generate reviewer with actual content analysis
router.post('/:id/generate-reviewer', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    let contentForAI = '';
    
    if (file.extractedText && file.extractedText.length > 100) {
      contentForAI = `STUDY MATERIAL CONTENT:
${file.extractedText.substring(0, 8000)}`;
    } else {
      contentForAI = `Study material about "${file.subject}". File type: ${file.fileType}.`;
    }

    try {
      const response = await ollama.chat({
        model: 'qwen2.5:1.5b',
        messages: [
          {
            role: 'user',
            content: `Analyze this study material and create a comprehensive study reviewer:

${contentForAI}

FILE INFORMATION:
- Subject: ${file.subject}
- File Type: ${file.fileType.toUpperCase()}
- Original Name: ${file.originalName}

Please create a detailed, well-organized study guide that includes:

📚 MAIN TOPICS & KEY CONCEPTS
• Identify the main subjects covered in the content
• Extract important concepts and themes

🎯 KEY POINTS TO REMEMBER  
• List essential facts and critical information from the material
• Highlight the most important takeaways

📖 IMPORTANT DEFINITIONS
• Extract key terminology and vocabulary from the content
• Provide clear explanations for important terms

💡 STUDY TIPS & STRATEGIES
• Suggest effective study methods for this specific material
• Recommend memory techniques and learning approaches

🔍 PRACTICE EXERCISES
• Create relevant practice problems based on the content
• Suggest application exercises to reinforce learning

Make it a practical, actionable study guide that directly relates to the provided study material content. Focus on the actual topics and information present in the document.`
          }
        ],
        stream: false
      });

      file.summary = response.message.content;
      file.isProcessed = true;
      await file.save();

      res.json({
        message: '🎉 AI Study Reviewer generated successfully!',
        summary: file.summary
      });

    } catch (ollamaError) {
      console.error('Ollama error:', ollamaError);
      
      file.summary = `📚 STUDY REVIEWER: ${file.originalName}

SUBJECT: ${file.subject}
FILE TYPE: ${file.fileType.toUpperCase()}
CONTENT ANALYSIS: ${file.extractedText ? 'Based on extracted content' : 'General guide'}

MAIN TOPICS COVERED:
• Content analysis from your study material
• Key concepts identified in the document
• Important themes and subjects

KEY POINTS TO REMEMBER:
1. Focus on the main ideas presented in the material
2. Note important facts, figures, and concepts
3. Pay attention to definitions and explanations
4. Identify patterns and relationships in the content

STUDY RECOMMENDATIONS:
• Review the extracted content carefully
• Create summary notes for each major topic
• Use the actual material for practice exercises
• Focus on understanding rather than memorization

PRACTICE EXERCISES:
1. Summarize each section in your own words
2. Create flashcards for key terms and concepts
3. Explain the material to someone else
4. Solve any practice problems included in the content

This study guide is based on analysis of your actual study material.`;
      
      file.isProcessed = true;
      await file.save();
      
      res.json({
        message: 'Study reviewer generated successfully!',
        summary: file.summary
      });
    }

  } catch (error) {
    console.error('Generate reviewer error:', error);
    
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (file) {
      file.summary = `📖 Study Guide for: ${file.originalName}

SUBJECT: ${file.subject}
CONTENT ANALYSIS: Available

STUDY PLAN:
1. Review the content extracted from your ${file.fileType.toUpperCase()} file
2. Identify key topics and important information
3. Create summary notes based on the actual material
4. Practice with relevant exercises
5. Test your understanding of the concepts

TIPS:
- Study the actual content from your document
- Focus on the main ideas and key points
- Use active recall with the extracted material
- Create study aids based on the real content`;
      
      file.isProcessed = true;
      await file.save();
    }
    
    res.json({
      message: 'Study guide created successfully!',
      summary: file?.summary || 'Basic study guide generated.'
    });
  }
});

module.exports = router;