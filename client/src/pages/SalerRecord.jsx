import React, { useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2';
import { useSalerProductQuery, useDeleteSalerProductMutation } from '../redux/features/SalerProductApi/salerProductApi';

const SalerRecord = () => {
  const { data, isLoading, isError, refetch } = useSalerProductQuery();
  const [deleteSalerProduct] = useDeleteSalerProductMutation();

  const [selectedYear, setSelectedYear] = useState(null);
  const [searchProductName, setSearchProductName] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // ✅ Group data by year
  const groupDataByYear = (data) => {
    return data.reduce((acc, record) => {
      const year = new Date(record.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(record);
      return acc;
    }, {});
  };

  const yearlyData = data ? groupDataByYear(data) : {};

  // ✅ Format date (YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-CA', options).format(new Date(dateString)); // YYYY-MM-DD
  };

  // ✅ Handle Delete
  const handleDelete = async (id) => {
    try {
      await deleteSalerProduct(id).unwrap();

      // ✅ Update localStorage "profitEntries"
      const storedRecords = JSON.parse(localStorage.getItem('profitEntries')) || [];
      const updatedRecords = storedRecords.filter(record => record.id !== id);
      localStorage.setItem('profitEntries', JSON.stringify(updatedRecords));

      Swal.fire({
        title: 'Success',
        text: 'Record deleted successfully.',
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });

      refetch();
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete record. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
    }
  };

  // ✅ Records of selected year
  const records = selectedYear ? yearlyData[selectedYear] || [] : [];

  // ✅ Filter records by name & date
  const filteredRecords = records.filter((record) => {
    const matchesProductName = record.product_name?.toLowerCase().includes(searchProductName.toLowerCase());
    const matchesDate = searchDate ? formatDate(record.date) === searchDate : true;
    return matchesProductName && matchesDate;
  });

  // ✅ Show loading/error
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading data.</p>;

  return (
    <>
      {!selectedYear ? (
        <>
          <h1 className='d-flex justify-content-center my-4 gradient_text'>
            Saler All Years Record
          </h1>
          <div className='responsive_card'>
            {Object.keys(yearlyData).map((year) => (
              <div
                key={year}
                className='yearly_record_card border rounded-2 my-1 form_div text-center'
                onClick={() => setSelectedYear(year)}
                style={{ cursor: 'pointer' }}
              >
                <span className='yearly_record_links'>
                  {year} ({yearlyData[year].length} records)
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className='year_record_table d-flex justify-content-center my-4 gradient_text'>
            Saler Record Details ({selectedYear})
          </h1>

          {/* 🔙 Back Button */}
          <div className="text-center mb-3">
            <button className="btn form_div " onClick={() => setSelectedYear(null)}>
              ← Back to All Years
            </button>
          </div>

          {/* 🔍 Search Filters */}
          <div className="search-container px-3 d-flex justify-content-start align-items-center flex-wrap">
            <div className="form-group mt-2 me-2">
              <label htmlFor="productSearch">Search by Product Name:</label>
              <input
                id="productSearch"
                type="text"
                className="form-control"
                placeholder="Enter product name"
                value={searchProductName}
                onChange={(e) => setSearchProductName(e.target.value)}
              />
            </div>
            <div className="form-group mt-2">
              <label htmlFor="dateSearch">Search by Date:</label>
              <input
                id="dateSearch"
                type="date"
                className="form-control"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
          </div>

          {/* 🧾 Table */}
          <div className='table-responsive p-3'>
            <table className='table table-bordered table-hover form_div' style={{ borderRadius: '10px', overflow: 'hidden' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                <tr>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>#</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Product Name</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Product Place</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Product Price</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces Price</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Date</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr key={record.id || index}>
                    <td>{index + 1}</td>
                    <td>{record.product_name}</td>
                    <td>{record.product_place}</td>
                    <td>{record.product_price}</td>
                    <td>{record.pieces_price}</td>
                    <td>{record.stock}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <button className="delete_btn" onClick={() => handleDelete(record.id)}>
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

export default SalerRecord;
