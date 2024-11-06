const express = require('express');
const axios = require('axios');
const fs = require('fs');
const math = require('mathjs');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');


const API_URL = 'https://demo.api4ai.cloud/ocr/v1/results?algo=simple-words';
const ID_MARK = '4d.DLN';
const FAMILY_MARK = '1.FAMILY';
const NAME_MARK = '2.GIVEN';
const EXPIRATION_MARK = '4b.EXP';

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Function to find the text below a specific word
const findTextBelow = (words, wordInfo) => {
  const x = wordInfo.box[0];
  const y = wordInfo.box[1];
  let candidate = words[0];
  let candidateDist = Infinity;

  words.forEach(elem => {
    if (elem.text === wordInfo.text) return;

    const currBoxX = elem.box[0];
    const currBoxY = elem.box[1];
    const currVertDist = currBoxY - y;
    const currHorizDist = x - currBoxX;

    if (currVertDist > 0) { // Looking for items below
      const dist = math.hypot(currVertDist, currHorizDist);
      if (dist < candidateDist) {
        candidateDist = dist;
        candidate = elem;
      }
    }
  });

  return candidate;
};

// Route to handle image upload and OCR processing
app.post('/upload', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;  // Access the uploaded file path

  // Prepare form data for OCR API request
  const formData = new FormData();
  formData.append('image', fs.createReadStream(imagePath));

  try {
    // Call the OCR API
    const response = await axios.post(API_URL, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    const jsonObj = response.data;
    const words = [];

    // Collect word data from the response
    jsonObj.results[0].entities[0].objects.forEach(elem => {
      const box = elem.box;
      const text = elem.entities[0].text;
      words.push({ box, text });
    });

    // Initialize variables for required data
    let idMarkInfo = null;
    let famMarkInfo = null;
    let nameMarkInfo = null;
    let expirationMarkInfo = null;

    // Find matching words for specific marks
    words.forEach(elem => {
      if (elem.text === ID_MARK) {
        idMarkInfo = elem;
      } else if (elem.text === FAMILY_MARK) {
        famMarkInfo = elem;
      } else if (elem.text === NAME_MARK) {
        nameMarkInfo = elem;
      } else if (elem.text === EXPIRATION_MARK) {
        expirationMarkInfo = elem;
      }
    });

    // Extract the relevant data
    const documentNumber = idMarkInfo ? findTextBelow(words, idMarkInfo).text : "N/A";
    const familyName = famMarkInfo ? findTextBelow(words, famMarkInfo).text : "N/A";
    const givenName = nameMarkInfo ? findTextBelow(words, nameMarkInfo).text : "N/A";
    const expirationDate = expirationMarkInfo ? findTextBelow(words, expirationMarkInfo).text : "N/A";

    const fullName = `${givenName} ${familyName}`;

    // Delete the uploaded file after processing
    fs.unlinkSync(imagePath);

    // Return the extracted information
    res.json({
      name: fullName,
      documentNumber: documentNumber,
      expirationDate: expirationDate
    });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
