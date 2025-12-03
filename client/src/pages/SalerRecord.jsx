import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2';
import { useSalerProductQuery, useDeleteSalerProductMutation } from '../redux/features/SalerProductApi/salerProductApi';
import { Link } from 'react-router-dom';

const SalerRecord = () => {
  const { data, isLoading, isError, refetch } = useSalerProductQuery();
  const [deleteSalerProduct] = useDeleteSalerProductMutation();

  const [selectedYear, setSelectedYear] = useState(null);
  const [searchProductName, setSearchProductName] = useState('');
  const [searchProductPlace, setSearchProductPlace] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'ascending' });
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'summary'

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

  // ✅ Group records by Product Name and Product Place to calculate totals
  const getSummaryData = (records) => {
    const summaryMap = {};

    records.forEach(record => {
      const key = `${record.product_name}_${record.product_place}`;

      if (!summaryMap[key]) {
        summaryMap[key] = {
          product_name: record.product_name,
          product_place: record.product_place,
          total_pieces: 0,
          total_product_price: 0,
          total_pieces_price: 0,
          records_count: 0,
          records: [] // Store individual records for reference
        };
      }

      summaryMap[key].total_pieces += parseInt(record.stock) || 0;
      summaryMap[key].total_product_price += parseFloat(record.product_price) || 0;
      summaryMap[key].total_pieces_price += parseFloat(record.pieces_price) || 0;
      summaryMap[key].records_count += 1;
      summaryMap[key].records.push(record);
    });

    return Object.values(summaryMap);
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
      } else if (sortConfig.key === 'product_place') {
        const placeA = a.product_place?.toLowerCase() || '';
        const placeB = b.product_place?.toLowerCase() || '';
        if (sortConfig.direction === 'ascending') {
          return placeA.localeCompare(placeB);
        } else {
          return placeB.localeCompare(placeA);
        }
      }
      return 0;
    });

    return sortedRecords;
  };

  // ✅ Sort summary data
  const sortSummaryData = (summaryData) => {
    if (!summaryData || summaryData.length === 0) return [];

    const sortedSummary = [...summaryData].sort((a, b) => {
      if (sortConfig.key === 'product_name') {
        const nameA = a.product_name?.toLowerCase() || '';
        const nameB = b.product_name?.toLowerCase() || '';
        if (sortConfig.direction === 'ascending') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      } else if (sortConfig.key === 'product_place') {
        const placeA = a.product_place?.toLowerCase() || '';
        const placeB = b.product_place?.toLowerCase() || '';
        if (sortConfig.direction === 'ascending') {
          return placeA.localeCompare(placeB);
        } else {
          return placeB.localeCompare(placeA);
        }
      } else if (sortConfig.key === 'total_pieces') {
        if (sortConfig.direction === 'ascending') {
          return a.total_pieces - b.total_pieces;
        } else {
          return b.total_pieces - a.total_pieces;
        }
      } else if (sortConfig.key === 'total_product_price') {
        if (sortConfig.direction === 'ascending') {
          return a.total_product_price - b.total_product_price;
        } else {
          return b.total_product_price - a.total_product_price;
        }
      }
      return 0;
    });

    return sortedSummary;
  };

  // Memoize computed values
  const yearlyData = useMemo(() => data ? groupDataByYear(data) : {}, [data]);
  const sortedYears = useMemo(() => getSortedYears(yearlyData), [yearlyData]);

  // ✅ Records of selected year
  const records = selectedYear ? yearlyData[selectedYear] || [] : [];

  // ✅ Filter records by name, place & date
  const filteredRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      const matchesProductName = record.product_name?.toLowerCase().includes(searchProductName.toLowerCase());
      const matchesProductPlace = record.product_place?.toLowerCase().includes(searchProductPlace.toLowerCase());
      const matchesDate = searchDate ? formatDate(record.date) === searchDate : true;
      return matchesProductName && matchesProductPlace && matchesDate;
    });
    return sortRecords(filtered);
  }, [records, searchProductName, searchProductPlace, searchDate, sortConfig]);

  // ✅ Calculate summary data from filtered records
  const summaryData = useMemo(() => {
    const summary = getSummaryData(filteredRecords);
    return sortSummaryData(summary);
  }, [filteredRecords, sortConfig]);

  // ✅ Get unique product places for dropdown suggestions
  const uniqueProductPlaces = useMemo(() => {
    const places = new Set();
    records.forEach(record => {
      if (record.product_place) {
        places.add(record.product_place);
      }
    });
    return Array.from(places).sort();
  }, [records]);

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
                        Rs: {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.product_price) || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-warning mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Pieces Price</h5>
                      <p className="card-text fs-4">
                        Rs: {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.pieces_price) || 0), 0).toFixed(2)}
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

              {/* 📊 View Mode Toggle */}
              <div className="row mb-3">
                <div className="col-12">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${viewMode === 'detailed' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => setViewMode('detailed')}
                    >
                      Detailed View
                    </button>
                    <button
                      type="button"
                      className={`btn ${viewMode === 'summary' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => setViewMode('summary')}
                    >
                      Summary View (Grouped)
                    </button>
                  </div>
                  <small className="text-muted ms-3">
                    {viewMode === 'summary'
                      ? `Showing ${summaryData.length} unique product-location combinations`
                      : `Showing ${filteredRecords.length} individual records`}
                  </small>
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
              <label htmlFor="placeSearch">Search by Product Place:</label>
              <div className="input-group">
                <input
                  id="placeSearch"
                  type="text"
                  className="form-control"
                  placeholder="Enter product place"
                  value={searchProductPlace}
                  onChange={(e) => setSearchProductPlace(e.target.value)}
                  list="placeSuggestions"
                />
                <datalist id="placeSuggestions">
                  {uniqueProductPlaces.map((place, index) => (
                    <option key={index} value={place} />
                  ))}
                </datalist>
                {searchProductPlace && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchProductPlace('')}
                    title="Clear place filter"
                  >
                    ✕
                  </button>
                )}
              </div>

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
                  setSearchProductPlace('');
                  setSearchDate('');
                }}
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* 📊 Filter Status */}
          {(searchProductName || searchProductPlace || searchDate) && (
            <div className="px-3 mt-2">
              <div className="alert alert-light border d-flex justify-content-between align-items-center">
                <div>
                  <strong>Active Filters:</strong>
                  {searchProductName && (
                    <span className="badge bg-primary ms-2">
                      Product Name: {searchProductName}
                      <button
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => setSearchProductName('')}
                        aria-label="Remove"
                      ></button>
                    </span>
                  )}
                  {searchProductPlace && (
                    <span className="badge bg-success ms-2">
                      Product Place: {searchProductPlace}
                      <button
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => setSearchProductPlace('')}
                        aria-label="Remove"
                      ></button>
                    </span>
                  )}
                  {searchDate && (
                    <span className="badge bg-warning ms-2">
                      Date: {searchDate}
                      <button
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => setSearchDate('')}
                        aria-label="Remove"
                      ></button>
                    </span>
                  )}
                </div>
                <div>
                  <span className="badge bg-info">
                    Showing {viewMode === 'summary' ? summaryData.length : filteredRecords.length} records
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 🧾 Table - Detailed View */}
          {viewMode === 'detailed' && (
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
                    <th
                      style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                      onClick={() => handleSort('product_place')}
                    >
                      Product Place{<SortIndicator columnKey="product_place" />}
                    </th>
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
                      <td>Rs: {parseFloat(record.product_price).toFixed()}</td>
                      <td>Rs: {parseFloat(record.pieces_price).toFixed()}</td>
                      <td>{record.stock}</td>
                      <td>{formatDate(record.date)}</td>
                      <td>
                        <Link to={`/updatesalerproduct/${record.id}`} className="update_btn me-3">
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
                          {(searchProductName || searchProductPlace || searchDate) && " for the current filters"}
                          {!searchProductName && !searchProductPlace && !searchDate && " for the selected year"}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredRecords.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong style={fontColorStyle}>Total Rs:</strong></td>
                      <td>
                        <strong>
                          Rs: {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.product_price) || 0), 0).toFixed()}
                        </strong>
                      </td>
                      <td>
                        <strong>
                          Rs: {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.pieces_price) || 0), 0).toFixed()}
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
          )}

          {/* 📊 Summary View - Grouped by Product and Place */}
          {viewMode === 'summary' && (
            <div className='table-container p-3 mt-3 ms-3'>
              <div className="alert alert-info mb-3">
                <i className="bi bi-info-circle me-2"></i>
                This view groups records by Product Name and Product Place to show total pieces and prices for each combination.
              </div>
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
                    <th
                      style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                      onClick={() => handleSort('product_place')}
                    >
                      Product Place{<SortIndicator columnKey="product_place" />}
                    </th>
                    <th
                      style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                      onClick={() => handleSort('total_product_price')}
                    >
                      Total Product Value{<SortIndicator columnKey="total_product_price" />}
                    </th>
                    <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces Price</th>
                    <th
                      style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                      onClick={() => handleSort('total_pieces')}
                    >
                      Total Pieces{<SortIndicator columnKey="total_pieces" />}
                    </th>
                    <th style={{ backgroundColor: '#f44336', color: 'white' }}>Records Count</th>
                    <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((summary, index) => (
                    <tr key={`${summary.product_name}_${summary.product_place}`}>
                      <td>{index + 1}</td>
                      <td>{summary.product_name}</td>
                      <td>{summary.product_place}</td>
                      <td>Rs: {summary.total_product_price.toFixed(2)}</td>
                      <td>Rs: {summary.total_pieces_price.toFixed(2)}</td>
                      <td>
                        <strong>{summary.total_pieces}</strong>
                        {summary.records_count > 1 && (
                          <small className="text-muted ms-2">
                            ({summary.records_count} records)
                          </small>
                        )}
                      </td>
                      <td>{summary.records_count}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger me-2"
                          onClick={() => {
                            // Show details for this product-place combination
                            Swal.fire({
                              title: `${summary.product_name} - ${summary.product_place}`,
                              html: `
                                <div style="text-align: left;">
                                  <p><strong>Total Pieces:</strong> ${summary.total_pieces}</p>
                                  <p><strong>Total Product Value:</strong> Rs: ${summary.total_product_price.toFixed(2)}</p>
                                  <p><strong>Total Pieces Price:</strong> Rs: ${summary.total_pieces_price.toFixed(2)}</p>
                                  <p><strong>Number of Records:</strong> ${summary.records_count}</p>
                                  <hr>
                                  <h6>Individual Records:</h6>
                                  <ul>
                                    ${summary.records.map(r =>
                                `<li>${formatDate(r.date)}: ${r.stock} pieces (Rs: ${parseFloat(r.product_price).toFixed(2)})</li>`
                              ).join('')}
                                  </ul>
                                </div>
                              `,
                              icon: 'info',
                              confirmButtonText: 'Close',
                              width: '600px'
                            });
                          }}
                        >
                          📊 Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {summaryData.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <div className="alert alert-warning mb-0">
                          No summary data found
                          {(searchProductName || searchProductPlace || searchDate) && " for the current filters"}
                          {!searchProductName && !searchProductPlace && !searchDate && " for the selected year"}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                {summaryData.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong style={fontColorStyle}>Grand Total:</strong></td>
                      <td>
                        <strong>
                          Rs: {summaryData.reduce((sum, s) => sum + s.total_product_price, 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <strong>
                          Rs: {summaryData.reduce((sum, s) => sum + s.total_pieces_price, 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <strong>
                          {summaryData.reduce((sum, s) => sum + s.total_pieces, 0)}
                        </strong>
                      </td>
                      <td>
                        <strong>
                          {summaryData.reduce((sum, s) => sum + s.records_count, 0)}
                        </strong>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </>
      )}
      <div className='ms-3 mt-2'>
        {uniqueProductPlaces.length > 0 && (
          <small className="text-muted">
            Available places: {uniqueProductPlaces.slice(0, 3).join(', ')}
            {uniqueProductPlaces.length > 3 && ` and ${uniqueProductPlaces.length - 3} more...`}
          </small>
        )}
      </div>

    </>
  );
};

export default SalerRecord;