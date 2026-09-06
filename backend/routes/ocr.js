const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const { GoogleGenerativeAI } = require("@google/generative-ai")

const upload = multer({ dest: 'uploads/' })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  }
}

// POST /api/ocr/cccd - Advanced AI Extraction
router.post('/cccd', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    console.log('--- Scanning ID Card with Gemini AI (Pro Mode) ---')
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" })
    
    const prompt = `Extract info from this Vietnamese ID Card (CCCD). 
    Return ONLY a JSON object with THESE EXACT KEYS:
    {
      "ho_ten": "Full Name in UPPERCASE",
      "so_cccd": "12-digit ID number",
      "ngay_sinh": "Date of birth (YYYY-MM-DD)",
      "gioi_tinh": "Gender (Nam or Nữ)",
      "que_quan": "Place of origin",
      "dia_chi": "Place of residence"
    }
    IMPORTANT: If a field is not found, use "". Do not return markdown, just the JSON.`

    const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype)
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    let text = response.text()

    // Clean JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()
    console.log('Gemini Extracted Data:', text)

    const parsedData = JSON.parse(text)
    fs.unlinkSync(req.file.path)

    res.json({ success: true, data: parsedData })
  } catch (err) {
    console.error('OCR Error:', err)
    if (req.file) fs.unlinkSync(req.file.path)
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
