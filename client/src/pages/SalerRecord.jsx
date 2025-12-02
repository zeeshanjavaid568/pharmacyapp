import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2';
import { useSalerProductQuery, useDeleteSalerProductMutation } from '../redux/features/SalerProductApi/salerProductApi';
import { Link } from 'react-router-dom';

const SalerRecord = () => {
  const { data, isLoading, isError, refetch } = useSalerProductQuery();
  const [deleteSalerProduct] = useDeleteSalerProductMutation();

  const [selectedYear, setSelectedYear] = useState(null);
  const [searchProductName, setSearchProductName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'ascending' });

  // ✅ Group data by year and sort each year's records by date (ascending)
  const groupDataByYear = (data) => {
    // First sort all data by date in ascending order
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB; // Ascending order
    });

    // Then group by year
    return sortedData.reduce((acc, record) => {
      const year = new Date(record.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(record);
      return acc;
    }, {});
  };

  // ✅ Get sorted years in descending order (newest first)
  const getSortedYears = (yearlyData) => {
    return Object.keys(yearlyData).sort((a, b) => b - a); // Descending order (newest year first)
  };

  // ✅ Format date (YYYY-MM-DD) for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-CA', options).format(new Date(dateString));
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

  // ✅ Handle sort
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // ✅ Sort records based on sortConfig
  const sortRecords = (records) => {
    if (!records || records.length === 0) return [];

    const sortedRecords = [...records].sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (sortConfig.direction === 'ascending') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      } else if (sortConfig.key === 'product_name') {
        const nameA = a.product_name?.toLowerCase() || '';
        const nameB = b.product_name?.toLowerCase() || '';
        if (sortConfig.direction === 'ascending') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      } else if (sortConfig.key === 'product_price') {
        const priceA = parseFloat(a.product_price) || 0;
        const priceB = parseFloat(b.product_price) || 0;
        if (sortConfig.direction === 'ascending') {
          return priceA - priceB;
        } else {
          return priceB - priceA;
        }
      }
      return 0;
    });

    return sortedRecords;
  };

  // Memoize computed values
  const yearlyData = useMemo(() => data ? groupDataByYear(data) : {}, [data]);
  const sortedYears = useMemo(() => getSortedYears(yearlyData), [yearlyData]);

  // ✅ Records of selected year
  const records = selectedYear ? yearlyData[selectedYear] || [] : [];

  // ✅ Filter records by name & date
  const filteredRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      const matchesProductName = record.product_name?.toLowerCase().includes(searchProductName.toLowerCase());
      const matchesDate = searchDate ? formatDate(record.date) === searchDate : true;
      return matchesProductName && matchesDate;
    });
    return sortRecords(filtered);
  }, [records, searchProductName, searchDate, sortConfig]);

  // ✅ Show loading/error
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading data.</p>;

  // ✅ Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  const fontColorStyle = { color: 'rgb(244, 67, 54)' }

  return (
    <>
      {!selectedYear ? (
        <>
          <h1 className='d-flex justify-content-center my-4 gradient_text'>
            Saler All Years Record
          </h1>
          <div className='responsive_card'>
            {sortedYears.map((year) => (
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
          <div className="text-center mb-5">
            <button className="btn form_div" onClick={() => setSelectedYear(null)}>
              ← Back to All Years
            </button>
          </div>

          {/* 📊 Quick Stats */}
          {filteredRecords.length > 0 && (
            <div className="px-3">
              <div className="row">
                <div className="col-md-3">
                  <div className="card text-white bg-primary mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Records</h5>
                      <p className="card-text fs-4">{filteredRecords.length}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-success mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Product Value</h5>
                      <p className="card-text fs-4">
                        Rs:{filteredRecords.reduce((sum, record) => sum + (parseFloat(record.product_price) || 0), 0).toFixed()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-warning mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Pieces Price</h5>
                      <p className="card-text fs-4">
                        {filteredRecords.length > 0 && (
                          <>
                            Rs:{filteredRecords.reduce((sum, record) => sum + (parseFloat(record.pieces_price) || 0), 0).toFixed()}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-info mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Pieces</h5>
                      <p className="card-text fs-4">
                        {filteredRecords.reduce((sum, record) => sum + (parseInt(record.stock) || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 🔍 Search Filters */}
          <div className="search-container px-3 d-flex justify-content-start align-items-center flex-wrap">
            <div className="form-group mt-2 me-3">
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
            <div className="form-group mt-2 me-3">
              <label htmlFor="dateSearch">Search by Date:</label>
              <input
                id="dateSearch"
                type="date"
                className="form-control"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
            <div className="form-group mt-2">
              <button
                className="btn btn-outline-secondary mt-4"
                onClick={() => {
                  setSearchProductName('');
                  setSearchDate('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* 🧾 Table */}
          <div className='table-container p-3 mt-3 ms-3'>
            <table className='table table-bordered table-hover form_div table-container thead th' style={{ borderRadius: '10px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                <tr>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>#</th>
                  <th
                    style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                    onClick={() => handleSort('product_name')}
                  >
                    Product Name{<SortIndicator columnKey="product_name" />}
                  </th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Product Place</th>
                  <th
                    style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                    onClick={() => handleSort('product_price')}
                  >
                    Product Price{<SortIndicator columnKey="product_price" />}
                  </th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces Price</th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces</th>
                  <th
                    style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                    onClick={() => handleSort('date')}
                  >
                    Date{<SortIndicator columnKey="date" />}
                  </th>
                  <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr key={record.id || index}>
                    <td>{index + 1}</td>
                    <td>{record.product_name}</td>
                    <td>{record.product_place}</td>
                    <td>{parseFloat(record.product_price).toFixed()}</td>
                    <td>{parseFloat(record.pieces_price).toFixed()}</td>
                    <td>{record.stock}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                    <Link to={'#'} className="update_btn me-3">
                        Update
                      </Link>
                      <button
                        className="delete_btn"
                        onClick={() => {
                          Swal.fire({
                            title: 'Are you sure?',
                            text: "You won't be able to revert this!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                            confirmButtonText: 'Yes, delete it!',
                            cancelButtonText: 'Cancel'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              handleDelete(record.id);
                            }
                          });
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="alert alert-warning mb-0">
                        No records found
                        {(searchProductName || searchDate) && " for the current filters"}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredRecords.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end"><strong style={fontColorStyle} >Total Rs:</strong></td>
                    <td>
                      <strong>
                        {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.product_price) || 0), 0).toFixed()}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.pieces_price) || 0), 0).toFixed()}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {filteredRecords.reduce((sum, record) => sum + (parseInt(record.stock) || 0), 0)}
                      </strong>
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>


        </>
      )}
    </>
  );
};

export default SalerRecord;