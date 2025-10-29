import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Widgits from '../components/Widgits/Widgits';
import BuyerProductCard from '../components/Cards/BuyerProductCard';
import SalerProductCard from '../components/Cards/SalerProductCard';
import { useBuyerProductQuery } from '../redux/features/BuyerProductApi/buyerProductApi';
import { useSalerProductQuery } from '../redux/features/SalerProductApi/salerProductApi';
import DailyProfitWidgits from '../components/Widgits/DailyProfitWidgits';
import MonthlyProfitWidgits from '../components/Widgits/MonthlyProfitWidgits';
import DailyProfitAddCard from '../components/Cards/DailyProfitAddCard';
import MonthlyProfitAddCard from '../components/Cards/MonthlyProfitAddCard';
import { useDailyProfitQuery } from '../redux/features/DailyProfitApi/dailyProfitApi';
import Swal from 'sweetalert2/dist/sweetalert2';

const Home = () => {
  const { data: buyerProduct, refetch: refetchBuyerProducts, isError: isErrorBuyer, error: errorBuyer } = useBuyerProductQuery();
  const { data: salerProduct, refetch: refetchSalerProducts, isError: isErrorSaler, error: errorSaler } = useSalerProductQuery();
  const { data: dailyProfitData, refetch: refetchDailyProfit, isError: isErrorDailyProfit, error: errorDailyProfit } = useDailyProfitQuery();

  const [totalBuyerProductsPrice, setTotalBuyerProdcutsPrice] = useState(0);
  const [totalBuyerProductsCount, setTotalBuyerProductsCount] = useState(0);
  const [dailyProfit, setDailyProfit] = useState(0); // For Daily Profit Calculation
  const [totalSalerProductsPrice, setTotalSalerProductsPrice] = useState(0);
  const [totalSalerProductsCount, setTotalSalerProductsCount] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0); // Store monthly profit
  const [productErrors, setProductErrors] = useState([]); // State to track unmatched product errors

  const formatDate = (date) => format(new Date(date), 'yyyy-MM-dd');
  const formatMonth = (date) => format(new Date(date), 'yyyy-MM'); // Format to compare months

  // Function to handle errors
  const handleError = (isError, error) => {
    if (isError) {
      console.error('API Error:', error);
    }
  };

  useEffect(() => {
    handleError(isErrorBuyer, errorBuyer);
    handleError(isErrorSaler, errorSaler);

    if (buyerProduct && salerProduct) {
      const currentDate = formatDate(new Date());

      let totalPriceBuyer = 0;
      let totalItemsBuyer = 0;
      let totalPriceSaler = 0;
      let totalItemsSaler = 0;
      let profit = 0;
      const unmatchedProducts = []; // Temp array to track unmatched product errors

      // Filter and calculate buyer's products for today
      buyerProduct.forEach((product) => {
        const productDate = formatDate(product.date);
        if (productDate === currentDate) {
          // Retrieve and parse the value from localStorage
          const newBuyerPieces = parseInt(localStorage.getItem('buyer_pieces')) || 1;
          totalPriceBuyer += product.pieces_price;
          totalItemsBuyer += newBuyerPieces;  // Increment total items by the pieces value

        }
      });


      // Filter and calculate saler's products for today and profit calculation
      salerProduct.forEach((product) => {
        const productDate = formatDate(product.date);
        if (productDate === currentDate) {
          const newSalerPieces = parseInt(localStorage.getItem('saler_pieces')) || 0;
          totalPriceSaler += product.pieces_price;
          totalItemsSaler += newSalerPieces;

          // Compare buyer's price with seller's price for the same product name
          const matchedBuyerProducts = buyerProduct.filter(
            (buyer) => buyer.product_name === product.product_name
          );

          // Inside the salerProduct.forEach loop where profit is calculated
          if (matchedBuyerProducts.length > 0) {
            const salerPieces = parseInt(localStorage.getItem('saler_pieces')) || 1;
            const lastBuyerProduct = matchedBuyerProducts[matchedBuyerProducts.length - 1];
            const newProfit = (product.product_price - lastBuyerProduct.product_price);
            const multiProfit = newProfit * salerPieces;

            const profitEntry = {
              id: product.id,
              productName: product.product_name,
              profit: multiProfit,
              date: currentDate,
              pieces: salerPieces,
            };

            const existingEntries = JSON.parse(localStorage.getItem('profitEntries')) || [];
            if (!existingEntries.some(entry =>
              entry.id === profitEntry.id && entry.productName === profitEntry.productName
            )) {
              existingEntries.push(profitEntry);
              localStorage.setItem('profitEntries', JSON.stringify(existingEntries));
            }
            // Calculate total profit from all stored entries
            const calculatedProfit = existingEntries.reduce(
              (total, entry) => total + entry.profit,
              0
            );

            if (existingEntries.date === currentDate) {
              localStorage.removeItem('profitEntries')
            }
            profit = calculatedProfit;

          } else {
            unmatchedProducts.push(`No matching buyer product found for: ${product.product_name}`);
            Swal.fire({
              title: 'Error!',
              text: `No matching buyer product found for: ${product.product_name}.But product is added or not calculate this product Profit.Until add buyer product`,
              icon: 'error',
              confirmButtonText: 'Ok',
              buttonsStyling: false,
              customClass: {
                confirmButton: 'sweetalert_btn_error',
              },
            });
          }
        }
      });

      // Set the state values after calculation
      setTotalBuyerProdcutsPrice(totalPriceBuyer);
      setTotalBuyerProductsCount(totalItemsBuyer);
      setTotalSalerProductsPrice(totalPriceSaler);
      setTotalSalerProductsCount(totalItemsSaler);
      setDailyProfit(profit); // Set the daily profit

      // Update unmatched product errors
      setProductErrors(unmatchedProducts);
    }

    // Calculate the monthly profit using dailyProfitData from the API
    if (dailyProfitData) {
      const currentMonth = formatMonth(new Date());
      let totalMonthlyProfit = 0;

      dailyProfitData.forEach((profitRecord) => {
        const recordMonth = formatMonth(profitRecord.date);
        if (recordMonth === currentMonth) {
          totalMonthlyProfit += profitRecord.daily_profit;
        }
      });

      setMonthlyProfit(totalMonthlyProfit);
    }
  }, [buyerProduct, salerProduct, isErrorBuyer, errorBuyer, isErrorSaler, errorSaler, dailyProfitData]);

  const handleProductAdded = () => {
    refetchBuyerProducts(); // Refresh buyer products
    refetchSalerProducts(); // Refresh saler products
    refetchDailyProfit(); // Refresh daily profit data
  };

  return (
    <div className=''>
      <div className="Widgits_main_wrapper d-flex justify-content-between flex-grow-1 flex-wrap">
        <Widgits
          title={'Daily Buyer Products'}
          totalPrice={`Rs: ${totalBuyerProductsPrice}`}
          totalItems={`${totalBuyerProductsCount}`}
        />
        <Widgits
          title={'Daily Saler Products'}
          totalPrice={`Rs: ${totalSalerProductsPrice}`}
          totalItems={`${totalSalerProductsCount}`}
        />
        <DailyProfitWidgits
          title={'Daily Products Profit'}
          totalPrice={`Rs: ${dailyProfit}`} // Displaying calculated daily profit
          totalItems={`${totalSalerProductsCount}`}
        />
        <MonthlyProfitWidgits
          title={'Monthly Products Profit'}
          totalPrice={`Rs: ${monthlyProfit}`} // Displaying calculated monthly profit
        />
      </div>



      {/* Display daily profit data in a Bootstrap Collapse */}
      <div className="row">
        <div className="col-12">
          <div className="accordion form_div mt-5 rounded-2" id="dailyProfitAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header" id="dailyProfitHeading">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#dailyProfitCollapse" aria-expanded="false" aria-controls="dailyProfitCollapse" style={{ backgroundColor: 'white' }}>
                  Daily Profit Records of Current Month
                </button>
              </h2>
              <div id="dailyProfitCollapse" className="accordion-collapse collapse" aria-labelledby="dailyProfitHeading" data-bs-parent="#dailyProfitAccordion">
                <div className="accordion-body">
                  {dailyProfitData && dailyProfitData.map((record) => (
                    <div key={record.date}>
                      <p><strong>Date:</strong> {record.date}</p>
                      <p><strong>Profit:</strong> Rs {record.daily_profit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="Form_wrapper ms-1 mt-5">
        <div className='row'>
          <div className='col-12'>
            <DailyProfitAddCard
              totalBuyerItems={`${totalBuyerProductsCount}`}
              totalSalerItems={`${totalSalerProductsCount}`}
              dailyProfits={`${dailyProfit}`}
              onProductAdded={handleProductAdded}
            />
          </div>
        </div>
        <div className='row'>
          <div className='col-12'>
            <MonthlyProfitAddCard
              monthlyProfits={`${monthlyProfit}`} // Displaying calculated monthly profit
            />
          </div>
        </div>

        {productErrors.length > 0 && (
          <div className="error_list mt-3 mb-5 card form_div p-3">
            <h5 className="gradient_text">
              Unmatched Products:
            </h5>
            <ul>
              {productErrors.map((error, index) => (
                <li
                  key={index}
                  className="text-danger"
                  style={{
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#fff5f5',
                    borderRadius: '5px',
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                    {error.replace('No matching buyer product found for: ', '')}
                  </span>{' '}
                  <span className='text-dark'>
                    — {error}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}


        <div className="row">
          <div className="col-md-6 mb-3 pe-xxl-4 pe-xl-4">
            <BuyerProductCard onProductAdded={handleProductAdded} />
          </div>
          <div className="col-md-6 ps-xxl-4 ps-xl-4">
            <SalerProductCard onProductAdded={handleProductAdded} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
