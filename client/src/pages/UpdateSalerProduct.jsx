import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { useSalerProductQuery, useSingleSalerProductQuery, useUpdateSalerProductMutation } from '../redux/features/SalerProductApi/salerProductApi';
import Swal from 'sweetalert2';
import { useSalerProductQuery, useSingleSalerProductQuery, useUpdateSalerProductMutation } from '../redux/features/SalerProductApi/salerProductApi';

const UpdateSalerProduct = () => {
  const { id } = useParams(); // Get record ID from URL parameters
  const navigate = useNavigate();

  // Fetch single record data
  const { data: recordData, isLoading, isError, refetch: singleDataRefetch } = useSingleSalerProductQuery(id);
  const { refetch } = useSalerProductQuery();

  // Update mutation
  const [updateSalerProduct, { isLoading: isUpdating }] = useUpdateSalerProductMutation();

  const [formData, setFormData] = useState({
    product_name: "",
    product_place: "",
    product_price: "",
    pieces_price: "",
    stock: "",
    date: ""
  });

  // Populate form when record data is loaded
  useEffect(() => {
    if (recordData) {
      setFormData({
        product_name: recordData.product_name || '',
        product_place: recordData.product_place || '',
        product_price: recordData.product_price || '',
        pieces_price: recordData.pieces_price || '',
        stock: recordData.stock || '',
        date: formatDateForInput(recordData.date) || '',
      });
    }
  }, [recordData]);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      // Adjust for timezone offset to ensure correct date display
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      return localDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.product_name.trim()) {
      Swal.fire({
        title: 'Error!',
        text: 'Please enter product name',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      return;
    }

    if (!formData.product_place.trim()) {
      Swal.fire({
        title: 'Error!',
        text: 'Please enter product place',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      return;
    }

    if (!formData.date) {
      Swal.fire({
        title: 'Error!',
        text: 'Please select a date',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      return;
    }

    // Numeric field validation
    const numericFields = ['product_price', 'pieces_price', 'stock'];

    for (const field of numericFields) {
      const value = formData[field];
      if (value && (isNaN(value) || parseFloat(value) < 0)) {
        Swal.fire({
          title: 'Error!',
          text: `${field.replace(/_/g, ' ')} must be a valid positive number`,
          icon: 'error',
          confirmButtonText: 'Ok',
        });
        return;
      }
    }

    try {
      // Prepare update data
      const updateData = {
        product_name: formData.product_name.trim(),
        product_place: formData.product_place.trim(),
        product_price: formData.product_price ? parseFloat(formData.product_price) : 0,
        pieces_price: formData.pieces_price ? parseFloat(formData.pieces_price) : 0,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        date: formData.date,
      };

      // Call update API
      await updateSalerProduct({ id, userData: updateData }).unwrap();
      refetch();
      singleDataRefetch();

      // Show success message
      Swal.fire({
        title: 'Success!',
        text: 'Saler product record updated successfully',
        icon: 'success',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'sweetalert_btn_success' },
      }).then(() => {
        // Redirect back to saler record page
        navigate('/saler-record');
      });

    } catch (error) {
      console.error('Update failed:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update saler product record. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
    }
  };

  // Calculate total product value
  const calculateTotalProductValue = () => {
    const productPrice = parseFloat(formData.product_price) || 0;
    const stock = parseInt(formData.stock) || 0;
    return productPrice * stock;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading record data...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="alert alert-danger text-center">
          <h5>Error Loading Record</h5>
          <p>Failed to load the saler product record. Please try again.</p>
          <button
            className="btn btn-primary"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='d-flex justify-content-center'>
      <div className="card form_div mb-5 p-3 rounded-2 w-50">
        <h1 className='d-flex justify-content-center my-4 gradient_text'>
          Update Saler Product
        </h1>

        {/* Current Record Info */}
        {recordData && (
          <div className="alert alert-info mx-3 mb-4">
            <h6 className="fw-bold">Current Record Information:</h6>
            <div className="row">
              <div className="col-md-6">
                <strong>Product Name:</strong> {recordData.product_name || 'N/A'}
              </div>
              <div className="col-md-6">
                <strong>Date:</strong> {formatDateForInput(recordData.date) || 'N/A'}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Product Place:</strong> {recordData.product_place || 'N/A'}
              </div>
              <div className="col-md-6">
                <strong>Stock (Pieces):</strong> {recordData.stock || '0'}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Product Price:</strong> {parseFloat(recordData.product_price || 0).toFixed(2)}
              </div>
              <div className="col-md-6">
                <strong>Pieces Price:</strong> {parseFloat(recordData.pieces_price || 0).toFixed(2)}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Total Product Value:</strong>
                {(parseFloat(recordData.product_price || 0) * parseInt(recordData.stock || 0)).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="d-flex justify-content-between flex-wrap align-items-end mx-3">

          {/* Product Name Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Product Name <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="text"
              name="product_name"
              className="form-control p-2"
              placeholder="Enter product name"
              value={formData.product_name}
              onChange={handleChange}
              required
              disabled={isUpdating}
            />
          </div>

          {/* Date Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Date <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="date"
              name="date"
              className="form-control p-2"
              value={formData.date}
              onChange={handleChange}
              required
              disabled={isUpdating}
            />
          </div>

          {/* Product Place Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Product Place <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="text"
              name="product_place"
              className="form-control p-2"
              placeholder="Enter product place"
              value={formData.product_place}
              onChange={handleChange}
              required
              disabled={isUpdating}
            />
          </div>

          {/* Product Price Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Product Price <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="number"
              name="product_price"
              className="form-control p-2"
              placeholder="Enter product price"
              value={formData.product_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              disabled={isUpdating}
            />
          </div>

          {/* Pieces Price Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Total Pieces Price <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="number"
              name="pieces_price"
              className="form-control p-2"
              placeholder="Enter pieces price"
              value={formData.pieces_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              disabled={isUpdating}
            />
          </div>

          {/* Stock Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold"> Pieces <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="number"
              name="stock"
              className="form-control p-2"
              placeholder="Enter stock quantity"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
              disabled={isUpdating}
            />
          </div>

          {/* Calculated Total Product Value (Read-only) */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Total Product Value (Calculated) <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="text"
              className="form-control p-2 bg-light"
              value={`Rs: ${calculateTotalProductValue().toFixed()}`}
              readOnly
              disabled
              style={{ fontWeight: 'bold', color: '#198754' }}
            />
            <small className="text-muted">
              Product Price × Pieces = {calculateTotalProductValue().toFixed(2)}
            </small>
          </div>

          {/* Amount Summary */}
          <div className="col-12 mb-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h6 className="card-title fw-bold">Amount Summary</h6>
                <div className="row">
                  <div className="col-md-4">
                    <strong>Product Price:</strong>
                    <div className="text-success fs-5">
                      Rs: {parseFloat(formData.product_price || 0).toFixed(2)}
                    </div>
                    <small className="text-muted">Per unit price</small>
                  </div>
                  <div className="col-md-4">
                    <strong>Total Product Value:</strong>
                    <div className="text-primary fs-5">
                      Rs: {calculateTotalProductValue().toFixed(2)}
                    </div>
                    <small className="text-muted">(Price × {formData.stock || 0} pieces)</small>
                  </div>
                  <div className="col-md-4">
                    <strong>Pieces Price:</strong>
                    <div className="text-info fs-5">
                      Rs: {parseFloat(formData.pieces_price || 0).toFixed(2)}
                    </div>
                    <small className="text-muted">Price for all pieces</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="col-12 d-flex justify-content-end gap-2 mb-2 mt-3">
            <button
              type="button"
              className="btn btn-success px-4"
              onClick={() => navigate('/saler-record')}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger px-4"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateSalerProduct;