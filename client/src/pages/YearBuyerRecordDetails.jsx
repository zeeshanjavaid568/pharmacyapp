import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useBuyerProductQuery, useDeleteBuyerProductMutation } from '../redux/features/BuyerProductApi/buyerProductApi';
import Swal from 'sweetalert2/dist/sweetalert2';

const YearBuyerRecordDetails = () => {
    const location = useLocation();
    const { records } = location.state || { records: [] }; // Get records passed from previous page

    const [searchProductName, setSearchProductName] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [searchExpireDate, setSearchExpireDate] = useState('');

    const [deleteBuyerProduct] = useDeleteBuyerProductMutation();
    const { refetch } = useBuyerProductQuery();

    // ✅ Safely format any date string as YYYY-MM-DD
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date)) return '-';
        return date.toISOString().split('T')[0];
    };

    // ✅ Filter records by name, date, and expire date
    const filteredRecords = records.filter((record) => {
        const matchesProductName = record.product_name.toLowerCase().includes(searchProductName.toLowerCase());
        const matchesDate = searchDate ? formatDate(record.date) === searchDate : true;
        const matchesExpireDate = searchExpireDate ? formatDate(record.expire_date) === searchExpireDate : true;
        return matchesProductName && matchesDate && matchesExpireDate;
    });

    // ✅ Handle record deletion
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

    return (
        <>
            <h1 className='year_record_table d-flex justify-content-center my-4 gradient_text'>
                Buyer Year Record Details
            </h1>

            {/* 🔍 Search Filters */}
            <div className="search-container px-3 d-flex justify-content-start align-items-center">
                <div className="form-group mt-2">
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
                <div className="form-group mt-2 ms-2">
                    <label htmlFor="dateSearch">Search by Date:</label>
                    <input
                        id="dateSearch"
                        type="date"
                        className="form-control"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                    />
                </div>
                <div className="form-group mt-2 ms-2">
                    <label htmlFor="expireSearch">Search by Expire Date:</label>
                    <input
                        id="expireSearch"
                        type="date"
                        className="form-control"
                        value={searchExpireDate}
                        onChange={(e) => setSearchExpireDate(e.target.value)}
                    />
                </div>
            </div>

            {/* 🧾 Table */}
            <div className='table-responsive p-3'>
                <table className='table table-bordered form_div' style={{ borderRadius: '10px', overflow: 'hidden' }}>
                    <thead style={{ position: 'sticky', top: '0', zIndex: '1000' }}>
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
                                        Delete
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
    );
};

export default YearBuyerRecordDetails;
