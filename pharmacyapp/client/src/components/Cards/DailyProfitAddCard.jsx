import React, { useEffect, useState } from 'react';
import { useCreateDailyProfitMutation } from '../../redux/features/DailyProfitApi/dailyProfitApi';
import swal from 'sweetalert2/dist/sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import icons

const DailyProfitAddCard = ({ totalBuyerItems, totalSalerItems, dailyProfits, onProductAdded }) => {
    const [formData, setFormData] = useState({
        daily_profit: '',
        daily_total_buyer_items: '',
        daily_total_saler_items: '',
        date: '',
    });
    const [errors, setErrors] = useState({ daily_profit: '', date: '' });
    const [showProfit, setShowProfit] = useState(false); // State to toggle input visibility
    const [createDailyProfit, { isLoading, isError }] = useCreateDailyProfitMutation();

    // Populate form data with props
    useEffect(() => {
        setFormData({
            daily_profit: dailyProfits || '',
            daily_total_buyer_items: totalBuyerItems || '',
            daily_total_saler_items: totalSalerItems || '',
            date: '',
        });
    }, [dailyProfits, totalBuyerItems, totalSalerItems]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const toggleShowProfit = () => {
        setShowProfit(!showProfit);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = {};

        if (formData.daily_profit === '') {
            validationErrors.daily_profit = 'Daily Profit is required.';
        } else if (isNaN(formData.daily_profit)) {
            validationErrors.daily_profit = 'Daily Profit must be a number.';
        }

        if (!formData.date) {
            validationErrors.date = 'Date is required.';
        }

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            try {
                const result = await createDailyProfit(formData).unwrap();

                swal.fire({
                    title: 'Success',
                    text: 'Daily Profit Added Successfully.',
                    icon: 'success',
                    confirmButtonText: 'Ok',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'sweetalert_btn_success',
                    },
                });

                setFormData({
                    daily_profit: dailyProfits || '',
                    daily_total_buyer_items: totalBuyerItems || '',
                    daily_total_saler_items: totalSalerItems || '',
                    date: '',
                });
                onProductAdded();
                setErrors({});
            } catch (error) {
                console.error('Error submitting the form:', error);
                swal.fire({
                    title: 'Error!',
                    text: 'Daily Profit Not Added.',
                    icon: 'error',
                    confirmButtonText: 'Ok',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'sweetalert_btn_error',
                    },
                });
            }
        }
    };

    return (
        <div className="card form_div mb-5 p-3 pb-0 rounded-2">
            <form className="d-flex justify-content-center justify-content-xxl-between justify-content-xl-between justify-content-lg-between justify-content-md-between flex-wrap" onSubmit={handleSubmit}>
                <div className="col-auto position-relative">
                    <input
                        type={showProfit ? 'number' : 'password'} // Toggle input type
                        className={`p-1 my-2 ${errors.daily_profit ? 'is-invalid' : ''}`}
                        name="daily_profit"
                        placeholder="Daily Profit"
                        value={formData.daily_profit}
                        onChange={handleInputChange}
                    />
                    <span
                        className="position-absolute end-0 me-2"
                        style={{ cursor: 'pointer', top: '13px' }}
                        onClick={toggleShowProfit}
                    >
                        {showProfit ? <FaEyeSlash /> : <FaEye />}
                    </span>
                    {errors.daily_profit && (
                        <div className="text-danger mb-1" style={{ fontSize: '0.875rem' }}>
                            {errors.daily_profit}
                        </div>
                    )}
                </div>
                <div className="col-auto">
                    <input
                        type="number"
                        className="p-1 my-2"
                        name="daily_total_buyer_items"
                        placeholder="Daily Buyer Items"
                        value={formData.daily_total_buyer_items}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="col-auto">
                    <input
                        type="number"
                        className="p-1 my-2"
                        name="daily_total_saler_items"
                        placeholder="Daily Saler Items"
                        value={formData.daily_total_saler_items}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="col-auto">
                    <input
                        type="date"
                        className={`p-1 my-2 date_input ${errors.date ? 'is-invalid' : ''}`}
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                    />
                    {errors.date && (
                        <div className="text-danger mb-1" style={{ fontSize: '0.875rem' }}>
                            {errors.date}
                        </div>
                    )}
                </div>
                <div className="col-auto mb-3">
                    <button
                        type="submit"
                        className="btn btn-danger my-2 mb-xxl-3 btn_width"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Submitting...' : 'Add Daily Profit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DailyProfitAddCard;
