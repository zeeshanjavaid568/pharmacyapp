import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Widgits from '../components/Widgits/Widgits';
import SalerProductCard from '../components/Cards/SalerProductCard';
import { useBuyerProductQuery } from '../redux/features/BuyerProductApi/buyerProductApi';
import { useSalerProductQuery } from '../redux/features/SalerProductApi/salerProductApi';
import DailyProfitWidgits from '../components/Widgits/DailyProfitWidgits';
import MonthlyProfitWidgits from '../components/Widgits/MonthlyProfitWidgits';
import DailyProfitAddCard from '../components/Cards/DailyProfitAddCard';
import MonthlyProfitAddCard from '../components/Cards/MonthlyProfitAddCard';
import { useDailyProfitQuery } from '../redux/features/DailyProfitApi/dailyProfitApi';
import Swal from 'sweetalert2/dist/sweetalert2';
import DailyBuyerProductTotalPriceCard from '../components/Cards/DailyBuyerProductTotalPriceCard';
import DailySalerProductTotalCard from '../components/Cards/DailySalerProductTotalPriceCard';

const Home = () => {
  const { data: buyerProduct, refetch: refetchBuyerProducts, isError: isErrorBuyer, error: errorBuyer } = useBuyerProductQuery();
  const { data: salerProduct, refetch: refetchSalerProducts, isError: isErrorSaler, error: errorSaler } = useSalerProductQuery();
  const { data: dailyProfitData, refetch: refetchDailyProfit, isError: isErrorDailyProfit, error: errorDailyProfit } = useDailyProfitQuery();

  const [totalBuyerProductsPrice, setTotalBuyerProductsPrice] = useState(0);
  const [totalBuyerProductsCount, setTotalBuyerProductsCount] = useState(0);
  const [dailyProfit, setDailyProfit] = useState(0);
  const [totalSalerProductsPrice, setTotalSalerProductsPrice] = useState(0);
  const [totalSalerProductsCount, setTotalSalerProductsCount] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [productErrors, setProductErrors] = useState([]);
  const [profitDetails, setProfitDetails] = useState([]); // Store detailed profit info

  const formatDate = (date) => format(new Date(date), 'yyyy-MM-dd');
  const formatMonth = (date) => format(new Date(date), 'yyyy-MM');

  const handleError = (isError, error) => {
    if (isError) {
      console.error('API Error:', error);
    }
  };

  // Helper function to get the latest buyer product for a given name
  const getLatestBuyerProduct = (buyerProducts, productName) => {
    const matchedProducts = buyerProducts.filter(
      (buyer) => buyer.product_name === productName
    );
    
    if (matchedProducts.length === 0) return null;
    
    // Sort by date (assuming date field exists) and get the latest
    // If you have an id or timestamp, use that instead
    return matchedProducts.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  // Helper function to group products by name and get latest entry
  const getLatestBuyerProductsMap = (buyerProducts) => {
    const latestBuyerMap = new Map();
    
    buyerProducts.forEach((buyer) => {
      const existing = latestBuyerMap.get(buyer.product_name);
      if (!existing || new Date(buyer.date) > new Date(existing.date)) {
        latestBuyerMap.set(buyer.product_name, buyer);
      }
    });
    
    return latestBuyerMap;
  };

  // Function to calculate daily purchase products (buyer products)
  const calculateDailyPurchaseProducts = (buyerProductsData) => {
    const currentDate = formatDate(new Date());
    const buyerPiecesMultiplier = parseInt(localStorage.getItem('buyer_pieces')) || 1;
    
    let totalPrice = 0;
    let totalItems = 0;
    
    // Filter today's buyer products
    const todayBuyerProducts = buyerProductsData.filter(
      (product) => formatDate(product.date) === currentDate
    );
    
    // Calculate totals for today's buyer products
    todayBuyerProducts.forEach((product) => {
      const pieces = buyerPiecesMultiplier;
      const productTotalPrice = product.pieces_price * pieces;
      
      totalPrice += productTotalPrice;
      totalItems += pieces;
      
      console.log(`Daily Purchase Product: ${product.product_name}, Price: ${product.pieces_price}, Pieces: ${pieces}, Total: ${productTotalPrice}`);
    });
    
    console.log(`Total Daily Purchase Products - Price: ${totalPrice}, Items: ${totalItems}`);
    
    return {
      totalPrice,
      totalItems,
      products: todayBuyerProducts
    };
  };

  // Function to calculate daily saler products and profits
  const calculateDailySalerAndProfit = (salerProductsData, buyerProductsData) => {
    const currentDate = formatDate(new Date());
    const salerPiecesMultiplier = parseInt(localStorage.getItem('saler_pieces')) || 1;
    
    let totalPriceSaler = 0;
    let totalItemsSaler = 0;
    let totalProfit = 0;
    const unmatchedProducts = [];
    const profitEntries = [];
    
    // Get latest buyer products map for efficient lookup
    const latestBuyerMap = getLatestBuyerProductsMap(buyerProductsData);
    
    // Filter today's seller products
    const todaySalerProducts = salerProductsData.filter(
      (product) => formatDate(product.date) === currentDate
    );
    
    // Calculate totals and profit for today's seller products
    todaySalerProducts.forEach((product) => {
      const salerPieces = salerPiecesMultiplier;
      const productTotalPrice = product.pieces_price * salerPieces;
      
      totalPriceSaler += productTotalPrice;
      totalItemsSaler += salerPieces;
      
      // Find matching buyer product (latest entry)
      const matchingBuyer = latestBuyerMap.get(product.product_name);
      
      if (matchingBuyer) {
        // Calculate profit per piece
        const profitPerPiece = product.product_price - matchingBuyer.product_price;
        const totalProductProfit = profitPerPiece * salerPieces;
        
        totalProfit += totalProductProfit;
        
        // Store profit details for display
        profitEntries.push({
          productName: product.product_name,
          buyerPrice: matchingBuyer.product_price,
          sellerPrice: product.product_price,
          profitPerPiece: profitPerPiece,
          pieces: salerPieces,
          totalProfit: totalProductProfit,
          buyerDate: matchingBuyer.date,
          sellerDate: product.date
        });
      } else {
        unmatchedProducts.push(product.product_name);
        Swal.fire({
          title: 'Warning!',
          text: `No matching buyer product found for: ${product.product_name}. Profit not calculated for this product until a buyer product is added.`,
          icon: 'warning',
          confirmButtonText: 'Ok',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'sweetalert_btn_warning',
          },
          timer: 3000,
          showConfirmButton: true
        });
      }
    });
    
    return {
      totalPrice: totalPriceSaler,
      totalItems: totalItemsSaler,
      totalProfit,
      profitEntries,
      unmatchedProducts
    };
  };

  // Function to store profit entries in localStorage
  const storeProfitEntries = (currentDate, totalProfit, profitEntries) => {
    const profitEntryToStore = {
      date: currentDate,
      totalProfit: totalProfit,
      details: profitEntries,
      timestamp: new Date().toISOString()
    };
    
    // Get existing profit entries from localStorage
    const existingProfitEntries = JSON.parse(localStorage.getItem('dailyProfitEntries')) || [];
    
    // Check if entry for today already exists
    const todayEntryIndex = existingProfitEntries.findIndex(entry => entry.date === currentDate);
    
    if (todayEntryIndex !== -1) {
      // Update existing entry
      existingProfitEntries[todayEntryIndex] = profitEntryToStore;
    } else {
      // Add new entry
      existingProfitEntries.push(profitEntryToStore);
    }
    
    localStorage.setItem('dailyProfitEntries', JSON.stringify(existingProfitEntries));
  };

  // Function to calculate monthly profit
  const calculateMonthlyProfit = () => {
    const currentMonth = formatMonth(new Date());
    
    if (dailyProfitData && dailyProfitData.length > 0) {
      let totalMonthlyProfit = 0;
      
      dailyProfitData.forEach((profitRecord) => {
        const recordMonth = formatMonth(profitRecord.date);
        if (recordMonth === currentMonth) {
          totalMonthlyProfit += profitRecord.daily_profit || 0;
        }
      });
      
      return totalMonthlyProfit;
    } else {
      // Fallback to localStorage if API data is not available
      const storedEntries = JSON.parse(localStorage.getItem('dailyProfitEntries')) || [];
      let totalMonthlyProfit = 0;
      
      storedEntries.forEach((entry) => {
        const entryMonth = formatMonth(entry.date);
        if (entryMonth === currentMonth) {
          totalMonthlyProfit += entry.totalProfit || 0;
        }
      });
      
      return totalMonthlyProfit;
    }
  };

  useEffect(() => {
    handleError(isErrorBuyer, errorBuyer);
    handleError(isErrorSaler, errorSaler);

    if (buyerProduct && salerProduct) {
      const currentDate = formatDate(new Date());
      
      // Calculate Daily Purchase Products (Buyer Products)
      const dailyPurchase = calculateDailyPurchaseProducts(buyerProduct);
      
      // Calculate Daily Saler Products and Profit
      const dailySalerAndProfit = calculateDailySalerAndProfit(salerProduct, buyerProduct);
      
      // Store profit entries in localStorage
      storeProfitEntries(currentDate, dailySalerAndProfit.totalProfit, dailySalerAndProfit.profitEntries);
      
      // Set state values
      setTotalBuyerProductsPrice(dailyPurchase.totalPrice);
      setTotalBuyerProductsCount(dailyPurchase.totalItems);
      setTotalSalerProductsPrice(dailySalerAndProfit.totalPrice);
      setTotalSalerProductsCount(dailySalerAndProfit.totalItems);
      setDailyProfit(dailySalerAndProfit.totalProfit);
      setProfitDetails(dailySalerAndProfit.profitEntries);
      setProductErrors(dailySalerAndProfit.unmatchedProducts);
    }
    
    // Calculate monthly profit
    const monthlyProfitTotal = calculateMonthlyProfit();
    setMonthlyProfit(monthlyProfitTotal);
    
  }, [buyerProduct, salerProduct, isErrorBuyer, errorBuyer, isErrorSaler, errorSaler, dailyProfitData]);

  const handleProductAdded = () => {
    refetchBuyerProducts();
    refetchSalerProducts();
    refetchDailyProfit();
  };

  // Function to clear today's profit data (if needed for testing)
  const clearTodayProfitData = () => {
    const currentDate = formatDate(new Date());
    const existingEntries = JSON.parse(localStorage.getItem('dailyProfitEntries')) || [];
    const filteredEntries = existingEntries.filter(entry => entry.date !== currentDate);
    localStorage.setItem('dailyProfitEntries', JSON.stringify(filteredEntries));
    handleProductAdded(); // Refresh data
  };

  return (
    <div className=''>
      <div className="Widgits_main_wrapper d-flex justify-content-between flex-grow-1 flex-wrap">
        <Widgits
          title={'Daily Purchase Products'}
          totalPrice={`Rs: ${totalBuyerProductsPrice.toLocaleString()}`}
          totalItems={`${totalBuyerProductsCount}`}
        />
        <Widgits
          title={'Daily Saler Products'}
          totalPrice={`Rs: ${totalSalerProductsPrice.toLocaleString()}`}
          totalItems={`${totalSalerProductsCount}`}
        />
        <DailyProfitWidgits
          title={'Daily Products Profit'}
          totalPrice={`Rs: ${dailyProfit.toLocaleString()}`}
          totalItems={`${totalSalerProductsCount}`}
        />
        <MonthlyProfitWidgits
          title={'Monthly Products Profit'}
          totalPrice={`Rs: ${monthlyProfit.toLocaleString()}`}
        />
      </div>

      <div className='row'>
        <div className='d-flex justify-content-between mt-5'>
          <DailyBuyerProductTotalPriceCard
            title={'Daily Buyer Products'}
            totalPrice={`Rs: ${totalBuyerProductsPrice.toLocaleString()}`}
          />
          <DailySalerProductTotalCard
            title={'Daily Seller Products'}
            totalPrice={`Rs: ${totalSalerProductsPrice.toLocaleString()}`}
          />
        </div>
      </div>

      {/* Display profit details in a collapsible section */}
      {profitDetails.length > 0 && (
        <div className="row mt-3">
          <div className="col-12">
            <div className="accordion form_div rounded-2" id="profitDetailsAccordion">
              <div className="accordion-item">
                <h2 className="accordion-header" id="profitDetailsHeading">
                  <button 
                    className="accordion-button collapsed" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#profitDetailsCollapse" 
                    aria-expanded="false" 
                    aria-controls="profitDetailsCollapse" 
                    style={{ backgroundColor: 'white' }}
                  >
                    <strong>Today's Profit Details (Click to expand)</strong>
                  </button>
                </h2>
                <div id="profitDetailsCollapse" className="accordion-collapse collapse" aria-labelledby="profitDetailsHeading">
                  <div className="accordion-body">
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead className="gradient_bg text-white">
                          <tr>
                            <th>Product Name</th>
                            <th>Purchase Price (PKR)</th>
                            <th>Selling Price (PKR)</th>
                            <th>Profit/Piece (PKR)</th>
                            <th>Pieces Sold</th>
                            <th>Total Profit (PKR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profitDetails.map((detail, index) => (
                            <tr key={index}>
                              <td className="fw-semibold">{detail.productName}</td>
                              <td>{detail.buyerPrice.toLocaleString()}</td>
                              <td>{detail.sellerPrice.toLocaleString()}</td>
                              <td className={detail.profitPerPiece >= 0 ? 'text-success' : 'text-danger'}>
                                {detail.profitPerPiece >= 0 ? '+' : ''}{detail.profitPerPiece.toLocaleString()}
                              </td>
                              <td>{detail.pieces}</td>
                              <td className="fw-bold text-success">
                                +{detail.totalProfit.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <td colSpan="5" className="text-end fw-bold">Total Daily Profit:</td>
                            <td className="fw-bold text-success fs-5">+{dailyProfit.toLocaleString()} PKR</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              monthlyProfits={`${monthlyProfit}`}
            />
          </div>
        </div>

        {/* Display unmatched products errors */}
        {productErrors.length > 0 && (
          <div className="error_list mt-3 mb-5 card form_div p-3">
            <h5 className="gradient_text">
              ⚠️ Products Without Matching Buyer Records:
            </h5>
            <ul className="mt-2">
              {productErrors.map((productName, index) => (
                <li
                  key={index}
                  className="text-danger"
                  style={{
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#fff5f5',
                    borderRadius: '5px',
                    listStyle: 'none'
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                    📦 {productName}
                  </span>
                  <span className='text-dark ms-2'>
                    — No matching buyer product found. Profit not calculated.
                  </span>
                </li>
              ))}
            </ul>
            <div className="alert alert-warning mt-2 mb-0">
              <small>
                <strong>Note:</strong> To calculate profit for these products, please add corresponding buyer products with the same name.
              </small>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-md-6 mb-3 pe-xxl-4 pe-xl-4">
            <SalerProductCard onProductAdded={handleProductAdded} />
          </div>
          <div className="col-md-6 ps-xxl-4 ps-xl-4">
            {/* You can add BuyerProductCard here if needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;