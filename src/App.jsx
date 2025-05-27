import { useState } from "react";
import { marked } from "marked"; // Import marked for Markdown parsing

import "./App.css";

// Main App component for the Markdown Converter
const App = () => {
  // State to hold the user's input text
  const [inputText, setInputText] = useState("");
  // State to hold the generated Markdown text
  const [markdownOutput, setMarkdownOutput] = useState("");
  // State to manage loading status during API calls
  const [isLoading, setIsLoading] = useState(false);
  // State to hold any error messages
  const [error, setError] = useState("");
  // State to manage the copy button's text (e.g., "Copy" or "Copied!")
  const [copyButtonText, setCopyButtonText] = useState("Copy Markdown");
  // New state to toggle between raw Markdown and preview
  const [showPreview, setShowPreview] = useState(false);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    setError(
      "API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file."
    );
    return;
  }

  // Function to handle the text conversion
  const convertToMarkdown = async () => {
    // Clear previous output and errors
    setMarkdownOutput("");
    setError("");
    setCopyButtonText("Copy Markdown"); // Reset copy button text
    setIsLoading(true); // Set loading state to true
    setShowPreview(false); // Reset to raw Markdown view on new conversion

    try {
      // Construct the prompt for the Gemini model
      const prompt = `Convert the following text into well-formatted Markdown syntax suitable for a README.md file.
      
      Ensure the output includes appropriate headings, lists, code blocks, bold/italic text, and links where applicable.
      
      Text to convert:
      "${inputText}"
      
      Please provide *only* the Markdown output.`;

      // Prepare the chat history for the API request
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });

      // Define the payload for the API request
      const payload = {
        contents: chatHistory,
        generationConfig: {
          // Instruct the model to return plain text, which will be our Markdown
          responseMimeType: "text/plain",
        },
      };

      // API URL for gemini-2.0-flash model
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      // Make the API call to the Gemini model
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Parse the JSON response
      const result = await response.json();

      // Check if the response contains valid content
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const text = result.candidates[0].content.parts[0].text;
        console.log("Generated Markdown:", text);
        // remove ````markdown from the start and end of the text
        const cleanedText = text.replace(/^```markdown\s*|\s*```$/g, "");
        setMarkdownOutput(cleanedText); // Set the generated Markdown
      } else {
        // Handle cases where the response structure is unexpected
        setError("Failed to generate Markdown. Please try again.");
        console.error("Unexpected API response structure:", result);
      }
    } catch (err) {
      // Catch and display any network or other errors
      setError(`An error occurred: ${err.message}`);
      console.error("Error during Markdown conversion:", err);
    } finally {
      setIsLoading(false); // Always set loading state to false after completion
    }
  };

  // Function to copy the generated Markdown to clipboard
  const copyToClipboard = () => {
    if (markdownOutput) {
      // Use document.execCommand('copy') for better compatibility in iframes
      const textarea = document.createElement("textarea");
      textarea.value = markdownOutput;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopyButtonText("Copied!"); // Update button text
        setTimeout(() => setCopyButtonText("Copy Markdown"), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error("Failed to copy text: ", err);
        setError("Failed to copy text to clipboard.");
      }
      document.body.removeChild(textarea);
    }
  };

  // Function to render Markdown to HTML
  const renderMarkdown = () => {
    // Ensure marked is available and markdownOutput is not empty
    if (markdownOutput) {
      return marked.parse(markdownOutput);
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Text to README.md Markdown Converter
        </h1>

        {/* Input Section */}
        <div className="mb-6">
          <label
            htmlFor="inputText"
            className="block text-gray-700 text-sm font-semibold mb-2"
          >
            Enter your text here:
          </label>
          <textarea
            id="inputText"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 resize-y min-h-[150px]"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your plain text content here. The AI will convert it into Markdown for your README.md file."
            rows="8"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <button
            onClick={convertToMarkdown}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Converting...
              </div>
            ) : (
              "Convert to Markdown"
            )}
          </button>

          <button
            onClick={() => {
              setInputText("");
              setMarkdownOutput("");
              setError("");
              setCopyButtonText("Copy Markdown");
              setShowPreview(false); // Reset preview toggle
            }}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            disabled={isLoading}
          >
            Clear All
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Output Section */}
        {markdownOutput && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 text-sm font-semibold">
                Generated Markdown:
              </label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
              >
                {showPreview ? "Show Markdown Syntax" : "Show Preview"}
              </button>
            </div>

            {showPreview ? (
              <div
                className="w-full p-3 border border-gray-300 rounded-lg bg-white overflow-auto prose lg:prose-base max-w-none min-h-[200px]"
                dangerouslySetInnerHTML={{ __html: renderMarkdown() }}
              ></div>
            ) : (
              <textarea
                id="markdownOutput"
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm focus:outline-none resize-y min-h-[200px]"
                value={markdownOutput}
                readOnly
                rows="10"
              ></textarea>
            )}
            <button
              onClick={copyToClipboard}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
            >
              {copyButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
