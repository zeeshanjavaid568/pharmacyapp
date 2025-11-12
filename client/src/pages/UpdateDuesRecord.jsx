import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAllDuesQuery, useSingleGetDuesQuery, useUpdateDuesMutation } from '../redux/features/DuesApi/giveDuesApi';
import Swal from 'sweetalert2';

const UpdateDuesCard = () => {
  const { id } = useParams(); // Get record ID from URL parameters
  const navigate = useNavigate();
  
  // Fetch single record data
  const { data: recordData, isLoading, isError, error } = useSingleGetDuesQuery(id);
  const {refetch}=useGetAllDuesQuery();
  
  // Update mutation
  const [updateDues, { isLoading: isUpdating }] = useUpdateDuesMutation();

  const [formData, setFormData] = useState({
    name: '',
    date: '',
  });

  // Populate form when record data is loaded
  useEffect(() => {
    if (recordData) {
      setFormData({
        name: recordData.name || '',
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

    try {
      // Prepare update data - only name and date
      const updateData = {
        name: formData.name.trim(),
        date: formData.date,
        // Note: We're only updating name and date, other fields remain unchanged
      };

      // Call update API
      await updateDues({ id, userData: updateData }).unwrap();
      refetch();
      // Show success message
      Swal.fire({
        title: 'Success!',
        text: 'Dues record updated successfully',
        icon: 'success',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'sweetalert_btn_success' },
      }).then(() => {
        // Redirect back to dues record page
        navigate('/duesrecord'); // Adjust the path as per your routing
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
            <div className="row">
              <div className="col-md-6">
                <strong>Name:</strong> {recordData.name || 'N/A'}
              </div>
              <div className="col-md-6">
                <strong>Date:</strong> {formatDateForInput(recordData.date) || 'N/A'}
              </div>
            </div>
            {recordData.khata_name && (
              <div className="mt-2">
                <strong>Khata:</strong> {recordData.khata_name}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="d-flex justify-content-between flex-wrap align-items-end mx-3">
          
          {/* Name Input */}
          <div className="col-12 col-md-5 mb-3">
            <label className="form-label fw-bold">Name *</label>
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
            <label className="form-label fw-bold">Date *</label>
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