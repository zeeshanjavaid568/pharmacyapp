import React, { useEffect, useState } from 'react';
import { useCreateMonthlyProfitMutation } from '../../redux/features/MonthlyProfitApi/monthlyProfitApi';
import swal from 'sweetalert2/dist/sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import icons

const MonthlyProfitAddCard = ({ monthlyProfits }) => {
    const [monthlyProfit, setMonthlyProfit] = useState({
        monthly_profit: '',
        date: '',
    });
    const [showProfit, setShowProfit] = useState(false); // State to toggle input visibility
    const [errors, setErrors] = useState({ monthlyProfit: '', date: '' });
    const [createMonthlyProfit, { isLoading }] = useCreateMonthlyProfitMutation();

    // Populate form data with the `monthlyProfits` prop
    useEffect(() => {
        setMonthlyProfit((prevState) => ({
            ...prevState,
            monthly_profit: monthlyProfits || '', // Use the prop value or keep it empty
        }));
    }, [monthlyProfits]);

    const toggleShowProfit = () => {
        setShowProfit(!showProfit);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = {};

        // Validation for Monthly Profit
        if (monthlyProfit.monthly_profit === '') {
            validationErrors.monthlyProfit = 'Monthly Profit is required.';
        } else if (isNaN(monthlyProfit.monthly_profit)) {
            validationErrors.monthlyProfit = 'Monthly Profit must be a valid number.';
        }

        // Validation for Date
        if (!monthlyProfit.date) {
            validationErrors.date = 'Date is required.';
        }

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            try {
                await createMonthlyProfit({
                    monthly_profit: monthlyProfit.monthly_profit,
                    date: monthlyProfit.date,
                }).unwrap();

                setMonthlyProfit({ monthly_profit: '', date: '' });
                swal.fire({
                    title: 'Success',
                    text: 'Monthly Profit Added Successfully.',
                    icon: 'success',
                    confirmButtonText: 'Ok',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'sweetalert_btn_success',
                    },
                });
            } catch (err) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Monthly Profit Not Added.',
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
                        type={showProfit ? 'number' : 'password'}
                        className={`p-1 my-2 ${errors.monthlyProfit ? 'is-invalid' : ''}`}
                        placeholder="Monthly Profit"
                        value={monthlyProfit.monthly_profit}
                        onChange={(e) =>
                            setMonthlyProfit({ ...monthlyProfit, monthly_profit: e.target.value })
                        }
                    />
                    <span
                        className="position-absolute end-0 me-2"
                        style={{ cursor: 'pointer', top: '13px' }}
                        onClick={toggleShowProfit}
                    >
                        {showProfit ? <FaEyeSlash /> : <FaEye />}
                    </span>
                    {errors.monthlyProfit && (
                        <div className="text-danger mb-1" style={{ fontSize: '0.875rem' }}>
                            {errors.monthlyProfit}
                        </div>
                    )}
                </div>
                <div className="col-auto">
                    <input
                        type="date"
                        className={`p-1 my-2 date_input ${errors.date ? 'is-invalid' : ''}`}
                        value={monthlyProfit.date}
                        onChange={(e) =>
                            setMonthlyProfit({ ...monthlyProfit, date: e.target.value })
                        }
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
                        {isLoading ? 'Submitting...' : 'Add Monthly Profit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MonthlyProfitAddCard;
