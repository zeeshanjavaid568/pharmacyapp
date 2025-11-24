import React, { useState, useEffect } from 'react';
import { useBuyerProductQuery, useDeleteBuyerProductMutation } from '../redux/features/BuyerProductApi/buyerProductApi';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import BuyerProductCard from '../components/Cards/BuyerProductCard';

// ✅ Helper: Format date safely (moved outside component for reusability)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date)) return '-';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

// ✅ Helper: Calculate remaining days until expiration
const getRemainingDays = (expireDate) => {
  if (!expireDate) return null;

  const today = new Date();
  const expirationDate = new Date(expireDate);

  // Reset times to compare only dates
  today.setHours(0, 0, 0, 0);
  expirationDate.setHours(0, 0, 0, 0);

  if (isNaN(expirationDate)) return null;

  // Calculate difference in days
  const diffTime = expirationDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// ✅ Helper: Check if a product is expiring within 1 month
const isExpiringWithinOneMonth = (expireDate) => {
  const remainingDays = getRemainingDays(expireDate);
  return remainingDays !== null && remainingDays <= 30 && remainingDays >= 0;
};

// ✅ Helper: Check if product is already expired
const isExpired = (expireDate) => {
  const remainingDays = getRemainingDays(expireDate);
  return remainingDays !== null && remainingDays < 0;
};

// ✅ Helper: Format remaining days with proper text
const formatRemainingDays = (expireDate) => {
  const remainingDays = getRemainingDays(expireDate);

  if (remainingDays === null) return { text: 'No date', color: 'secondary' };
  if (remainingDays < 0) return { text: `Expired ${Math.abs(remainingDays)} days ago`, color: 'danger' };
  if (remainingDays === 0) return { text: 'Expires today!', color: 'danger' };
  if (remainingDays === 1) return { text: '1 day left', color: 'danger' };
  if (remainingDays <= 7) return { text: `${remainingDays} days left`, color: 'danger' };
  if (remainingDays <= 30) return { text: `${remainingDays} days left`, color: 'warning' };
  return { text: `${remainingDays} days left`, color: 'success' };
};

const BuyerRecord = () => {
  const { data, isLoading, isError, refetch } = useBuyerProductQuery();
  const [deleteBuyerProduct] = useDeleteBuyerProductMutation();

  const [selectedYear, setSelectedYear] = useState(null);
  const [searchProductName, setSearchProductName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchExpireDate, setSearchExpireDate] = useState('');
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [expiredProducts, setExpiredProducts] = useState([]);

  // ✅ Check for expiring products when data loads
  useEffect(() => {
    if (data && data.length > 0) {
      checkExpiringProducts();
    }
  }, [data]);

  // ✅ Function to check expiring products
  const checkExpiringProducts = () => {
    const soonExpiring = [];
    const alreadyExpired = [];

    data.forEach(product => {
      if (product.expire_date) {
        const remainingDays = getRemainingDays(product.expire_date);

        if (remainingDays !== null) {
          if (remainingDays < 0) {
            alreadyExpired.push({ ...product, remainingDays });
          } else if (remainingDays <= 30) {
            soonExpiring.push({ ...product, remainingDays });
          }
        }
      }
    });

    setExpiringProducts(soonExpiring);
    setExpiredProducts(alreadyExpired);

    // Show alerts if there are expiring or expired products
    showExpirationAlerts(soonExpiring, alreadyExpired);
  };

  // ✅ Show expiration alerts with remaining days
  const showExpirationAlerts = (soonExpiring, alreadyExpired) => {
    // Show expired products alert first
    if (alreadyExpired.length > 0) {
      const expiredList = alreadyExpired.map(p =>
        `<tr>
          <td><strong>${p.product_name}</strong></td>
          <td style="color: #d32f2f; font-weight: bold;">Expired ${Math.abs(p.remainingDays)} days ago</td>
        </tr>`
      ).join('');

      Swal.fire({
        title: '⚠️ Expired Products Alert!',
        html: `
          <div style="text-align: left;">
            <p><strong>The following products have EXPIRED:</strong></p>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
              <thead>
                <tr style="border-bottom: 1px solid #ddd;">
                  <th style="text-align: left; padding: 8px;">Product Name</th>
                  <th style="text-align: left; padding: 8px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${expiredList}
              </tbody>
            </table>
            <p style="color: #d32f2f; font-weight: bold;">Please remove or update these products immediately.</p>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'I Understand',
        confirmButtonColor: '#d32f2f',
        width: 700,
        customClass: {
          popup: 'expiration-alert-popup'
        }
      });
    }

    // Show soon expiring products alert after a delay
    if (soonExpiring.length > 0) {
      setTimeout(() => {
        const expiringList = soonExpiring.map(p => {
          const daysText = p.remainingDays === 0 ? 'Expires today!' :
            p.remainingDays === 1 ? '1 day left' :
              `${p.remainingDays} days left`;
          const color = p.remainingDays <= 7 ? '#d32f2f' : '#ff9800';

          return `<tr>
            <td><strong>${p.product_name}</strong></td>
            <td style="color: ${color}; font-weight: bold;">${daysText}</td>
          </tr>`;
        }).join('');

        Swal.fire({
          title: '📅 Expiration Warning!',
          html: `
            <div style="text-align: left;">
              <p><strong>The following products will expire soon:</strong></p>
              <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                <thead>
                  <tr style="border-bottom: 1px solid #ddd;">
                    <th style="text-align: left; padding: 8px;">Product Name</th>
                    <th style="text-align: left; padding: 8px;">Remaining Days</th>
                  </tr>
                </thead>
                <tbody>
                  ${expiringList}
                </tbody>
              </table>
              <p style="color: #ff9800; font-weight: bold;">Please take necessary action for these products.</p>
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'Got It',
          confirmButtonColor: '#ff9800',
          width: 700,
          customClass: {
            popup: 'expiration-warning-popup'
          }
        });
      }, alreadyExpired.length > 0 ? 1000 : 0); // Delay if expired alert was shown
    }
  };

  // ✅ Manual check expiration button handler
  const handleCheckExpiration = () => {
    if (data && data.length > 0) {
      checkExpiringProducts();

      if (expiringProducts.length === 0 && expiredProducts.length === 0) {
        Swal.fire({
          title: '✅ All Good!',
          text: 'No products are expired or expiring soon.',
          icon: 'success',
          confirmButtonText: 'Great!',
          confirmButtonColor: '#4caf50'
        });
      }
    } else {
      Swal.fire({
        title: 'No Data',
        text: 'No product data available to check.',
        icon: 'info',
        confirmButtonText: 'Ok'
      });
    }
  };

  // ✅ Helper: Group data by year
  const groupDataByYear = (data) => {
    return data.reduce((acc, record) => {
      const year = new Date(record.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(record);
      return acc;
    }, {});
  };

  const yearlyData = data ? groupDataByYear(data) : {};

  // ✅ Delete Record
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

  // ✅ Filter records if a year is selected
  const records = selectedYear ? yearlyData[selectedYear] || [] : [];

  const filteredRecords = records.filter((record) => {
    const matchesProductName = record.product_name
      ?.toLowerCase()
      .includes(searchProductName.toLowerCase());
    const matchesDate = searchDate ? formatDate(record.date) === searchDate : true;
    const matchesExpireDate = searchExpireDate
      ? formatDate(record.expire_date) === searchExpireDate
      : true;
    return matchesProductName && matchesDate && matchesExpireDate;
  });

  const tableHeadingStyle = { backgroundColor: '#f44336', color: 'white' }

  // ✅ Row style based on expiration status
  const getRowStyle = (record) => {
    if (!record.expire_date) return {};

    if (isExpired(record.expire_date)) {
      return { backgroundColor: '#ffebee' }; // Light red for expired
    } else if (isExpiringWithinOneMonth(record.expire_date)) {
      return { backgroundColor: '#fff3e0' }; // Light orange for expiring soon
    }
    return {};
  };

  // ✅ Expiration status badge with remaining days
  const getExpirationBadge = (record) => {
    if (!record.expire_date) return null;

    const remainingInfo = formatRemainingDays(record.expire_date);

    return (
      <span className={`badge bg-${remainingInfo.color} ms-1`}>
        {remainingInfo.text}
      </span>
    );
  };

  // ✅ Show loading / error
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading data.</p>;

  return (
    <>
      <div className='d-flex justify-content-center'>
        <BuyerProductCard />
      </div>

      {/* 🔔 Expiration Check Button */}
      <div className="text-center mb-3">
        <button
          className="btn btn-warning"
          onClick={handleCheckExpiration}
          title="Check for products expiring within 30 days"
        >
          🔔 Check Product Expiration
        </button>

        {/* 📊 Expiration Summary */}
        {(expiredProducts.length > 0 || expiringProducts.length > 0) && (
          <div className="mt-2">
            {expiredProducts.length > 0 && (
              <span className="badge bg-danger me-2">
                {expiredProducts.length} Expired
              </span>
            )}
            {expiringProducts.length > 0 && (
              <span className="badge bg-warning">
                {expiringProducts.length} Expiring Soon
              </span>
            )}
          </div>
        )}
      </div>

      {!selectedYear ? (
        <>
          <h1 className='d-flex justify-content-center my-4 gradient_text'>
            Purchase All Years Record
          </h1>
          <div className='responsive_card'>
            {Object.keys(yearlyData).map((year) => (
              <div
                key={year}
                className='yearly_record_card border rounded-2 my-1 form_div text-center'
                onClick={() => setSelectedYear(year)}
                style={{ cursor: 'pointer' }}
              >
                <span className='yearly_record_links'>
                  {year} ({yearlyData[year].length} records)
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className='year_record_table d-flex justify-content-center my-4 gradient_text'>
            Purchase Record Details ({selectedYear})
          </h1>

          {/* 🔙 Back Button */}
          <div className="text-center mb-3">
            <button className="btn border rounded-2 my-1 form_div text-center" onClick={() => setSelectedYear(null)}>
              ← Back to All Years
            </button>
          </div>

          {/* 🔍 Search Filters */}
          <div className="search-container mb-3 d-flex justify-content-start align-items-center flex-wrap">
            <div className="form-group mt-2 me-2">
              <label>Search by Product Name:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter product name"
                value={searchProductName}
                onChange={(e) => setSearchProductName(e.target.value)}
              />
            </div>
            <div className="form-group mt-2 me-2">
              <label>Search by Date:</label>
              <input
                type="date"
                className="form-control"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
            <div className="form-group mt-2">
              <label>Search by Expire Date:</label>
              <input
                type="date"
                className="form-control"
                value={searchExpireDate}
                onChange={(e) => setSearchExpireDate(e.target.value)}
              />
            </div>
          </div>

          {/* 🧾 Table */}
          <div className="table-container p-3 mb-5">
            {isLoading && <p className="text-center py-4">Loading...</p>}
            {isError && <p className="text-center text-danger">Error loading data.</p>}
            {!isLoading && !isError && (
              <table className='table table-bordered table-hover form_div'>
                <thead>
                  <tr>
                    <th style={tableHeadingStyle}>#</th>
                    <th style={tableHeadingStyle}>Product Name</th>
                    <th style={tableHeadingStyle}>Product Price</th>
                    <th style={tableHeadingStyle}>Product Saling Price</th>
                    <th style={tableHeadingStyle}>Total Pieces Price</th>
                    <th style={tableHeadingStyle}>Total Pieces</th>
                    <th style={tableHeadingStyle}>Remains Stock</th>
                    <th style={tableHeadingStyle}>Expire Date</th>
                    <th style={tableHeadingStyle}>Date</th>
                    <th style={tableHeadingStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => {
                    const remainingInfo = formatRemainingDays(record.expire_date);
                    return (
                      <tr key={record.id || index} style={getRowStyle(record)}>
                        <td>{index + 1}</td>
                        <td>
                          {record.product_name}
                          {getExpirationBadge(record)}
                        </td>
                        <td>{record.product_price}</td>
                        <td>{record.saling_price}</td>
                        <td>{record.pieces_price}</td>
                        <td>{record.pieces}</td>
                        <td>{record.stock}</td>
                        <td>{formatDate(record.expire_date)}</td>
                        <td>{formatDate(record.date)}</td>
                        <td className='d-flex justify-content-center align-items-center'>
                          <Link to={`/updatebuyerproduct/${record.id}`} className="update_btn me-3">
                            Update
                          </Link>
                          <button className="delete_btn" onClick={() => handleDelete(record.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="11" className="text-center">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default BuyerRecord;