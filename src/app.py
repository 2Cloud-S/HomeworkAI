import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Groq client
api_key = os.environ.get("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set. Please set it before running the application.")

client = Groq(api_key=api_key)

# Root route to avoid 404 on base URL
@app.route('/')
def home():
    return jsonify({"message": "Welcome to the API!"}), 200

@app.route('/generate-answer', methods=['POST'])
def generate_answer():
    data = request.json

    # Validate input data
    if not data:
        return jsonify({"error": "No data provided"}), 400

    subject = data.get('subject')
    level = data.get('level')
    question = data.get('question')
    extracted_text = data.get('extractedText', '')

    # Check if all required fields are provided
    if not subject or not level or not question:
        return jsonify({"error": "Missing subject, level, or question in request"}), 400

    try:
        # Create chat completion
        prompt = f"""You are a tutor specialized in {subject} at {level} level.
        Question: {question}

        Additional context from extracted text:
        {extracted_text}

        Please provide a clear and concise answer to the question, taking into account any relevant information from the extracted text. Include key concepts, step-by-step explanations if applicable, and any relevant examples to aid understanding."""

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an AI tutor specialized in various subjects and levels."},
                {"role": "user", "content": prompt},
            ],
            model="llama3-8b-8192",
        )

        # Extract the answer from the response
        answer = chat_completion.choices[0].message.content
        return jsonify({"answer": answer})
    except Exception as e:
        # Log error for debugging
        app.logger.error("Error generating answer: %s", str(e))  
        return jsonify({"error": "Failed to generate answer. Please try again later."}), 500

# Custom 404 error handler
@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"error": "The requested URL was not found on the server."}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Default to port 5000
    app.run(host='0.0.0.0', port=port, debug=True)