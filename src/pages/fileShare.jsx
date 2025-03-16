import React, { useState, useEffect, useRef } from "react";
import { Upload, Wifi, ArrowUpCircle } from "lucide-react";
import { useSocket } from '../contest/socketContext';

const FileShare = () => {
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const fileInputRef = useRef(null);
  const socket = useSocket();

  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const receivedChunks = new Map();

    socket.on("receive-chunk", (data) => {
      const { fileName, chunk } = data;
      
      if (!receivedChunks.has(fileName)) {
        receivedChunks.set(fileName, []);
      }
      
      receivedChunks.get(fileName).push(chunk);
      console.log(`Received chunk for ${fileName}`);
    });

    socket.on("file-transfer-complete", ({ fileName }) => {
      const chunks = receivedChunks.get(fileName);
      if (!chunks) return console.error("No chunks received for", fileName);

      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setFileName(fileName);
      receivedChunks.delete(fileName);
    });

    return () => {
      socket.off("receive-chunk");
      socket.off("file-transfer-complete");
    };
  }, []);

  useEffect(() => {
    socket.on("buddies", (buddies) => {
      console.log("buddies ", buddies);
      if (buddies.type === "buddies") {
        setDiscoveredDevices(buddies.buddies || []);
      }
    });

    return () => socket.off("buddies");
  }, []);

  const CHUNK_SIZE = 64 * 1024; // 64KB per chunk

  const handleFileUpload = (event) => {
    if (!selectedDevice) return alert("Select a device first!");
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    let offset = 0;

    reader.onload = (e) => {
      const chunk = e.target.result;
      socket.emit("send-chunk", {
        recipient: selectedDevice.socketId,
        fileName: file.name,
        fileSize: file.size,
        chunk,
        offset,
      });

      offset += chunk.byteLength;
      if (offset < file.size) {
        readNextChunk();
      } else {
        socket.emit("file-transfer-complete", { recipient: selectedDevice.socketId, fileName: file.name });
        console.log(`File sent successfully: ${file.name}`);
      }
    };

    const readNextChunk = () => {
      const blob = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(blob);
    };

    readNextChunk();
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Wifi className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-semibold text-gray-800">ProShare</span>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer mb-6">
              <label className="w-48 h-48 rounded-full border-4 border-blue-500 flex items-center justify-center transition-all duration-300 group-hover:border-blue-600">
                <div className="text-center">
                  <ArrowUpCircle className="w-16 h-16 text-blue-500 mx-auto mb-2 group-hover:text-blue-600" />
                  <p className="font-medium text-gray-800">Upload Files</p>
                  <p className="text-sm text-gray-500">Click Here</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-white text-blue-500 px-6 py-2 rounded-full border-2 border-blue-500 hover:bg-blue-50 transition-colors duration-300 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {/* Discovered Devices Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Discovered Devices</h2>
          <div className="space-y-4">
            {discoveredDevices.length > 0 ? (
              discoveredDevices.map((device, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 border ${
                    selectedDevice?.peerId === device.peerId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100"
                  }`}
                  onClick={() => setSelectedDevice(device)}
                >
                  <div className="flex items-center space-x-3 cursor-pointer">
                    <Wifi className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-700">{device.peerId}</span>
                  </div>
                  <span className="text-sm text-green-500">Available</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No devices found.</p>
            )}
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-6 text-gray-600">
          <p>The easiest way to transfer data across devices</p>
          <p className="text-blue-500 text-sm mt-1">To start, select a device and upload a file</p>
        </div>
      </div>

      {/* Modal for Download Confirmation */}
      {downloadUrl && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold mb-4">Download {fileName}?</p>
            <button
              onClick={handleDownload}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Download
            </button>
            <button
              onClick={() => setDownloadUrl(null)}
              className="ml-4 text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileShare;
