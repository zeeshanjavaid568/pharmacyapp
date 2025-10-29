import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2';
import { useDailyProfitQuery, useDeleteDailyProfitMutation } from '../redux/features/DailyProfitApi/dailyProfitApi';

const DailyProfitRecordDetails = () => {
    const location = useLocation();
    const { records } = location.state || { records: [] }; // Retrieve data passed via state

    const [searchProductName, setSearchProductName] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [deleteBuyerProduct] = useDeleteDailyProfitMutation(); // Hook for delete mutation
    const { refetch } = useDailyProfitQuery();

    // Function to format the date as YYYY-MM-DD
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Intl.DateTimeFormat('en-CA', options).format(new Date(dateString)); // 'en-CA' gives YYYY-MM-DD
    };

    // Filtered records based on search inputs
    const filteredRecords = records.filter((record) => {
        const matchesProductName = record.daily_profit
            ?.toString()
            .toLowerCase()
            .includes(searchProductName.toLowerCase());
        const matchesDate = searchDate ? formatDate(record.date) === searchDate : true;
        return matchesProductName && matchesDate;
    });

    // Handle Delete Record
    const handleDelete = async (id) => {
        try {
            await deleteBuyerProduct(id).unwrap(); // Call the delete mutation
            Swal.fire({
                title: 'Success',
                text: 'Record deleted successfully.',
                icon: 'success',
                confirmButtonText: 'Ok',
                buttonsStyling: false,
                customClass: {
                    confirmButton: 'sweetalert_btn_success',
                },
            });
            refetch();
        } catch (error) {
            Swal.fire({
                title: 'Error!',
                text: 'Failed to delete record. Please try again.',
                icon: 'error',
                confirmButtonText: 'Ok',
                buttonsStyling: false,
                customClass: {
                    confirmButton: 'sweetalert_btn_error',
                },
            });
        }
    };

    return (
        <>
            <h1 className='year_record_table d-flex justify-content-center my-4 gradient_text'>Daily Profit Record Details</h1>
            {/* Search Inputs */}
            <div className="search-container px-3 d-flex justify-content-start align-items-center">
                <div className="form-group mt-2">
                    <label htmlFor="productSearch">Search by Daily Profit:</label>
                    <input
                        id="productSearch"
                        type="text"
                        className="form-control"
                        placeholder="Enter daily profit"
                        value={searchProductName}
                        onChange={(e) => setSearchProductName(e.target.value)}
                    />
                </div>
                <div className="form-group mt-2 ms-2">
                    <label htmlFor="dateSearch">Search by Date (YYYY-MM-DD):</label>
                    <input
                        id="dateSearch"
                        type="date"
                        className="form-control"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                    />
                </div>
            </div>

            <div className='table-responsive p-3'>
                <table
                    className='table table-bordered form_div'
                    style={{ borderRadius: '10px', overflow: 'hidden' }}
                >
                    <thead style={{ position: 'sticky', top: '0', zIndex: '1000' }}>
                        <tr>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>#</th>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>Daily Profit</th>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>Daily Buyer Items</th>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>Daily Seller Items</th>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>Date</th>
                            <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((record, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{record.daily_profit || '-'}</td>
                                <td>{record.daily_total_buyer_items || '-'}</td>
                                <td>{record.daily_total_saler_items || '-'}</td>
                                <td>{record.date ? formatDate(record.date) : '-'}</td>
                                <td>
                                    <button
                                        className="delete_btn"
                                        onClick={() => handleDelete(record.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredRecords.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center">No records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default DailyProfitRecordDetails;
