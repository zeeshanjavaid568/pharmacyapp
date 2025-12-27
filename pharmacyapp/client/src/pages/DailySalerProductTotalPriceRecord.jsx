import React, { useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2';
import { useDeleteSalerProductTotalPriceMutation, useSalerProductsTotalPriceQuery } from '../redux/features/SalerProductApi/salerProductApi';

const SalerDailyTotalPriceRecord = () => {
  const { data, isLoading, isError, refetch } = useSalerProductsTotalPriceQuery();
  const [deleteBuyerProduct] = useDeleteSalerProductTotalPriceMutation();

  const [selectedYear, setSelectedYear] = useState(null);
  const [searchDate, setSearchDate] = useState('');

  // ✅ Group data by year
  const groupDataByYear = (data) => {
    return data.reduce((acc, record) => {
      const year = new Date(record.date).getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(record);
      return acc;
    }, {});
  };

  // ✅ Date formatting helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  // ✅ Delete record handler
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

  if (isLoading) return <p className="text-center my-4">Loading...</p>;
  if (isError) return <p className="text-center my-4 text-danger">Error loading data.</p>;

  const yearlyData = data ? groupDataByYear(data) : {};

  // ✅ If a year is selected, show its details
  if (selectedYear) {
    const records = yearlyData[selectedYear] || [];
    const filteredRecords = records.filter((record) => {
      const recordDate = formatDate(record.date);
      return searchDate ? recordDate === searchDate : true;
    });

    return (
      <>
        <h1 className="year_record_table d-flex justify-content-center my-4 gradient_text">
          Saler One Day Total Price — {selectedYear} Record Details
        </h1>

        {/* 🔙 Back Button */}
        <div className="d-flex justify-content-center px-3 mb-3">
          <button className="btn form_div" onClick={() => { setSelectedYear(null); setSearchDate(''); }}>
            ← Back to All Years
          </button>
        </div>

        {/* 🔍 Search by Date */}
        <div className="search-container px-3 d-flex justify-content-start align-items-center">
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
        <div className="table-responsive p-3">
          <table className="table table-bordered table-hover form_div" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <thead style={{ position: 'sticky', top: '0', zIndex: '1000' }}>
              <tr>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>#</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Daily Total Price</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Date</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => (
                <tr key={record.id || index}>
                  <td>{index + 1}</td>
                  <td>{record.daily_seler_product_total_price}</td>
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
                  <td colSpan="4" className="text-center">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ✅ Default view (All Years)
  return (
    <>
      <h1 className="d-flex justify-content-center my-4 gradient_text">
        Saler One Day Total Price — All Years Record
      </h1>
      <div className="responsive_card">
        {Object.keys(yearlyData).map((year) => (
          <div key={year} className="yearly_record_card border rounded-2 my-1 form_div">
            <button
              onClick={() => setSelectedYear(year)}
              className="text-decoration-none text yearly_record_links d-flex justify-content-center flex-wrap w-100 border-0 bg-transparent"
            >
              {year} ({yearlyData[year].length} records)
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default SalerDailyTotalPriceRecord;
