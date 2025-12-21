import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAllDuesQuery, useSingleGetDuesQuery, useUpdateDuesMutation } from '../redux/features/DuesApi/giveDuesApi';
import Swal from 'sweetalert2';

const UpdateDuesCard = () => {
  const { id } = useParams(); // Get record ID from URL parameters
  const navigate = useNavigate();

  // Fetch single record data
  const {
    data: recordData,
    isLoading,
    isError,
    refetch: singeDataRefetch,
    error
  } = useSingleGetDuesQuery(id, {
    skip: !id, // Skip if no id
    refetchOnMountOrArgChange: true
  });

  const { refetch } = useGetAllDuesQuery();

  // Update mutation
  const [updateDues, {
    isLoading: isUpdating,
    isSuccess: updateSuccess,
    error: updateError
  }] = useUpdateDuesMutation();

  const [formData, setFormData] = useState({
    name: '',
    single_piece_price: '',
    m_pieces: '',
    total_piece: '',
    o_pieces: '',
    given_dues: '',
    taken_dues: '',
    date: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total amount (single_piece_price * (m_pieces + total_piece + o_pieces))
  const calculateTotalAmount = () => {
    const singlePrice = parseFloat(formData.single_piece_price) || 0;
    const medicinePieces = parseInt(formData.m_pieces) || 0;
    const feedPieces = parseInt(formData.total_piece) || 0;
    const otherPieces = parseInt(formData.o_pieces) || 0;

    const totalPieces = medicinePieces + feedPieces + otherPieces;
    return singlePrice * totalPieces;
  };

  // Calculate individual amounts for each piece type
  const calculateIndividualAmounts = () => {
    const singlePrice = parseFloat(formData.single_piece_price) || 0;
    const medicinePieces = parseInt(formData.m_pieces) || 0;
    const feedPieces = parseInt(formData.total_piece) || 0;
    const otherPieces = parseInt(formData.o_pieces) || 0;

    return {
      medicineAmount: singlePrice * medicinePieces,
      feedAmount: singlePrice * feedPieces,
      otherAmount: singlePrice * otherPieces,
      totalAmount: singlePrice * (medicinePieces + feedPieces + otherPieces)
    };
  };

  const { medicineAmount, feedAmount, otherAmount, totalAmount } = calculateIndividualAmounts();

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    }

    // Validate numeric fields
    const numericFields = [
      'single_piece_price',
      'm_pieces',
      'total_piece',
      'o_pieces',
      'given_dues',
      'taken_dues'
    ];

    numericFields.forEach(field => {
      if (formData[field] && isNaN(formData[field])) {
        errors[field] = `${field.replace(/_/g, ' ')} must be a valid number`;
      }

      // Additional validation for negative numbers
      if (formData[field] && parseFloat(formData[field]) < 0) {
        errors[field] = `${field.replace(/_/g, ' ')} cannot be negative`;
      }
    });

    // Validate at least one piece type has quantity
    const totalPieces = (parseInt(formData.m_pieces) || 0) +
      (parseInt(formData.total_piece) || 0) +
      (parseInt(formData.o_pieces) || 0);

    if (totalPieces > 0 && (parseFloat(formData.single_piece_price) || 0) <= 0) {
      errors.single_piece_price = 'Price must be greater than 0 when there are pieces';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Populate form when record data is loaded
  useEffect(() => {
    if (recordData?.data) {
      // Check if recordData.data exists (common pattern in RTK Query)
      const data = recordData.data;
      setFormData({
        name: data.name || '',
        single_piece_price: data.single_piece_price?.toString() || '',
        m_pieces: data.m_pieces?.toString() || '',
        total_piece: data.total_piece?.toString() || '',
        o_pieces: data.o_pieces?.toString() || '',
        given_dues: data.given_dues?.toString() || '',
        taken_dues: data.taken_dues?.toString() || '',
        date: formatDateForInput(data.date) || '',
      });
    } else if (recordData) {
      // Fallback if data is not nested
      setFormData({
        name: recordData.name || '',
        single_piece_price: recordData.single_piece_price?.toString() || '',
        m_pieces: recordData.m_pieces?.toString() || '',
        total_piece: recordData.total_piece?.toString() || '',
        o_pieces: recordData.o_pieces?.toString() || '',
        given_dues: recordData.given_dues?.toString() || '',
        taken_dues: recordData.taken_dues?.toString() || '',
        date: formatDateForInput(recordData.date) || '',
      });
    }
  }, [recordData]);

  // Handle update success or error
  useEffect(() => {
    if (updateSuccess) {
      Swal.fire({
        title: 'Success!',
        text: 'Dues record updated successfully',
        icon: 'success',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'sweetalert_btn_success' },
      }).then(() => {
        refetch();
        navigate('/duesrecord');
      });
      setIsSubmitting(false);
    }

    if (updateError) {
      Swal.fire({
        title: 'Error!',
        text: updateError?.data?.message || 'Failed to update dues record. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
      setIsSubmitting(false);
    }
  }, [updateSuccess, updateError, refetch, navigate]);

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

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        title: 'Validation Error!',
        text: 'Please fix the errors in the form',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        single_piece_price: formData.single_piece_price ? parseFloat(formData.single_piece_price) : 0,
        m_pieces: formData.m_pieces ? parseInt(formData.m_pieces) : 0,
        total_piece: formData.total_piece ? parseInt(formData.total_piece) : 0,
        o_pieces: formData.o_pieces ? parseInt(formData.o_pieces) : 0,
        given_dues: formData.given_dues ? parseFloat(formData.given_dues) : 0,
        taken_dues: formData.taken_dues ? parseFloat(formData.taken_dues) : 0,
        date: formData.date,
      };

      // Call update API
      await updateDues({
        id,
        userData: updateData
      }).unwrap();

      // Refetch data
      await Promise.all([
        refetch(),
        singeDataRefetch()
      ]);

    } catch (error) {
      console.error('Update failed:', error);
      Swal.fire({
        title: 'Error!',
        text: error?.data?.message || 'Failed to update dues record. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
      setIsSubmitting(false);
    }
  };

  // Format display amount with commas
  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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
  if (isError || !recordData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="alert alert-danger text-center w-50">
          <h5>Error Loading Record</h5>
          <p>{error?.data?.message || 'Failed to load the dues record. Please try again.'}</p>
          <div className="d-flex justify-content-center gap-2">
            <button
              className="btn btn-primary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => singeDataRefetch()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get current record data (with fallback)
  const currentRecord = recordData.data || recordData;

  return (
    <div className='d-flex justify-content-center'>
      <div className="card form_div mb-5 p-3 rounded-2 w-50">
        <h1 className='d-flex justify-content-center my-4 gradient_text'>
          Update Dues Record
        </h1>

        {/* Current Record Info */}
        {currentRecord && (
          <div className="alert alert-info mx-3 mb-4">
            <h6 className="fw-bold">Current Record Information:</h6>
            <div className='mb-2'>
              {currentRecord.khata_name && (
                <div className="mt-2">
                  <strong>Khata:</strong> {currentRecord.khata_name}
                </div>
              )}
            </div>
            <div className="row">
              <div className="col-md-6">
                <strong>Name:</strong> {currentRecord.name || 'N/A'}
              </div>
              <div className="col-md-6">
                <strong>Date:</strong> {formatDateForInput(currentRecord.date) || 'N/A'}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Single Piece Price:</strong> {formatAmount(currentRecord.single_piece_price)}
              </div>
              <div className="col-md-6">
                <strong>Total Pieces:</strong>
                {(parseInt(currentRecord.m_pieces || 0) +
                  parseInt(currentRecord.total_piece || 0) +
                  parseInt(currentRecord.o_pieces || 0))}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Total Amount:</strong> {formatAmount(
                  (parseFloat(currentRecord.single_piece_price || 0) *
                    (parseInt(currentRecord.m_pieces || 0) +
                      parseInt(currentRecord.total_piece || 0) +
                      parseInt(currentRecord.o_pieces || 0)))
                )}
              </div>
              <div className="col-md-6">
                <strong>Net Amount:</strong> {formatAmount(
                  (parseFloat(currentRecord.taken_dues || 0) -
                    parseFloat(currentRecord.given_dues || 0))
                )}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Medicine Pieces:</strong> {currentRecord.m_pieces || '0'}
              </div>
              <div className="col-md-6">
                <strong>Feed Pieces:</strong> {currentRecord.total_piece || '0'}
              </div>
              <div className="col-md-6 mt-2">
                <strong>Other Pieces:</strong> {currentRecord.o_pieces || '0'}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Given Dues:</strong> {formatAmount(currentRecord.given_dues)}
              </div>
              <div className="col-md-6">
                <strong>Taken Dues:</strong> {formatAmount(currentRecord.taken_dues)}
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
              className={`form-control p-2 ${formErrors.name ? 'is-invalid' : ''}`}
              placeholder="Enter name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isUpdating || isSubmitting}
            />
            {formErrors.name && (
              <div className="invalid-feedback">{formErrors.name}</div>
            )}
          </div>

          {/* Date Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Date <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="date"
              name="date"
              className={`form-control p-2 ${formErrors.date ? 'is-invalid' : ''}`}
              value={formData.date}
              onChange={handleChange}
              required
              disabled={isUpdating || isSubmitting}
            />
            {formErrors.date && (
              <div className="invalid-feedback">{formErrors.date}</div>
            )}
          </div>

          {/* Single Piece Price Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Single Piece Price <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="number"
              name="single_piece_price"
              className={`form-control p-2 ${formErrors.single_piece_price ? 'is-invalid' : ''}`}
              placeholder="Enter single piece price"
              value={formData.single_piece_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              disabled={isUpdating || isSubmitting}
            />
            {formErrors.single_piece_price && (
              <div className="invalid-feedback">{formErrors.single_piece_price}</div>
            )}
            {formData.single_piece_price && formData.m_pieces && (
              <small className="text-muted">
                Medicine Amount: {formatAmount(medicineAmount)} ({formData.single_piece_price} × {formData.m_pieces})
              </small>
            )}
          </div>

          {/* Medicine Total Pieces Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Medicine Total Pieces</label>
            <input
              type="number"
              name="m_pieces"
              className={`form-control p-2 ${formErrors.m_pieces ? 'is-invalid' : ''}`}
              placeholder="Enter medicine pieces"
              value={formData.m_pieces}
              onChange={handleChange}
              min="0"
              disabled={isUpdating || isSubmitting}
            />
            {formErrors.m_pieces && (
              <div className="invalid-feedback">{formErrors.m_pieces}</div>
            )}
            {formData.single_piece_price && formData.m_pieces && (
              <small className="text-muted">
                Medicine Amount: {formatAmount(medicineAmount)} ({formData.single_piece_price} × {formData.m_pieces})
              </small>
            )}
          </div>

          {/* Feed Total Pieces Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Feed Total Pieces</label>
            <input
              type="number"
              name="total_piece"
              className={`form-control p-2 ${formErrors.total_piece ? 'is-invalid' : ''}`}
              placeholder="Enter feed pieces"
              value={formData.total_piece}
              onChange={handleChange}
              min="0"
              disabled={isUpdating || isSubmitting}
            />
            {formErrors.total_piece && (
              <div className="invalid-feedback">{formErrors.total_piece}</div>
            )}
            {formData.single_piece_price && formData.total_piece && (
              <small className="text-muted">
                Feed Amount: {formatAmount(feedAmount)} ({formData.single_piece_price} × {formData.total_piece})
              </small>
            )}
          </div>

          {/* Other Total Pieces Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Other Total Pieces</label>
            <input
              type="number"
              name="o_pieces"
              className={`form-control p-2 ${formErrors.o_pieces ? 'is-invalid' : ''}`}
              placeholder="Enter other pieces"
              value={formData.o_pieces}
              onChange={handleChange}
              min="0"
              disabled={isUpdating || isSubmitting}
            />
            {formErrors.o_pieces && (
              <div className="invalid-feedback">{formErrors.o_pieces}</div>
            )}
            {formData.single_piece_price && formData.o_pieces && (
              <small className="text-muted">
                Other Amount: {formatAmount(otherAmount)} ({formData.single_piece_price} × {formData.o_pieces})
              </small>
            )}
          </div>

          {/* Calculated Total Amount (Read-only) */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Total Amount (Calculated) <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="text"
              className="form-control p-2 bg-light"
              value={formatAmount(totalAmount)}
              readOnly
              disabled
              style={{ fontWeight: 'bold', color: '#198754' }}
            />
            <small className="text-muted">
              Single Piece Price × (Medicine + Feed + Other) = {formatAmount(totalAmount)}
            </small>
            {formData.single_piece_price && (
              <div className="mt-1">
                <small>
                  Breakdown: Medicine({formatAmount(medicineAmount)}) + Feed({formatAmount(feedAmount)}) + Other({formatAmount(otherAmount)})
                </small>
              </div>
            )}
          </div>

          {/* Empty column for layout balance */}
          <div className="col-12 col-md-5 mb-3"></div>

          {/* Given Dues Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Given Dues</label>
            <input
              type="number"
              name="given_dues"
              className={`form-control p-2 ${formErrors.given_dues ? 'is-invalid' : ''}`}
              placeholder="Enter given dues"
              value={formData.given_dues}
              onChange={handleChange}
              step="0.01"
              min="0"
              disabled={isUpdating || isSubmitting}
            />
            {formErrors.given_dues && (
              <div className="invalid-feedback">{formErrors.given_dues}</div>
            )}
          </div>

          {/* Taken Dues Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Taken Dues</label>
            <input
              type="number"
              name="taken_dues"
              className={`form-control p-2 ${formErrors.taken_dues ? 'is-invalid' : ''}`}
              placeholder="Enter taken dues"
              value={formData.taken_dues}
              onChange={handleChange}
              step="0.01"
              min="0"
              disabled={isUpdating || isSubmitting}
            />
            {formErrors.taken_dues && (
              <div className="invalid-feedback">{formErrors.taken_dues}</div>
            )}
          </div>

          {/* Net Amount Calculation (Read-only) */}
          <div className="col-12 mb-3">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h6 className="card-title fw-bold">Amount Summary</h6>
                <div className="row">
                  <div className="col-md-3">
                    <strong>Total Amount:</strong>
                    <div className="text-success fs-5">{formatAmount(totalAmount)}</div>
                    <small className="text-muted">(Price × All Pieces)</small>
                  </div>
                  <div className="col-md-3">
                    <strong>Net Dues:</strong>
                    <div className={`fs-5 ${(parseFloat(formData.taken_dues || 0) - parseFloat(formData.given_dues || 0)) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatAmount((parseFloat(formData.taken_dues || 0) - parseFloat(formData.given_dues || 0)))}
                    </div>
                    <small className="text-muted">(Taken - Given)</small>
                  </div>
                  <div className="col-md-3">
                    <strong>Balance:</strong>
                    <div className={`fs-5 ${(totalAmount + (parseFloat(formData.taken_dues || 0) - parseFloat(formData.given_dues || 0))) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatAmount((totalAmount + (parseFloat(formData.taken_dues || 0) - parseFloat(formData.given_dues || 0))))}
                    </div>
                    <small className="text-muted">(Total + Net Dues)</small>
                  </div>
                  <div className="col-md-3">
                    <strong>Total Pieces:</strong>
                    <div className="text-primary fs-5">
                      {(parseInt(formData.m_pieces || 0) + parseInt(formData.total_piece || 0) + parseInt(formData.o_pieces || 0))}
                    </div>
                    <small className="text-muted">(M + F + O)</small>
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
              disabled={isUpdating || isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger px-4"
              disabled={isUpdating || isSubmitting}
            >
              {(isUpdating || isSubmitting) ? (
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