const express = require('express');
const multer = require('multer');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const axios = require('axios');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const session = require('express-session');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/v1/chat/completions';

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  const idToken = req.headers.authorization;
  if (!idToken) {
    return res.status(403).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// File upload endpoint (protected)
app.post('/upload', verifyFirebaseToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

// Image capture endpoint (protected, placeholder)
app.post('/capture', verifyFirebaseToken, (req, res) => {
  res.json({ message: 'Image captured successfully' });
});

// AI interaction endpoint (protected)
app.post('/ask', verifyFirebaseToken, async (req, res) => {
  const { question } = req.body;
  try {
    const response = await axios.post(GROQ_API_URL, {
      messages: [{ role: "user", content: question }],
      model: "llama3-groq-70b-8192-tool-use-preview",
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    res.json({ answer: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error calling Groq API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error processing your request' });
  }
});

// Generate answer endpoint (protected)
app.post('/generate-answer', verifyFirebaseToken, async (req, res) => {
  const { subject, level, question } = req.body;
  try {
    // Process the request and generate an answer
    const answer = await getAnswer(subject, level, question);
    res.json({ answer });
  } catch (error) {
    console.error('Error generating answer:', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
});

async function getAnswer(subject, level, question) {
  // Implement the logic to generate an answer based on the subject, level, and question
  // For now, just return a placeholder answer
  return 'This is a placeholder answer';
}

// WebSocket connection for real-time chat
wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    // Process message and get AI response
    const response = await getAIResponse(message);
    ws.send(JSON.stringify(response));
  });
});

async function getAIResponse(message) {
  try {
    const response = await axios.post(GROQ_API_URL, {
      messages: [{ role: "user", content: message }],
      model: "llama3-groq-70b-8192-tool-use-preview",
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return { type: 'ai', content: response.data.choices[0].message.content };
  } catch (error) {
    console.error('Error calling Groq API:', error.response ? error.response.data : error.message);
    return { type: 'error', content: 'Error processing your request' };
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});