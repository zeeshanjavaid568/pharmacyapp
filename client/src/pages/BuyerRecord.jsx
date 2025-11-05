import React, { useState } from 'react';
import { useBuyerProductQuery, useDeleteBuyerProductMutation } from '../redux/features/BuyerProductApi/buyerProductApi';
import Swal from 'sweetalert2/dist/sweetalert2';

const BuyerRecord = () => {
  const { data, isLoading, isError, refetch } = useBuyerProductQuery();
  const [deleteBuyerProduct] = useDeleteBuyerProductMutation();

  const [selectedYear, setSelectedYear] = useState(null);
  const [searchProductName, setSearchProductName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchExpireDate, setSearchExpireDate] = useState('');

  // ✅ Helper: Group data by year
  const groupDataByYear = (data) => {
    return data.reduce((acc, record) => {
      const year = new Date(record.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(record);
      return acc;
    }, {});
  };

  const yearlyData = data ? groupDataByYear(data) : {};

  // ✅ Helper: Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  // ✅ Delete Record
  const handleDelete = async (id) => {
    try {
      await deleteBuyerProduct(id).unwrap();
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

  // ✅ Filter records if a year is selected
  const records = selectedYear ? yearlyData[selectedYear] || [] : [];

  const filteredRecords = records.filter((record) => {
    const matchesProductName = record.product_name
      ?.toLowerCase()
      .includes(searchProductName.toLowerCase());
    const matchesDate = searchDate ? formatDate(record.date) === searchDate : true;
    const matchesExpireDate = searchExpireDate
      ? formatDate(record.expire_date) === searchExpireDate
      : true;
    return matchesProductName && matchesDate && matchesExpireDate;
  });

  // ✅ Show loading / error
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading data.</p>;

  return (
    <>
      {!selectedYear ? (
        <>
          <h1 className='d-flex justify-content-center my-4 gradient_text'>
            Buyer All Years Record
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
            Buyer Year Record Details ({selectedYear})
          </h1>

          {/* 🔙 Back Button */}
          <div className="text-center mb-3">
            <button className="btn border rounded-2 my-1 form_div text-center" onClick={() => setSelectedYear(null)}>
              ← Back to All Years
            </button>
          </div>

          {/* 🔍 Search Filters */}
          <div className="search-container px-3 d-flex justify-content-start align-items-center flex-wrap">
            <div className="form-group mt-2 me-2">
              <label>Search by Product Name:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter product name"
                value={searchProductName}
                onChange={(e) => setSearchProductName(e.target.value)}
              />
            </div>
            <div className="form-group mt-2 me-2">
              <label>Search by Date:</label>
              <input
                type="date"
                className="form-control"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
            <div className="form-group mt-2">
              <label>Search by Expire Date:</label>
              <input
                type="date"
                className="form-control"
                value={searchExpireDate}
                onChange={(e) => setSearchExpireDate(e.target.value)}
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
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Product Price</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces Price</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Remains Stock</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Expire Date</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Date</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr key={record.id || index}>
                    <td>{index + 1}</td>
                    <td>{record.product_name}</td>
                    <td>{record.product_price}</td>
                    <td>{record.pieces_price}</td>
                    <td>{record.pieces}</td>
                    <td>{record.stock}</td>
                    <td>{formatDate(record.expire_date)}</td>
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
                    <td colSpan="9" className="text-center">No records found</td>
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

export default BuyerRecord;
