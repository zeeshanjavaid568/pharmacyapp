import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAllDuesQuery, useSingleGetDuesQuery, useUpdateDuesMutation } from '../redux/features/DuesApi/giveDuesApi';
import Swal from 'sweetalert2';

const UpdateDuesCard = () => {
  const { id } = useParams(); // Get record ID from URL parameters
  const navigate = useNavigate();

  // Fetch single record data
  const { data: recordData, isLoading, isError, refetch: singeDataRefetch, error } = useSingleGetDuesQuery(id);
  const { refetch } = useGetAllDuesQuery();

  // Update mutation
  const [updateDues, { isLoading: isUpdating }] = useUpdateDuesMutation();

  const [formData, setFormData] = useState({
    name: '',
    single_piece_price: '',
    total_piece: '',
    given_dues: '',
    taken_dues: '',
    date: '',
  });

  // Calculate total amount (single_piece_price * total_piece)
  const calculateTotalAmount = () => {
    const singlePrice = parseFloat(formData.single_piece_price) || 0;
    const totalPieces = parseInt(formData.total_piece) || 0;
    return singlePrice * totalPieces;
  };

  const totalAmount = calculateTotalAmount();

  // Populate form when record data is loaded
  useEffect(() => {
    if (recordData) {
      setFormData({
        name: recordData.name || '',
        single_piece_price: recordData.single_piece_price || '',
        total_piece: recordData.total_piece || '',
        given_dues: recordData.given_dues || '',
        taken_dues: recordData.taken_dues || '',
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
    if (!formData.name.trim()) {
      Swal.fire({
        title: 'Error!',
        text: 'Please enter a name',
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
    const numericFields = [
      'single_piece_price',
      'total_piece',
      'given_dues',
      'taken_dues'
    ];

    for (const field of numericFields) {
      if (formData[field] && isNaN(formData[field])) {
        Swal.fire({
          title: 'Error!',
          text: `${field.replace(/_/g, ' ')} must be a valid number`,
          icon: 'error',
          confirmButtonText: 'Ok',
        });
        return;
      }
    }

    // Validate that at least one of given_dues or taken_dues is provided
    if (!formData.given_dues && !formData.taken_dues) {
      Swal.fire({
        title: 'Error!',
        text: 'Please provide either Given Dues or Taken Dues',
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'sweetalert_btn_error' },

      });
      return;
    }

    try {
      // Prepare update data with all fields
      const updateData = {
        name: formData.name.trim(),
        single_piece_price: formData.single_piece_price ? parseFloat(formData.single_piece_price) : 0,
        total_piece: formData.total_piece ? parseInt(formData.total_piece) : 0,
        given_dues: formData.given_dues ? parseFloat(formData.given_dues) : 0,
        taken_dues: formData.taken_dues ? parseFloat(formData.taken_dues) : 0,
        date: formData.date,
      };

      // Call update API
      await updateDues({ id, userData: updateData }).unwrap();
      refetch();
      singeDataRefetch();

      // Show success message
      Swal.fire({
        title: 'Success!',
        text: 'Dues record updated successfully',
        icon: 'success',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'sweetalert_btn_success' },
      }).then(() => {
        // Redirect back to dues record page
        navigate('/duesrecord');
      });

    } catch (error) {
      console.error('Update failed:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update dues record. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
    }
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
          <p>Failed to load the dues record. Please try again.</p>
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
          Update Dues Record
        </h1>

        {/* Current Record Info */}
        {recordData && (
          <div className="alert alert-info mx-3 mb-4">
            <h6 className="fw-bold">Current Record Information:</h6>
            <div className='mb-2'>
              {recordData.khata_name && (
                <div className="mt-2">
                  <strong>Khata:</strong> {recordData.khata_name}
                </div>
              )}
            </div>
            <div className="row">
              <div className="col-md-6">
                <strong>Name:</strong> {recordData.name || 'N/A'}
              </div>
              <div className="col-md-6">
                <strong>Date:</strong> {formatDateForInput(recordData.date) || 'N/A'}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Single Piece Price:</strong> {recordData.single_piece_price || '0'}
              </div>
              <div className="col-md-6">
                <strong>Total Pieces:</strong> {recordData.total_piece || '0'}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Total Amount:</strong> {(parseFloat(recordData.single_piece_price || 0) * parseInt(recordData.total_piece || 0)).toFixed(2)}
              </div>
              <div className="col-md-6">
                <strong>Net Amount:</strong> {(parseFloat(recordData.taken_dues || 0) - parseFloat(recordData.given_dues || 0)).toFixed(2)}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Given Dues:</strong> {recordData.given_dues || '0'}
              </div>
              <div className="col-md-6">
                <strong>Taken Dues:</strong> {recordData.taken_dues || '0'}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="d-flex justify-content-between flex-wrap align-items-end mx-3">

          {/* Name Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Name <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="text"
              name="name"
              className="form-control p-2"
              placeholder="Enter name"
              value={formData.name}
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

          {/* Single Piece Price Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Single Piece Price <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="number"
              name="single_piece_price"
              className="form-control p-2"
              placeholder="Enter single piece price"
              value={formData.single_piece_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              disabled={isUpdating}
            />
          </div>

          {/* Total Pieces Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Total Pieces <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="number"
              name="total_piece"
              className="form-control p-2"
              placeholder="Enter total pieces"
              value={formData.total_piece}
              onChange={handleChange}
              min="0"
              disabled={isUpdating}
            />
          </div>

          {/* Calculated Total Amount (Read-only) */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Total Amount (Calculated)</label>
            <input
              type="number"
              className="form-control p-2 bg-light"
              value={totalAmount.toFixed(2)}
              readOnly
              disabled
              style={{ fontWeight: 'bold', color: '#198754' }}
            />
            <small className="text-muted">
              Single Piece Price × Total Pieces = {totalAmount.toFixed(2)}
            </small>
          </div>

          {/* Empty column for layout balance */}
          <div className="col-12 col-md-5 mb-3"></div>

          {/* Given Dues Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Given Dues</label>
            <input
              type="number"
              name="given_dues"
              className="form-control p-2"
              placeholder="Enter given dues"
              value={formData.given_dues}
              onChange={handleChange}
              step="0.01"
              min="0"
              disabled={isUpdating}
            />
          </div>

          {/* Taken Dues Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Taken Dues</label>
            <input
              type="number"
              name="taken_dues"
              className="form-control p-2"
              placeholder="Enter taken dues"
              value={formData.taken_dues}
              onChange={handleChange}
              step="0.01"
              min="0"
              disabled={isUpdating}
            />
          </div>

          {/* Net Amount Calculation (Read-only) */}
          <div className="col-12 mb-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h6 className="card-title fw-bold">Amount Summary</h6>
                <div className="row">
                  <div className="col-md-4">
                    <strong>Total Amount:</strong>
                    <div className="text-success fs-5">{totalAmount.toFixed(2)}</div>
                    <small className="text-muted">(Price × Pieces)</small>
                  </div>
                  <div className="col-md-4">
                    <strong>Net Dues:</strong>
                    <div className={`fs-5 ${(parseFloat(formData.taken_dues || 0) - parseFloat(formData.given_dues || 0)) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {(parseFloat(formData.taken_dues || 0) - parseFloat(formData.given_dues || 0)).toFixed(2)}
                    </div>
                    <small className="text-muted">(Taken - Given)</small>
                  </div>
                  <div className="col-md-4">
                    <strong>Balance:</strong>
                    <div className={`fs-5 ${(totalAmount + (parseFloat(formData.taken_dues || 0) - parseFloat(formData.given_dues || 0))) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {(totalAmount + (parseFloat(formData.taken_dues || 0) - parseFloat(formData.given_dues || 0))).toFixed(2)}
                    </div>
                    <small className="text-muted">(Total + Net Dues)</small>
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
              onClick={() => navigate('/duesrecord')}
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
                'Update Dues'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateDuesCard;