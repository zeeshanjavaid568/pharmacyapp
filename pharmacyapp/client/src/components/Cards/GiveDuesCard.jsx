import React, { useState } from 'react';
import swal from 'sweetalert2/dist/sweetalert2';
import { useCreateGivenDuesMutation, useGetAllDuesQuery } from '../../redux/features/DuesApi/giveDuesApi';

const GiveDuesCard = () => {
  const [dailyForm, setDailyForm] = useState({
    name: '',
    price: '',
    date: '',
  });

  const [errors, setErrors] = useState({});
  const [createDailyBuyerProductTotalPrice, { isLoading }] =
    useCreateGivenDuesMutation();
  const { refetch } = useGetAllDuesQuery();


  // ✅ Handle input changes dynamically
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDailyForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Validation logic
  const validate = () => {
    const newErrors = {};

    if (!dailyForm.name.trim()) {
      newErrors.name = 'Name is required.';
    } else if (dailyForm.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    if (!dailyForm.price) {
      newErrors.price = 'Price is required.';
    } else if (isNaN(dailyForm.price) || Number(dailyForm.price) <= 0) {
      newErrors.price = 'Price must be a valid positive number.';
    }

    if (!dailyForm.date) {
      newErrors.date = 'Date is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // ✅ Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createDailyBuyerProductTotalPrice({
        name: dailyForm.name,
        price: Number(dailyForm.price),
        date: dailyForm.date,
      }).unwrap();

      swal.fire({
        title: 'Success',
        text: 'Given dues added successfully!',
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });

      // ✅ Reset form
      setDailyForm({ name: '', price: '', date: '' });
      refetch();
      setErrors({});
    } catch (err) {
      swal.fire({
        title: 'Error!',
        text: 'Failed to add given dues. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
    }
  };

  return (
    <div className="card form_div mb-5 p-3 rounded-2 w-100">
      <form
        className="d-flex justify-content-between flex-wrap align-items-end"
        onSubmit={handleSubmit}
      >
        {/* ✅ Name Field */}
        <div className="col-auto">
          <label className="me-2">Name</label>
          <input
            type="text"
            name="name"
            className={`form-control p-1 my-2 ${errors.name ? 'is-invalid' : ''}`}
            placeholder="Enter name"
            value={dailyForm.name}
            onChange={handleChange}
          />
          {errors.name && (
            <div className="text-danger mb-1" style={{ fontSize: '0.875rem' }}>
              {errors.name}
            </div>
          )}
        </div>

        {/* ✅ Price Field */}
        <div className="col-auto">
          <label className="me-2">Price</label>
          <input
            type="number"
            name="price"
            className={`form-control p-1 my-2 ${errors.price ? 'is-invalid' : ''}`}
            placeholder="Enter price"
            value={dailyForm.price}
            onChange={handleChange}
          />
          {errors.price && (
            <div className="text-danger mb-1" style={{ fontSize: '0.875rem' }}>
              {errors.price}
            </div>
          )}
        </div>

        {/* ✅ Date Field */}
        <div className="col-auto">
          <label className="me-2">Date</label>
          <input
            type="date"
            name="date"
            className={`form-control p-1 my-2 ${errors.date ? 'is-invalid' : ''}`}
            value={dailyForm.date}
            onChange={handleChange}
          />
          {errors.date && (
            <div className="text-danger mb-1" style={{ fontSize: '0.875rem' }}>
              {errors.date}
            </div>
          )}
        </div>

        {/* ✅ Submit Button */}
        <div className="col-aut mb-2">
          <button
            type="submit"
            className="btn btn-danger my-2"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Add Given Dues'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GiveDuesCard;
