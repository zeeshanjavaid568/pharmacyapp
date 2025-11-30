import React, { useState, useMemo, useEffect } from 'react';
import swal from 'sweetalert2/dist/sweetalert2';
import { useCreateGivenDuesMutation } from '../../redux/features/DuesApi/giveDuesApi';

const DuesCard = ({ lastPrice, refetchData }) => {
  const [formData, setFormData] = useState({
    khata_name: '',
    name: '',
    single_piece_price: '',
    m_pieces: '',        // Medicine pieces
    total_piece: '',     // Feed pieces (keeping original name for consistency)
    o_pieces: '',        // Other pieces
    given_dues: '',
    taken_dues: '',
    taken_dues_2: '',
    price: '',
    date: '',
  });

  const [difference, setDifference] = useState(0);
  const [errors, setErrors] = useState({});
  const [createGivenDues, { isLoading }] = useCreateGivenDuesMutation();

  // ✅ Auto-update taken_dues_2 & price whenever lastPrice changes
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

  // ✅ Calculate total price based on all three piece types
  const calculatedTotal = useMemo(() => {
    const price = Number(formData.single_piece_price) || 0;
    const medicinePieces = Number(formData.m_pieces) || 0;
    const feedPieces = Number(formData.total_piece) || 0;
    const otherPieces = Number(formData.o_pieces) || 0;

    const totalPieces = medicinePieces + feedPieces + otherPieces;
    return price * totalPieces;
  }, [formData.single_piece_price, formData.m_pieces, formData.total_piece, formData.o_pieces]);

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
    if (!formData.khata_name.trim()) newErrors.khata_name = 'Khata Name is required.';
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.date) newErrors.date = 'Date is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // ✅ Prepare data for submission including all three piece types
      const submissionData = {
        khata_name: formData.khata_name,
        name: formData.name,
        single_piece_price: Number(formData.single_piece_price) || 0,
        m_pieces: Number(formData.m_pieces) || 0,           // Medicine pieces
        total_piece: Number(formData.total_piece) || 0,     // Feed pieces
        o_pieces: Number(formData.o_pieces) || 0,           // Other pieces
        given_dues: Number(formData.given_dues) || 0,
        taken_dues: Number(formData.taken_dues) || 0,
        taken_dues_2: Number(formData.taken_dues_2) || 0,
        price: Number(formData.price) || 0,
        date: formData.date,
      };

      await createGivenDues(submissionData).unwrap();

      swal.fire({
        title: 'Success',
        text: 'Given dues added successfully!',
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });

      // ✅ Reset form with all fields
      setFormData({
        khata_name: '',
        name: '',
        single_piece_price: '',
        m_pieces: '',
        total_piece: '',
        o_pieces: '',
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
      console.error('Submission error:', err);
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
        {/* ✅ Khata Name */}
        <div className="col-auto">
          <label className="me-2">Khata Name</label>
          <input
            type="text"
            name="khata_name"
            className={`form-control p-1 my-2 ${errors.khata_name ? 'is-invalid' : ''}`}
            placeholder="Enter khata name"
            value={formData.khata_name}
            onChange={handleChange}
          />
          {errors.khata_name && <div className="text-danger mb-1">{errors.khata_name}</div>}
        </div>

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

        {/* ✅ Medicine Total Piece */}
        <div className="col-auto">
          <label className="me-2">Medicine Total Piece</label>
          <input
            type="number"
            name="m_pieces"
            className="form-control p-1 my-2"
            placeholder="Enter medicine pieces"
            value={formData.m_pieces}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Feed Total Piece */}
        <div className="col-auto">
          <label className="me-2">Feed Total Piece</label>
          <input
            type="number"
            name="total_piece"
            className="form-control p-1 my-2"
            placeholder="Enter feed pieces"
            value={formData.total_piece}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Other Total Piece */}
        <div className="col-auto">
          <label className="me-2">Other Total Piece</label>
          <input
            type="number"
            name="o_pieces"
            className="form-control p-1 my-2"
            placeholder="Enter other pieces"
            value={formData.o_pieces}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Total Piece Price (Auto-calculated) */}
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

        {/* ✅ Remains Total Price (Auto-calculated) */}
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

        {/* ✅ Difference Display */}
        <div className="col-auto">
          <label className="me-2">Difference</label>
          <div className={`form-control p-1 my-2 bg-light ${difference < 0 ? 'text-danger' : 'text-success'}`}>
            {difference}
          </div>
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
          <button type="submit" className="btn btn-danger my-2" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Add Dues'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DuesCard;