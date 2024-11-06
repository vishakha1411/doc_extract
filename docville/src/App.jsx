import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setImagePreview(URL.createObjectURL(selectedFile)); // Generate preview URL
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post("http://localhost:3000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setData(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <h2 className="text-3xl font-semibold mb-6 text-blue-600">Upload Document Image</h2>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="mb-6">
          <label htmlFor="file-upload" className="block text-lg font-medium text-gray-700 mb-2">
            Choose an image
          </label>
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="block w-full text-gray-700 p-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="mb-6">
            <img src={imagePreview} alt="Preview" className="w-full rounded-lg shadow-sm border border-gray-200" />
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Upload and Extract
        </button>
      </form>

      {data && (
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg w-full max-w-md">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">Extracted Data</h3>
          <p className="text-lg mb-2"><strong>Name:</strong> {data.name}</p>
          <p className="text-lg mb-2"><strong>Document Number:</strong> {data.documentNumber}</p>
          <p className="text-lg"><strong>Expiration Date:</strong> {data.expirationDate}</p>
        </div>
      )}
    </div>
  );
}

export default App;
