import React, { useState, useMemo, useEffect } from 'react';
import swal from 'sweetalert2/dist/sweetalert2';
import { useCreateGivenDuesMutation } from '../../redux/features/DuesApi/giveDuesApi';

const GiveDuesCard = ({ lastPrice, refetchData }) => {
  const [formData, setFormData] = useState({
    name: '',
    single_piece_price: '',
    total_piece: '',
    given_dues: '',
    taken_dues: '',
    taken_dues_2: '',
    price: '',
    date: '',
  });

  const [difference, setDifference] = useState(0);
  const [errors, setErrors] = useState({});
  const [createGivenDues, { isLoading }] = useCreateGivenDuesMutation();

  // ✅ Auto-update taken_dues_2 & price whenever lastPrice changes (after delete or add)
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      taken_dues_2: lastPrice || 0,
      price: (Number(prev.taken_dues) || 0) + (Number(lastPrice) || 0),
    }));
  }, [lastPrice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculatedTotal = useMemo(() => {
    const price = Number(formData.single_piece_price) || 0;
    const pieces = Number(formData.total_piece) || 0;
    return price * pieces;
  }, [formData.single_piece_price, formData.total_piece]);

  // ✅ Auto calculate difference and remains total price
  useEffect(() => {
    const given = Number(formData.given_dues) || 0;
    const taken = Number(formData.taken_dues) || 0;
    const taken2 = Number(formData.taken_dues_2) || 0;
    const diff = taken2 - given;
    setDifference(diff);
    const totalRemains = diff + taken;
    setFormData((prev) => ({ ...prev, price: totalRemains }));
  }, [formData.given_dues, formData.taken_dues, formData.taken_dues_2]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.date) newErrors.date = 'Date is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createGivenDues({
        ...formData,
        single_piece_price: Number(formData.single_piece_price) || 0,
        total_piece: Number(formData.total_piece) || 0,
        given_dues: Number(formData.given_dues) || 0,
        taken_dues: Number(formData.taken_dues) || 0,
        taken_dues_2: Number(formData.taken_dues_2) || 0,
        price: Number(formData.price) || 0,
      }).unwrap();

      swal.fire({
        title: 'Success',
        text: 'Given dues added successfully!',
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });

      setFormData({
        name: '',
        single_piece_price: '',
        total_piece: '',
        given_dues: '',
        taken_dues: '',
        taken_dues_2: lastPrice || 0,
        price: lastPrice || 0,
        date: '',
      });
      setDifference(0);
      setErrors({});
      refetchData(); // refresh data for updated last price
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
      <form className="d-flex justify-content-between flex-wrap align-items-end" onSubmit={handleSubmit}>
        {/* ✅ Name */}
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

        {/* ✅ Total Piece Price */}
        <div className="col-auto">
          <label className="me-2">Total Piece Price</label>
          <div className="form-control p-1 my-2 bg-light">{calculatedTotal || 0}</div>
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

        {/* ✅ Remains Total Price */}
        <div className="col-auto">
          <label className="me-2">Remains Total Price (Auto)</label>
          <input
            type="number"
            name="price"
            className="form-control p-1 my-2 bg-light"
            value={formData.price}
            readOnly
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

        {/* ✅ Submit */}
        <div className="col-auto mb-2">
          <button type="submit" className="btn btn-danger my-2" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Add Given Dues'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GiveDuesCard;
