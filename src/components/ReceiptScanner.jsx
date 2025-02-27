// Update to ReceiptScanner.jsx to support group-based splitting

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const ReceiptScanner = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [splitStep, setSplitStep] = useState(false);
  const [splitPrompt, setSplitPrompt] = useState('');
  const [people, setPeople] = useState(['Me']);
  const [groupResult, setGroupResult] = useState(null);
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitError, setSplitError] = useState(null);

  // Rest of the dropzone and file upload functionality remains the same
  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setReceiptData(null);
    setEditableItems([]);
    setIsEditing(false);
    setSplitStep(false);
    setGroupResult(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      // For PDFs, just show a placeholder
      setPreview('/pdf-placeholder.png');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': []
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/ocr/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const data = response.data;
      setReceiptData(data);
      
      // Initialize editable items
      if (data.items && data.items.length > 0) {
        setEditableItems(data.items.map(item => ({ ...item })));
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.detail || 'Failed to process the receipt');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setReceiptData(null);
    setEditableItems([]);
    setError(null);
    setIsEditing(false);
    setSplitStep(false);
    setSplitPrompt('');
    setGroupResult(null);
  };

  // Item editing functions remain the same
  const handleItemUpdate = (index, field, value) => {
    const updatedItems = [...editableItems];
    updatedItems[index][field] = field === 'price' 
      ? parseFloat(value) || 0 
      : field === 'quantity'
        ? parseFloat(value) || 1
        : value;
    setEditableItems(updatedItems);
  };

  const handleDeleteItem = (index) => {
    const updatedItems = [...editableItems];
    updatedItems.splice(index, 1);
    setEditableItems(updatedItems);
  };

  const handleAddItem = () => {
    setEditableItems([...editableItems, { name: '', price: 0, quantity: 1 }]);
  };

  const saveItems = () => {
    setReceiptData({
      ...receiptData,
      items: editableItems
    });
    setIsEditing(false);
  };

  const proceedToSplit = () => {
    setSplitStep(true);
  };

  // People management functions remain the same
  const addPerson = () => {
    setPeople([...people, `Person ${people.length + 1}`]);
  };

  const handlePersonNameChange = (index, name) => {
    const newPeople = [...people];
    newPeople[index] = name;
    setPeople(newPeople);
  };

  const removePerson = (index) => {
    if (people.length > 1) {
      const newPeople = [...people];
      newPeople.splice(index, 1);
      setPeople(newPeople);
    }
  };

  // Updated to use the new group-based splitting endpoint
  const handleSplitItems = async () => {
    if (!receiptData || !receiptData.items || receiptData.items.length === 0) {
      setSplitError('No items found to split');
      return;
    }

    if (people.length === 0) {
      setSplitError('Add at least one person to split the bill');
      return;
    }

    setSplitLoading(true);
    setSplitError(null);

    try {
      const response = await axios.post(`${API_URL}/group-split/`, {
        items: receiptData.items,
        people: people,
        prompt: splitPrompt,
        tax: receiptData.tax,
        total: receiptData.total
      });

      setGroupResult(response.data);
    } catch (err) {
      console.error('Error splitting bill:', err);
      setSplitError(err.response?.data?.detail || 'Failed to split the bill');
    } finally {
      setSplitLoading(false);
    }
  };

  // Split results display modified for group-based splitting
  if (splitStep) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Split Your Bill</h1>
        
        <div className="bg-white border rounded-lg shadow-sm mb-6">
          <div className="border-b p-4">
            <h2 className="text-xl font-medium">Receipt from {receiptData.vendor || 'Unknown Vendor'}</h2>
            <p className="text-sm text-gray-500">
              {receiptData.date && `Date: ${receiptData.date}`}
              {receiptData.total && ` • Total: $${receiptData.total.toFixed(2)}`}
            </p>
          </div>
          
          <div className="p-4">
            <h3 className="font-medium mb-4 text-lg">People Splitting the Bill</h3>
            
            <div className="space-y-2 mb-6">
              {people.map((person, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={person}
                    onChange={(e) => handlePersonNameChange(index, e.target.value)}
                    className="flex-grow border-gray-300 rounded-md shadow-sm p-2 border"
                    placeholder="Enter name"
                    disabled={groupResult !== null}
                  />
                  {people.length > 1 && groupResult === null && (
                    <button
                      onClick={() => removePerson(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              
              {groupResult === null && (
                <button
                  onClick={addPerson}
                  className="text-blue-500 hover:text-blue-700 mt-2"
                >
                  + Add Person
                </button>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-lg">Natural Language Splitting</h3>
              <p className="text-sm text-gray-500 mb-2">
                Describe how to split the bill. For example: "Me and Alex are not paying for the milk, bananas and bread, but Jill is."
              </p>
              <textarea
                value={splitPrompt}
                onChange={(e) => setSplitPrompt(e.target.value)}
                className="w-full h-32 border-gray-300 rounded-md shadow-sm p-2 border"
                placeholder="Enter your splitting instructions..."
                disabled={groupResult !== null}
              />
            </div>
            
            {splitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                {splitError}
              </div>
            )}
            
            {!groupResult ? (
              <div className="border rounded-md overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receiptData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          ${item.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    {receiptData.tax !== null && (
                      <tr>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          Tax
                        </td>
                        <td></td>
                        <td className="px-6 py-3 text-sm font-medium text-right">
                          ${receiptData.tax.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-6 py-3 text-base font-medium text-gray-900">
                        Total
                      </td>
                      <td></td>
                      <td className="px-6 py-3 text-base font-medium text-right">
                        ${receiptData.total ? receiptData.total.toFixed(2) : 
                            (receiptData.items.reduce((sum, item) => 
                              sum + item.price, 0) + 
                              (receiptData.tax || 0)).toFixed(2)
                        }
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="font-medium mb-4 text-lg">Bill Split Results</h3>
                
                <div className="space-y-6">
                  {groupResult.groups.map((group, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="bg-blue-50 p-4 border-b">
                        <h4 className="font-bold text-lg">
                          {group.participants.length === people.length 
                            ? "Everyone" 
                            : group.participants.join(", ")}
                        </h4>
                        <p className="text-lg text-blue-800 font-medium">
                          Total: ${group.total.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="p-4">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.items.map((item, itemIndex) => (
                              <tr key={itemIndex}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                  ${item.price.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                Group Total
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                ${group.total.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-green-50 p-4 border-b">
                      <h4 className="font-bold text-lg">Summary</h4>
                      <p className="text-lg text-green-800 font-medium">
                        Grand Total: ${groupResult.grand_total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t p-4 flex justify-between">
            {!groupResult ? (
              <>
                <button
                  onClick={() => setSplitStep(false)}
                  className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back to Receipt
                </button>
                <button
                  onClick={handleSplitItems}
                  className={`py-2 px-4 rounded-md text-white ${
                    splitLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                  disabled={splitLoading}
                >
                  {splitLoading ? 'Grouping Items...' : 'Group & Split Items'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setGroupResult(null)}
                  className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Modify Split
                </button>
                <button
                  className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md"
                  onClick={() => {
                    // This will be connected to Splitwise API
                    alert("This will be integrated with the Splitwise API in the next step!");
                  }}
                >
                  Upload to Splitwise
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // The receipt scanning UI remains the same
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Splitwise Receipt Scanner</h1>
      
      {!receiptData && (
        <div className="mb-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-500 text-lg">Drop the receipt here...</p>
            ) : (
              <div>
                <svg 
                  className="mx-auto h-12 w-12 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                  />
                </svg>
                <p className="mt-2 text-lg">Drag and drop a receipt image or PDF here</p>
                <p className="mt-1 text-sm text-gray-500">Or click to select a file</p>
                <p className="mt-2 text-xs text-gray-500">Supported formats: JPG, PNG, PDF</p>
              </div>
            )}
          </div>
        </div>
      )}

      {file && !receiptData && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-medium">Selected File</h2>
            <button
              onClick={resetForm}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          
          <div className="border rounded-lg p-4 flex items-center">
            {preview && (
              <div className="w-32 h-32 flex-shrink-0 mr-4 border">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <p className="font-medium text-lg">{file.name}</p>
              <p className="text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleUpload}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-md font-medium text-lg ${
                loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Processing...' : 'Scan Receipt'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {receiptData && (
        <div className="mb-6 bg-white border rounded-lg shadow-sm">
          <div className="border-b p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-medium">Scanned Receipt</h2>
              <div className="mt-1 text-sm text-gray-500">
                {receiptData.vendor && <p>Vendor: {receiptData.vendor}</p>}
                {receiptData.date && <p>Date: {receiptData.date}</p>}
              </div>
            </div>
            
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                >
                  Edit Items
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={saveItems}
                    className="py-2 px-4 bg-green-500 hover:bg-green-600 rounded-md text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditableItems(receiptData.items.map(item => ({ ...item })));
                      setIsEditing(false);
                    }}
                    className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-medium mb-2 text-lg">Items</h3>
            {(isEditing ? editableItems : receiptData.items).length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      {isEditing && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(isEditing ? editableItems : receiptData.items).map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemUpdate(index, 'name', e.target.value)}
                              className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            />
                          ) : (
                            item.name
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => handleItemUpdate(index, 'quantity', e.target.value)}
                              className="w-20 border-gray-300 rounded-md shadow-sm p-2 border"
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handleItemUpdate(index, 'price', e.target.value)}
                              className="w-24 border-gray-300 rounded-md shadow-sm p-2 border"
                            />
                          ) : (
                            `$${item.price.toFixed(2)}`
                          )}
                        </td>
                        {isEditing && (
                          <td className="px-6 py-4 text-right text-sm">
                            <button
                              onClick={() => handleDeleteItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {isEditing && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4">
                          <button
                            onClick={handleAddItem}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            + Add item
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    {receiptData.tax !== null && (
                      <tr>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          Tax
                        </td>
                        <td></td>
                        <td className="px-6 py-3 text-sm font-medium text-right">
                          ${receiptData.tax.toFixed(2)}
                        </td>
                        {isEditing && <td></td>}
                      </tr>
                    )}
                    <tr>
                      <td className="px-6 py-3 text-base font-medium text-gray-900">
                        Total
                      </td>
                      <td></td>
                      <td className="px-6 py-3 text-base font-medium text-right">
                        ${receiptData.total ? receiptData.total.toFixed(2) : 
                            ((isEditing ? editableItems : receiptData.items).reduce((sum, item) => 
                              sum + item.price, 0) + 
                              (receiptData.tax || 0)).toFixed(2)
                        }
                      </td>
                      {isEditing && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No items were detected in the receipt.</p>
            )}
          </div>

          <div className="border-t p-4">
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                View Raw OCR Text
              </summary>
              <pre className="mt-2 whitespace-pre-wrap p-2 bg-gray-50 rounded border text-xs overflow-auto max-h-64">
                {receiptData.raw_text}
              </pre>
            </details>
          </div>

          <div className="border-t p-4 flex justify-between">
            <button
              onClick={resetForm}
              className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Scan Another Receipt
            </button>
            <button
              className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={proceedToSplit}
              disabled={isEditing}
            >
              Continue to Split
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptScanner;