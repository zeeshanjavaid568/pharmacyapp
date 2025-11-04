import React, { useState } from 'react';
import swal from 'sweetalert2/dist/sweetalert2';
import { useCreateGivenDuesMutation, useGetAllDuesQuery } from '../../redux/features/DuesApi/giveDuesApi';

const GiveDuesCard = () => {
  // ✅ All input fields in a single state
  const [formData, setFormData] = useState({
    name: '',
    single_piece_price: '',
    total_piece: '',
    given_dues: '',
    taken_dues: '',
    price: '',
    date: '',
  });

  const [errors, setErrors] = useState({});
  const [createGivenDues, { isLoading }] = useCreateGivenDuesMutation();
  const { refetch } = useGetAllDuesQuery();

  // ✅ Handle input changes dynamically
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Validate only required fields
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required.';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // ✅ Send all fields to database
      await createGivenDues({
        name: formData.name,
        single_piece_price: Number(formData.single_piece_price) || 0,
        total_piece: Number(formData.total_piece) || 0,
        given_dues: Number(formData.given_dues) || 0,
        taken_dues: Number(formData.taken_dues) || 0,
        price: Number(formData.price) || 0,
        date: formData.date,
      }).unwrap();

      swal.fire({
        title: 'Success',
        text: 'Given dues added successfully!',
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });

      // ✅ Reset form and refresh data
      setFormData({
        name: '',
        single_piece_price: '',
        total_piece: '',
        given_dues: '',
        taken_dues: '',
        price: '',
        date: '',
      });
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
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <div className="text-danger mb-1">{errors.name}</div>}
        </div>

        {/* ✅ Single Piece Price */}
        <div className="col-auto">
          <label className="me-2">Single Piece Price</label>
          <input
            type="number"
            name="single_piece_price"
            className="form-control p-1 my-2"
            placeholder="Enter single piece price"
            value={formData.single_piece_price}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Total Piece */}
        <div className="col-auto">
          <label className="me-2">Total Piece</label>
          <input
            type="number"
            name="total_piece"
            className="form-control p-1 my-2"
            placeholder="Enter total pieces"
            value={formData.total_piece}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Given Dues */}
        <div className="col-auto">
          <label className="me-2">Given Dues</label>
          <input
            type="number"
            name="given_dues"
            className="form-control p-1 my-2"
            placeholder="Enter given dues"
            value={formData.given_dues}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Taken Dues */}
        <div className="col-auto">
          <label className="me-2">Taken Dues</label>
          <input
            type="number"
            name="taken_dues"
            className="form-control p-1 my-2"
            placeholder="Enter taken dues"
            value={formData.taken_dues}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Total Price */}
        <div className="col-auto">
          <label className="me-2">Total Price</label>
          <input
            type="number"
            name="price"
            className="form-control p-1 my-2"
            placeholder="Enter total price"
            value={formData.price}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Date */}
        <div className="col-auto">
          <label className="me-2">Date</label>
          <input
            type="date"
            name="date"
            className={`form-control p-1 my-2 ${errors.date ? 'is-invalid' : ''}`}
            value={formData.date}
            onChange={handleChange}
          />
          {errors.date && <div className="text-danger mb-1">{errors.date}</div>}
        </div>

        {/* ✅ Submit Button */}
        <div className="col-auto mb-2">
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
