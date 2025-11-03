import React from 'react';
import { Link } from 'react-router-dom';
import TakenDuesCard from '../components/Cards/TakenDuesCard';
import { useGetAllTakenDuesQuery } from '../redux/features/DuesApi/takenDuesApi';

const TakenDuesRecord = () => {
  const { data, isLoading, isError, } = useGetAllTakenDuesQuery();

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
      <h1 className='d-flex justify-content-center my-4 gradient_text'>Taken Dues All Years Record</h1>
      <TakenDuesCard />

      <div className='responsive_card'>
        {isLoading && <p>Loading...</p>}
        {isError && <p>Error loading data.</p>}
        {!isLoading &&
          !isError &&
          Object.keys(yearlyData).map((year) => (
            <div key={year} className='yearly_record_card border rounded-2 my-1 form_div'>
              <Link
                to={`/takendues-details/${year}`}
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

export default TakenDuesRecord;
