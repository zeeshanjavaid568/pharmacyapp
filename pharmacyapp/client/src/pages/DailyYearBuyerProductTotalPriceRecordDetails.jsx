import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useBuyerDailyProductTotalPriceQuery, useDeleteBuyerProductTotalPriceMutation } from '../redux/features/BuyerProductApi/buyerProductApi';
import Swal from 'sweetalert2/dist/sweetalert2';

const DailyYearBuyerProductTotalPriceRecordDetails = () => {
    const location = useLocation();
    const { records } = location.state || { records: [] };

    const [searchDate, setSearchDate] = useState('');
    const [deleteBuyerProduct] = useDeleteBuyerProductTotalPriceMutation();
    const { refetch } = useBuyerDailyProductTotalPriceQuery();

    // ✅ Helper to format date safely and accurately
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date)) return '-';

        // Fix UTC → Local conversion
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().split('T')[0]; // accurate local date
    };


    // ✅ Filter only by Date
    const filteredRecords = records.filter((record) => {
        const recordDate = formatDate(record.date);
        return searchDate ? recordDate === searchDate : true;
    });

    // ✅ Handle Delete Record
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
            <h1 className="year_record_table d-flex justify-content-center my-4 gradient_text">
                Buyer One Day Total Price Year Record Details
            </h1>

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
                <table className="table table-bordered form_div" style={{ borderRadius: '10px', overflow: 'hidden' }}>
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
                                <td>{record.daily_buyer_product_total_price}</td>
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
};

export default DailyYearBuyerProductTotalPriceRecordDetails;
