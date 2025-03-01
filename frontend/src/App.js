import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle"); // idle, processing, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [processedVideoUrl, setProcessedVideoUrl] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setStatus("idle");
      setErrorMessage("");
      setProcessedVideoUrl("");
    }
  };

  const handleProcessVideo = async () => {
    if (!file) {
      setStatus("error");
      setErrorMessage("No video file provided");
      return;
    }
  
    setStatus("processing");
    const formData = new FormData();
    formData.append("video", file); // Matches backend 'video' key

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      // Check for the 'message' and 'output_url' in the response
      if (response.data && response.data.message === "Video processed successfully" && response.data.output_url) {
        setStatus("success");
        setProcessedVideoUrl(`http://localhost:5000${response.data.output_url}`);
      } else {
        throw new Error(response.data.message || "Processing failed");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(error.message || "An error occurred while processing the video");
    }
  };

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <header className="w-full py-6 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">Video Profanity Beep Editor</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md transition-all duration-300 animate-fadeIn">
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors duration-200"
                onClick={handleChooseFile}
              >
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Choose Video File</h2>
                <p className="text-gray-500 mb-4">Click to browse or drag and drop your video file</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />
                <button className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors">
                  Select File
                </button>
              </div>

              {fileName && (
                <div className="flex items-center justify-center space-x-2 text-gray-700 animate-fadeIn">
                  <span>Selected file:</span>
                  <span className="font-medium">{fileName}</span>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleProcessVideo}
                  disabled={!file || status === "processing"}
                  className="w-full sm:w-auto px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {status === "processing" ? (
                    <>
                      <span className="inline-block mr-2">
                        <svg
                          className="animate-spin h-4 w-4 text-white"
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
                      </span>
                      Processing Video...
                    </>
                  ) : (
                    "Process Video"
                  )}
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {status === "error" && (
              <div className="flex items-center justify-center text-red-500 animate-fadeIn">
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>{errorMessage}</span>
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center justify-center text-green-500 animate-fadeIn">
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>Video processed successfully!</span>
              </div>
            )}

            {/* Processed Video Section */}
            {processedVideoUrl && (
              <div className="space-y-4 animate-slideUp">
                <h2 className="text-xl font-bold text-center text-gray-800">Processed Video</h2>
                <div className="rounded-lg overflow-hidden bg-gray-900 shadow-lg">
                  <video src={processedVideoUrl} controls className="w-full max-w-[600px] mx-auto" />
                </div>
                <div className="flex justify-center">
                  <a
                    href={processedVideoUrl}
                    download
                    className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all duration-200 hover:scale-105"
                  >
                    <span className="mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    Download Processed Video
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full py-4 bg-white border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Video Profanity Beep Editor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;