import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2';
import { useDeleteTakenDuesMutation, useGetAllTakenDuesQuery } from '../redux/features/DuesApi/takenDuesApi';

const TakenDuesDetails = () => {
    const location = useLocation();
    const { records } = location.state || { records: [] };

    const [searchDate, setSearchDate] = useState('');
    const [searchName, setSearchName] = useState('');
    const [deleteTakenDues] = useDeleteTakenDuesMutation();
    const { data, refetch } = useGetAllTakenDuesQuery();

    // ✅ Helper to format date safely
    // ✅ Helper to format date safely and accurately
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date)) return '-';

        // Fix UTC → Local conversion
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().split('T')[0]; // accurate local date
    };


    // ✅ Filter by both name and date
    const filteredRecords = records.filter((record) => {
        const recordDate = formatDate(record.date);
        const matchesDate = searchDate ? recordDate === searchDate : true;
        const matchesName = searchName
            ? record.name?.toLowerCase().includes(searchName.toLowerCase())
            : true;
        return matchesDate && matchesName;
    });

    // ✅ Handle Delete Record
    const handleDelete = async (id) => {
        try {
            await deleteTakenDues(id).unwrap();
            Swal.fire({
                title: 'Success',
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
            <h1 className="year_record_table d-flex justify-content-center my-4 gradient_text">
                Taken Dues Record Details
            </h1>

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

            {/* 🧾 Table */}
            <div className="table-responsive p-3">
                <table className="table table-bordered form_div" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                    <thead style={{ position: 'sticky', top: '0', zIndex: '1000' }}>
                        <tr>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>#</th>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>Name</th>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>Price</th>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>Date</th>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((record, index) => (
                            <tr key={record.id || index}>
                                <td>{index + 1}</td>
                                <td>{record.name}</td>
                                <td>{record.price}</td>
                                <td>{formatDate(record.date)}</td>
                                <td>
                                    <button className="delete_btn" onClick={() => handleDelete(record.id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredRecords.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    No records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default TakenDuesDetails;
