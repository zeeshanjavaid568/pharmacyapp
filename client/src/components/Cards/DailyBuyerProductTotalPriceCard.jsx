import React, { useEffect, useState } from 'react';
import swal from 'sweetalert2/dist/sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useBuyerDailyProductTotalPriceQuery, useCreateDailyBuyerProductTotalPriceMutation } from '../../redux/features/BuyerProductApi/buyerProductApi';

const DailyBuyerProductTotalPriceCard = ({ totalPrice = 0, title }) => {
  const [dailyForm, setDailyForm] = useState({
    daily_buyer_product_total_price: '',
    date: '',
  });

  const { refetch } = useBuyerDailyProductTotalPriceQuery()

  const [showProfit, setShowProfit] = useState(false);
  const [errors, setErrors] = useState({ dailytotalprice: '', date: '' });

  // ✅ This is REQUIRED to send data to your API
  const [createDailyBuyerProductTotalPrice, { isLoading }] =
    useCreateDailyBuyerProductTotalPriceMutation();

  // ✅ Automatically fill input when totalPrice prop changes
  useEffect(() => {
    if (totalPrice !== undefined && totalPrice !== null) {
      setDailyForm((prev) => ({
        ...prev,
        daily_buyer_product_total_price: totalPrice.toString(),
      }));
    }
  }, [totalPrice]);

  const toggleShowProfit = () => setShowProfit(!showProfit);

  // ✅ When you submit form → sends data to database
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};
    if (dailyForm.daily_buyer_product_total_price === '') {
      validationErrors.dailytotalprice = 'Total Price is required.';
    } else if (isNaN(dailyForm.daily_buyer_product_total_price)) {
      validationErrors.dailytotalprice = 'Total Price must be a valid number.';
    }

    if (!dailyForm.date) {
      validationErrors.date = 'Date is required.';
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        // ✅ Sends data to your API → backend → database
        await createDailyBuyerProductTotalPrice({
          daily_buyer_product_total_price: Number(dailyForm.daily_buyer_product_total_price),
          date: dailyForm.date,
        }).unwrap();

        // ✅ Clear input after success
        setDailyForm({ daily_buyer_product_total_price: '', date: '' });
        refetch();
        swal.fire({
          title: 'Success',
          text: 'Daily Buyer Total Price Added Successfully.',
          icon: 'success',
          confirmButtonText: 'Ok',
          buttonsStyling: false,
          customClass: { confirmButton: 'sweetalert_btn_success' },
        });
      } catch (err) {
        swal.fire({
          title: 'Error!',
          text: 'Daily Buyer Total Price Not Added.',
          icon: 'error',
          confirmButtonText: 'Ok',
          buttonsStyling: false,
          customClass: { confirmButton: 'sweetalert_btn_error' },
        });
      }
    }
  };

  return (
    <div className="card form_div mb-5 p-3 pb-0 rounded-2 w-100">
      <form
        className="d-flex justify-content-between flex-wrap"
        onSubmit={handleSubmit}
      >
        <div className="col-auto position-relative">
          <input
            type={showProfit ? 'number' : 'password'}
            className={`p-1 my-2 ${errors.dailytotalprice ? 'is-invalid' : ''}`}
            placeholder="Daily Total Price"
            value={dailyForm.daily_buyer_product_total_price}
            onChange={(e) =>
              setDailyForm({
                ...dailyForm,
                daily_buyer_product_total_price: e.target.value,
              })
            }
          />
          <span
            className="position-absolute end-0 me-2"
            style={{ cursor: 'pointer', top: '13px' }}
            onClick={toggleShowProfit}
          >
            {showProfit ? <FaEyeSlash /> : <FaEye />}
          </span>
          {errors.dailytotalprice && (
            <div className="text-danger mb-1" style={{ fontSize: '0.875rem' }}>
              {errors.dailytotalprice}
            </div>
          )}
        </div>

        <div className="col-auto">
          <input
            type="date"
            className={`p-1 my-2 ${errors.date ? 'is-invalid' : ''}`}
            value={dailyForm.date}
            onChange={(e) =>
              setDailyForm({ ...dailyForm, date: e.target.value })
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
            className="btn btn-danger my-2"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Add Daily Buyer Total Price'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyBuyerProductTotalPriceCard;
