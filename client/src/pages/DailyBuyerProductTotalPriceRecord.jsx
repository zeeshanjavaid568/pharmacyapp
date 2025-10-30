import React from 'react';
import { useBuyerDailyProductTotalPriceQuery } from '../redux/features/BuyerProductApi/buyerProductApi';
import { Link } from 'react-router-dom';

const DailyBuyerProductTotalRecord = () => {
  const { data, isLoading, isError, } = useBuyerDailyProductTotalPriceQuery();

  // Group data by year
  const groupDataByYear = (data) => {
    return data.reduce((acc, record) => {
      const year = new Date(record.date).getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(record);
      return acc;
    }, {});
  };

  const yearlyData = data ? groupDataByYear(data) : {};

  return (
    <>
      <h1 className='d-flex justify-content-center my-4 gradient_text'>Buyer One Day Total Price All Years Record</h1>
      <div className='responsive_card'>
        {isLoading && <p>Loading...</p>}
        {isError && <p>Error loading data.</p>}
        {!isLoading &&
          !isError &&
          Object.keys(yearlyData).map((year) => (
            <div key={year} className='yearly_record_card border rounded-2 my-1 form_div'>
              <Link
                to={`/year-buyer-daily-total-price-record-detail/${year}`}
                state={{ records: yearlyData[year] }} // Pass data using state
                className='text-decoration-none text yearly_record_links d-flex justify-content-center flex-wrap'
              >
                {year} ({yearlyData[year].length} records)
              </Link>
            </div>
          ))}
      </div>
    </>
  );
};

export default DailyBuyerProductTotalRecord;
