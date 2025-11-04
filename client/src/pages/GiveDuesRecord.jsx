import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2';
import GiveDuesCard from '../components/Cards/GiveDuesCard';
import { useGetAllDuesQuery, useDeleteGivenDuesMutation } from '../redux/features/DuesApi/giveDuesApi';

const GiveDuesRecord = () => {
  const { data = [], isLoading, isError, refetch } = useGetAllDuesQuery();
  const [deleteGivenDues] = useDeleteGivenDuesMutation();

  const [searchDate, setSearchDate] = useState('');
  const [searchName, setSearchName] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  const filteredRecords = data.filter((record) => {
    const recordDate = formatDate(record.date);
    const matchesDate = searchDate ? recordDate === searchDate : true;
    const matchesName = searchName
      ? record.name?.toLowerCase().includes(searchName.toLowerCase())
      : true;
    return matchesDate && matchesName;
  });

  // ✅ Find the last record price for auto-fill
  const lastPrice = useMemo(() => {
    if (filteredRecords.length === 0) return 0;
    return Number(filteredRecords[filteredRecords.length - 1].price) || 0;
  }, [filteredRecords]);

  // ✅ Handle delete with auto refresh
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
      await refetch(); // refresh data
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
      <GiveDuesCard lastPrice={lastPrice} refetchData={refetch} />

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

        <div className="form-group mt-2">
          <label>Last Entry Price</label>
          <div className="form-control text-center fw-bold">
            {lastPrice}
          </div>
        </div>
      </div>

      {/* 📋 Table */}
      <div className="table-responsive p-3">
        {isLoading && <p>Loading...</p>}
        {isError && <p>Error loading data.</p>}

        {!isLoading && !isError && (
          <table className="table table-bordered form_div" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Single Piece Price</th>
                <th>Total Piece</th>
                <th>Given Dues</th>
                <th>Taken Dues</th>
                <th>Remains Total Price</th>
                <th>Date</th>
                <th>Actions</th>
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
                      <button className="delete_btn" onClick={() => handleDelete(record.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">No records found</td>
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
