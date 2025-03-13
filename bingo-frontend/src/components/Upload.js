// ============================
// Upload Component - Task Proof Submission with Fraud Detection
// ============================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Upload.css'; // Create this file for styling

const Upload = () => {
  // State variables
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // ============================
  // Retrieve Selected Task from Local Storage
  // ============================

  useEffect(() => {
    const choice = localStorage.getItem('selectedChoice');
    console.log('Selected Task:', choice);
    if (choice) {
      setSelectedTask(choice);
    }
  }, []);

  // ============================
  // Handle File Selection
  // ============================

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please select a JPEG or PNG image file.');
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size is too large. Maximum size is 10MB.');
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    // Clear previous errors
    setErrorMessage('');

    // Set selected file
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ============================
  // Handle File Submission
  // ============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');

    // Set loading state
    setIsUploading(true);

    // Create a FormData object to send the file
    const formData = new FormData();

    // Get the task ID from localStorage
    const taskId = localStorage.getItem('selectedTaskId');

    if (!taskId) {
      setErrorMessage('Task ID not found. Please select a task again.');
      setIsUploading(false);
      navigate('/bingo');
      return;
    }

    formData.append('task_id', taskId);
    formData.append('photo', selectedFile);

    try {
      // Get the access token from localStorage
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setErrorMessage('You must be logged in to submit a task');
        setIsUploading(false);
        navigate('/login');
        return;
      }

      // Make the API request
      const response = await fetch('http://localhost:8000/api/complete_task/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Thank you for your submission! We will review it soon.');

        // Delay navigation to allow user to see success message
        setTimeout(() => {
          navigate('/bingo');
        }, 2000);
      } else {
        // Handle fraud detection errors specially
        if (data.similarity) {
          setErrorMessage(`${data.message} Similarity: ${data.similarity}`);
        } else {
          setErrorMessage(data.message || 'Failed to submit task. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      setErrorMessage('An error occurred while submitting your task. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ============================
  // Handle Back Button
  // ============================

  const handleBack = () => {
    navigate('/bingo');
  };

  // ============================
  // Render Upload UI
  // ============================

  return (
    <div className="upload-container">
      {/* Page Header */}
      <h1>Upload your proof of Gameplay</h1>

      {/* Display the selected task */}
      <div className="selected-task">
        <h3>Selected Task:</h3>
        <p>{selectedTask}</p>
      </div>

      {/* Error and Success Messages */}
      {errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      {/* File Upload Form */}
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-input-container">
          <label htmlFor="file-upload" className="custom-file-upload">
            Choose File
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            required
          />
          <span className="file-name">
            {selectedFile ? selectedFile.name : 'No file selected'}
          </span>
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="image-preview">
            <h3>Preview:</h3>
            <img src={previewUrl} alt="Preview" />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="button-container">
          <button type="button" onClick={handleBack} className="back-button">
            Back
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Upload;