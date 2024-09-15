import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { ChevronDown, Computer, Globe, MessageSquare, Calculator, TestTube, Camera, Edit, ArrowRight, Moon, Sun } from 'lucide-react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, auth } from './firebaseConfig-ts';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: string;
  subject: string;
  level: string;
  question: string;
  answer: string;
  summary: string;
}

const SubjectIcon: React.FC<{ subject: string }> = ({ subject }) => {
  switch (subject) {
    case 'Computer Science': return <Computer size={18} />;
    case 'History': return <Globe size={18} />;
    case 'Language': return <MessageSquare size={18} />;
    case 'Math': return <Calculator size={18} />;
    case 'Science': return <TestTube size={18} />;
    default: return null;
  }
};

const HomeworkAIApp: React.FC = () => {
  const [subject, setSubject] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isEditingExtractedText, setIsEditingExtractedText] = useState<boolean>(false);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [isSignInPage, setIsSignInPage] = useState<boolean>(!user);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [pastQuestions, setPastQuestions] = useState<Question[]>([]);

  const subjects = ['Computer Science', 'History', 'Language', 'Math', 'Science'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  const WORD_LIMIT = 1000;
  const MAX_UPLOADS = 5;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsSignInPage(!user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch past questions from the server
      fetchPastQuestions();
    }
  }, [user]);

  const fetchPastQuestions = async () => {
    // Implement fetching past questions from the server
    // For now, we'll use mock data
    const mockQuestions: Question[] = [
      {
        id: '1',
        subject: 'Math',
        level: 'Intermediate',
        question: 'What is the quadratic formula?',
        answer: 'The quadratic formula is x = (-b ± √(b² - 4ac)) / (2a)',
        summary: 'Formula to solve quadratic equations'
      },
      // Add more mock questions as needed
    ];
    setPastQuestions(mockQuestions);
  };

  const truncateText = (text: string, limit: number) => {
    const words = text.split(/\s+/);
    if (words.length > limit) {
      return words.slice(0, limit).join(' ') + '...';
    }
    return text;
  };

  const extractTextFromImage = async (file: File) => {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return truncateText(text, WORD_LIMIT);
  };

  const extractTextFromFile = async (file: File) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(truncateText(text, WORD_LIMIT));
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadCount >= MAX_UPLOADS) {
        setError('Maximum number of file uploads reached.');
        return;
      }
      setIsLoading(true);
      try {
        let text = '';
        if (file.type.startsWith('image/')) {
          text = await extractTextFromImage(file);
        } else {
          text = await extractTextFromFile(file);
        }
        setExtractedText(text);
        setUploadCount(uploadCount + 1);
      } catch (error) {
        setError('Failed to extract text from the file. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCameraCapture = async () => {
    console.log('Camera capture requested');
    // Implement camera capture functionality
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://afnankhan1122.pythonanywhere.com/generate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          level,
          question,
          extractedText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error generating answer: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setAnswer(data.answer);
      setSummary(data.summary);

      // Save the question to past questions
      const newQuestion: Question = {
        id: Date.now().toString(),
        subject,
        level,
        question,
        answer: data.answer,
        summary: data.summary
      };
      setPastQuestions([newQuestion, ...pastQuestions]);

      // Save to server (implement this functionality)
      // savePastQuestion(newQuestion);
    } catch (error: any) {
      console.error('Error generating answer:', error.message || error);
      setError('Failed to generate answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      await signUpWithEmail(email, password);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`app-container ${darkMode ? 'dark-mode' : ''}`}
    >
      <header className="app-header">
        <motion.div
          initial={{ x: -50 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="logo-container"
        >
          <img src="homework_help_assistance_education_online_icon_262293 (1).ico" alt="HomeworkAi" className="logo" />
          <h1 className="app-title">HomeworkAi</h1>
        </motion.div>
        <nav className="button-container">
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="sign-out-button"
            >
              Sign out
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleDarkMode}
            className="dark-mode-toggle"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
        </nav>
      </header>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="main-content"
      >
        <h2 className="content-title">Your Personal AI Tutor</h2>

        {user ? (
          <>
            <div className="dropdown-container">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="dropdown-button"
              >
                {subject || 'Select a subject'}
                <ChevronDown size={20} />
              </motion.button>
              <AnimatePresence>
                {isSubjectDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="dropdown-menu"
                  >
                    {subjects.map((s) => (
                      <motion.div
                        key={s}
                        whileHover={{ backgroundColor: '#f0f0f0' }}
                        onClick={() => { setSubject(s); setIsSubjectDropdownOpen(false); }}
                        className="dropdown-item"
                      >
                        <SubjectIcon subject={s} />
                        <span>{s}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.select
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              value={level}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setLevel(e.target.value)}
              className="level-select"
            >
              <option value="">Select a level</option>
              {levels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </motion.select>

            <motion.input
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="text"
              placeholder="Enter your homework question here..."
              value={question}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
              className="question-input"
            />

            <div className="file-upload-container">
              <input
                type="file"
                onChange={handleFileUpload}
                id="file-upload"
                className="file-input"
                accept=".txt,.pdf,.doc,.docx,image/*"
                disabled={uploadCount >= MAX_UPLOADS}
              />
              <motion.label
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                htmlFor="file-upload"
                className={`file-label ${uploadCount >= MAX_UPLOADS ? 'disabled' : ''}`}
              >
                Choose file
              </motion.label>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCameraCapture}
                className="camera-button"
                disabled={uploadCount >= MAX_UPLOADS}
              >
                <Camera size={20} />
                Take Picture
              </motion.button>
            </div>

            {extractedText && (
              <div className="extracted-text-container">
                <h3>Extracted Text:</h3>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="extracted-text-area"
                  readOnly={!isEditingExtractedText}
                />
                <div className="extracted-text-actions">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuestion(extractedText)}
                    className="action-button"
                  >
                    <ArrowRight size={20} />
                    Move to Question Box
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditingExtractedText(!isEditingExtractedText)}
                    className="action-button"
                  >
                    <Edit size={20} />
                    {isEditingExtractedText ? 'Save Edits' : 'Edit Extracted Text'}
                  </motion.button>
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="submit-button"
            >
              Generate Answer
            </motion.button>

            <AnimatePresence>
              {(isLoading || answer) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="answer-container"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="loading-spinner"
                    />
                  ) : (
                    <>
                      <h3>Summary:</h3>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="summary-text"
                      >
                        {summary}
                      </motion.p>
                      <h3>Full Answer:</h3>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="answer-text"
                      >
                        {answer}
                      </motion.p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="past-questions-container">
              <h3>Past Questions</h3>
              {pastQuestions.map((q) => (
                <div key={q.id} className="past-question-item">
                  <h4>{q.subject} - {q.level}</h4>
                  <p><strong>Q:</strong> {q.question}</p>
                  <p><strong>Summary:</strong> {q.summary}</p>
                  <button
                    className="view-full-answer-button"
                    onClick={() => {
                      setSubject(q.subject);
                      setLevel(q.level);
                      setQuestion(q.question);
                      setAnswer(q.answer);
                      setSummary(q.summary);
                    }}
                  >
                    View Full Answer
                  </button>

                </div>
              ))}
            </div>

          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="auth-container"
          >
            <form onSubmit={handleSignIn}>
              <motion.input
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <motion.input
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="submit-button"
              >
                Sign In
              </motion.button>
            </form>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignUp}
              className="submit-button"
            >
              Sign Up
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoogleSignIn}
              className="submit-button"
            >
              Sign in with Google
            </motion.button>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="error-message"
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default HomeworkAIApp;

