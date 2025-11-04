import React, { useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2';
import GiveDuesCard from '../components/Cards/GiveDuesCard';
import { useGetAllDuesQuery, useDeleteGivenDuesMutation } from '../redux/features/DuesApi/giveDuesApi';

const GiveDuesRecord = () => {
  // Fetch all dues from API
  const { data = [], isLoading, isError, refetch } = useGetAllDuesQuery();

  // Delete mutation
  const [deleteGivenDues] = useDeleteGivenDuesMutation();

  // Local states for filters
  const [searchDate, setSearchDate] = useState('');
  const [searchName, setSearchName] = useState('');

  // ✅ Format date safely and correctly
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  // ✅ Filter records by date and name
  const filteredRecords = data.filter((record) => {
    const recordDate = formatDate(record.date);
    const matchesDate = searchDate ? recordDate === searchDate : true;
    const matchesName = searchName
      ? record.name?.toLowerCase().includes(searchName.toLowerCase())
      : true;
    return matchesDate && matchesName;
  });

  // ✅ Handle delete
  const handleDelete = async (id) => {
    try {
      await deleteGivenDues(id).unwrap();
      Swal.fire({
        title: 'Deleted!',
        text: 'Given Dues deleted successfully.',
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });
      refetch();
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete Given Dues. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
    }
  };

  return (
    <>
      <h1 className="d-flex justify-content-center my-4 gradient_text">
        Given Dues Record
      </h1>

      {/* 🧾 Add New Dues Section */}
      <GiveDuesCard />

      {/* 🔍 Search Filters */}
      <div className="search-container px-3 d-flex gap-3 flex-wrap">
        <div className="form-group mt-2">
          <label htmlFor="nameSearch">Search by Name:</label>
          <input
            id="nameSearch"
            type="text"
            className="form-control"
            placeholder="Enter name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
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

      {/* 📋 Table Display */}
      <div className="table-responsive p-3">
        {isLoading && <p>Loading...</p>}
        {isError && <p>Error loading data.</p>}

        {!isLoading && !isError && (
          <table
            className="table table-bordered form_div"
            style={{ borderRadius: '10px', overflow: 'hidden' }}
          >
            <thead style={{ position: 'sticky', top: '0', zIndex: '1000' }}>
              <tr>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>#</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Name</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Single Piece Price</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Piece</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Given Dues</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Taken Dues</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Price</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Date</th>
                <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => (
                  <tr key={record.id || index}>
                    <td>{index + 1}</td>
                    <td>{record.name}</td>
                    <td>{record.single_piece_price}</td>
                    <td>{record.total_piece}</td>
                    <td>{record.given_dues}</td>
                    <td>{record.taken_dues}</td>
                    <td>{record.price}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <button
                        className="delete_btn"
                        onClick={() => handleDelete(record.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default GiveDuesRecord;
