import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  const [calculatedPiecesPrice, setCalculatedPiecesPrice] = useState(0);

  // Calculate total pieces price whenever product_price or stock changes
  useEffect(() => {
    const productPrice = parseFloat(formData.product_price) || 0;
    const stock = parseInt(formData.stock) || 0;
    const calculated = productPrice * stock;
    setCalculatedPiecesPrice(calculated);

    // Auto-update the pieces_price field with the calculated value
    setFormData(prev => ({
      ...prev,
      pieces_price: calculated > 0 ? calculated.toString() : ""
    }));
  }, [formData.product_price, formData.stock]);

  // Populate form when record data is loaded
  useEffect(() => {
    if (recordData) {
      const productPrice = parseFloat(recordData.product_price) || 0;
      const stock = parseInt(recordData.stock) || 0;
      const calculatedPiecesPrice = productPrice * stock;

      setFormData({
        product_name: recordData.product_name || '',
        product_place: recordData.product_place || '',
        product_price: recordData.product_price?.toString() || '',
        pieces_price: calculatedPiecesPrice > 0 ? calculatedPiecesPrice.toString() : recordData.pieces_price?.toString() || '',
        stock: recordData.stock?.toString() || '',
        date: formatDateForInput(recordData.date) || '',
      });

      setCalculatedPiecesPrice(calculatedPiecesPrice);
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

    // If user manually enters pieces_price, we'll respect it but show warning
    if (name === 'pieces_price') {
      const productPrice = parseFloat(formData.product_price) || 0;
      const stock = parseInt(formData.stock) || 0;
      const calculated = productPrice * stock;
      const enteredValue = parseFloat(value) || 0;

      // Only update if the value is different from calculated
      if (enteredValue !== calculated && value !== "") {
        // Show warning if value is different from calculated
        if (window.confirm(`Calculated value is ${calculated.toFixed(2)}. Do you want to use ${enteredValue.toFixed(2)} instead?`)) {
          setFormData(prev => ({ ...prev, [name]: value }));
          setCalculatedPiecesPrice(enteredValue);
        } else {
          // Reset to calculated value
          setFormData(prev => ({
            ...prev,
            pieces_price: calculated > 0 ? calculated.toString() : ""
          }));
          setCalculatedPiecesPrice(calculated);
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
        setCalculatedPiecesPrice(enteredValue);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));

      // If product_price or stock changes, update calculation
      if (name === 'product_price' || name === 'stock') {
        const productPrice = name === 'product_price' ? parseFloat(value) || 0 : parseFloat(formData.product_price) || 0;
        const stock = name === 'stock' ? parseInt(value) || 0 : parseInt(formData.stock) || 0;
        const calculated = productPrice * stock;

        if (calculated > 0) {
          setFormData(prev => ({
            ...prev,
            pieces_price: calculated.toString()
          }));
          setCalculatedPiecesPrice(calculated);
        }
      }
    }
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

    // Calculate expected pieces price
    const productPrice = parseFloat(formData.product_price) || 0;
    const stock = parseInt(formData.stock) || 0;
    const expectedPiecesPrice = productPrice * stock;
    const enteredPiecesPrice = parseFloat(formData.pieces_price) || 0;

    // Warn if pieces_price doesn't match calculation (unless both are 0)
    if (expectedPiecesPrice > 0 && enteredPiecesPrice !== expectedPiecesPrice) {
      const confirmUpdate = await Swal.fire({
        title: 'Price Mismatch',
        text: `Calculated Total Pieces Price is ${expectedPiecesPrice.toFixed(2)} (${productPrice} × ${stock}), but you entered ${enteredPiecesPrice.toFixed(2)}. Do you want to use the entered value?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, use entered value',
        cancelButtonText: 'No, use calculated value',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
      });

      if (!confirmUpdate.isConfirmed) {
        // Use calculated value
        setFormData(prev => ({
          ...prev,
          pieces_price: expectedPiecesPrice.toString()
        }));
        // Continue with submission after state update
        setTimeout(() => handleSubmit(e), 100);
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

  // Calculate total product value (same as pieces_price)
  const calculateTotalProductValue = () => {
    return calculatedPiecesPrice;
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

  // Calculate expected pieces price for comparison
  const expectedPiecesPrice = (parseFloat(formData.product_price) || 0) * (parseInt(formData.stock) || 0);
  const enteredPiecesPrice = parseFloat(formData.pieces_price) || 0;
  const showPriceMismatch = expectedPiecesPrice > 0 && enteredPiecesPrice !== expectedPiecesPrice;

  return (
    <div className='d-flex justify-content-center'>
      <div className="card form_div mb-5 p-3 rounded-2 w-50">
        <h1 className='d-flex justify-content-center my-4 gradient_text'>
          UPDATE SALER PRODUCT
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
                <strong>Stock (Qty):</strong> {recordData.stock || '0'}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Product Price:</strong> {parseFloat(recordData.product_price || 0).toFixed(2)}
              </div>
              <div className="col-md-6">
                <strong>Qty Price:</strong> {parseFloat(recordData.pieces_price || 0).toFixed(2)}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Calculated Value:</strong>
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
            <small className="text-muted">
              Price per piece
            </small>
          </div>

          {/* Stock Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Qty <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="number"
              name="stock"
              className="form-control p-2"
              placeholder="Enter number of pieces"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
              disabled={isUpdating}
            />
            <small className="text-muted">
              Number of pieces/quantity
            </small>
          </div>

          {/* Total Pieces Price Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Total Qty Price <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="number"
              name="pieces_price"
              className={`form-control p-2 ${showPriceMismatch ? 'border-warning' : ''}`}
              placeholder="Total pieces price"
              value={formData.pieces_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              disabled={isUpdating}
            />
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Calculated: {expectedPiecesPrice.toFixed(2)} ({formData.product_price || 0} × {formData.stock || 0})
              </small>
              {showPriceMismatch && (
                <small className="text-warning">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  Mismatch
                </small>
              )}
            </div>
          </div>

          {/* Calculation Info */}
          <div className="col-12 col-md-5 mb-3">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="card-title fw-bold">Calculation</h6>
                <div className="row">
                  <div className="col-12 mt-2">
                    <div className="text-success">
                      {formData.product_price || 0} × {formData.stock || 0} = {expectedPiecesPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="col-12 mb-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h6 className="card-title fw-bold">Amount Summary</h6>
                <div className="row">
                  <div className="col-md-4">
                    <strong>Product Price (Per Piece):</strong>
                    <div className="text-success fs-5">
                      Rs: {parseFloat(formData.product_price || 0).toFixed(2)}
                    </div>
                    <small className="text-muted">Price per unit</small>
                  </div>
                  <div className="col-md-4">
                    <strong>Total Pieces Price:</strong>
                    <div className={`fs-5 ${showPriceMismatch ? 'text-warning' : 'text-primary'}`}>
                      Rs: {parseFloat(formData.pieces_price || 0).toFixed(2)}
                    </div>
                    <small className="text-muted">
                      {showPriceMismatch ? 'Custom value entered' : 'Auto-calculated'}
                    </small>
                  </div>
                  <div className="col-md-4">
                    <strong>Pieces Quantity:</strong>
                    <div className="text-info fs-5">
                      {formData.stock || 0} pieces
                    </div>
                    <small className="text-muted">Total quantity</small>
                  </div>
                </div>
                {showPriceMismatch && (
                  <div className="row mt-3">
                    <div className="col-12">
                      <div className="alert alert-warning py-2 mb-0">
                        <small>
                          <i className="bi bi-info-circle-fill me-1"></i>
                          <strong>Note:</strong> The Total Pieces Price ({parseFloat(formData.pieces_price || 0).toFixed(2)})
                          does not match the calculated value ({expectedPiecesPrice.toFixed(2)}).
                          This may be intentional if you're applying discounts or adjustments.
                        </small>
                      </div>
                    </div>
                  </div>
                )}
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
              type="button"
              className="btn btn-primary px-4"
              onClick={() => {
                // Recalculate pieces price based on current inputs
                const productPrice = parseFloat(formData.product_price) || 0;
                const stock = parseInt(formData.stock) || 0;
                const calculated = productPrice * stock;

                if (calculated > 0) {
                  setFormData(prev => ({
                    ...prev,
                    pieces_price: calculated.toString()
                  }));
                  Swal.fire({
                    title: 'Recalculated!',
                    text: `Total Pieces Price updated to ${calculated.toFixed(2)}`,
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false
                  });
                }
              }}
              disabled={isUpdating}
            >
              Recalculate
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