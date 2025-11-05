import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import GiveDuesCard from '../components/Cards/GiveDuesCard';
import { useGetAllDuesQuery, useDeleteGivenDuesMutation } from '../redux/features/DuesApi/giveDuesApi';

const GiveDuesRecord = () => {
  const { data = [], isLoading, isError, refetch } = useGetAllDuesQuery();
  const [deleteGivenDues] = useDeleteGivenDuesMutation();

  // ✅ Filters
  const [searchDate, setSearchDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchMonth, setSearchMonth] = useState('');
  const [searchYear, setSearchYear] = useState('');

  // ✅ Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  // ✅ Filtering logic (name, date, month, year)
  const filteredRecords = data.filter((record) => {
    const recordDate = formatDate(record.date);
    const matchesName = searchName
      ? record.name?.toLowerCase().includes(searchName.toLowerCase())
      : true;

    const matchesDate = searchDate ? recordDate === searchDate : true;

    // Extract year/month from record
    const recordYear = recordDate.split('-')[0];
    const recordMonth = recordDate ? `${recordYear}/${recordDate.split('-')[1]}` : '';

    const matchesMonth = searchMonth ? recordMonth === searchMonth : true;
    const matchesYear = searchYear ? recordYear === searchYear : true;

    return matchesName && matchesDate && matchesMonth && matchesYear;
  });

  // ✅ Find last record price
  const lastPrice = useMemo(() => {
    if (filteredRecords.length === 0) return 0;
    return Number(filteredRecords[filteredRecords.length - 1].price) || 0;
  }, [filteredRecords]);

  // ✅ Handle delete
  const handleDelete = async (id) => {
    try {
      await deleteGivenDues(id).unwrap();
      Swal.fire({
        title: 'Deleted!',
        text: 'Given Dues deleted successfully.',
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });
      await refetch();
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete Given Dues. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
    }
  };

  // ✅ Handle PDF Download
  const handleDownloadPDF = async () => {
    try {
      // ✅ Dynamic import for better performance
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');

      // Handle different import styles
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      // ✅ Title
      doc.setFontSize(18);
      doc.text('Given Dues Record Report', 40, 40);

      // ✅ Add current filters info
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 65);

      let yPosition = 85;
      if (searchName) {
        doc.text(`Filtered by Name: ${searchName}`, 40, yPosition);
        yPosition += 20;
      }
      if (searchDate) {
        doc.text(`Filtered by Date: ${searchDate}`, 40, yPosition);
        yPosition += 20;
      }
      if (searchMonth) {
        doc.text(`Filtered by Month: ${searchMonth}`, 40, yPosition);
        yPosition += 20;
      }
      if (searchYear) {
        doc.text(`Filtered by Year: ${searchYear}`, 40, yPosition);
        yPosition += 20;
      }

      // ✅ Define Table Columns for PDF
      const tableColumn = [
        'Sr.#',
        'Name',
        'Single Piece Price',
        'Total Piece',
        'Given Dues',
        'Taken Dues',
        'Remains Total Price',
        'Date',
      ];

      // ✅ Prepare table rows data
      const tableRows = filteredRecords.map((record, index) => [
        index + 1,
        record.name || '-',
        record.single_piece_price ? `$${record.single_piece_price}` : '$0',
        record.total_piece || '0',
        record.given_dues ? `$${record.given_dues}` : '$0',
        record.taken_dues ? `$${record.taken_dues}` : '$0',
        record.price ? `$${record.price}` : '$0',
        formatDate(record.date),
      ]);

      // ✅ Add summary information
      doc.setFontSize(12);
      doc.text(`Total Records: ${filteredRecords.length}`, 40, yPosition + 10);
      doc.text(`Last Entry Price: $${lastPrice}`, 200, yPosition + 10);

      // ✅ Add table using autoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPosition + 30,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 4,
          minCellHeight: 20,
        },
        headStyles: {
          fillColor: [244, 67, 54], // Red color
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 10 },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 40 },  // Sr.#
          1: { cellWidth: 80 },  // Name
          2: { cellWidth: 70 },  // Single Piece Price
          3: { cellWidth: 50 },  // Total Piece
          4: { cellWidth: 60 },  // Given Dues
          5: { cellWidth: 60 },  // Taken Dues
          6: { cellWidth: 70 },  // Remains Total Price
          7: { cellWidth: 70 },  // Date
        },
        didDrawPage: function (data) {
          // Add page number
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      });

      // ✅ Save the PDF
      const fileName = `Given_Dues_Record_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      // ✅ Success message
      Swal.fire({
        title: 'Success!',
        text: `PDF downloaded successfully with ${filteredRecords.length} records.`,
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate PDF. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
    }
  };

  const TableHeadingStyle = {
    backgroundColor: '#f44336',
    color: 'white',
    textAlign: 'center',
    verticalAlign: 'middle'
  };

  const TableCellStyle = {
    textAlign: 'center',
    verticalAlign: 'middle'
  };

  return (
    <>
      <h1 className="d-flex justify-content-center my-4 gradient_text">
        Add Dues In Record
      </h1>

      {/* 🧾 Add Dues Form */}
      <GiveDuesCard lastPrice={lastPrice} refetchData={refetch} />

      <h1 className="d-flex justify-content-center my-4 gradient_text">
        Dues Record
      </h1>

      {/* 🔍 Search Filters & PDF Button */}
      <div className="search-container px-3 d-flex gap-3 flex-wrap align-items-end">
        {/* 🔎 Name Search */}
        <div className="form-group mt-2">
          <label htmlFor="nameSearch" className="form-label fw-bold">Search by Name:</label>
          <input
            id="nameSearch"
            type="text"
            className="form-control"
            placeholder="Enter name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>

        {/* 📅 Exact Date Search */}
        <div className="form-group mt-2">
          <label htmlFor="dateSearch" className="form-label fw-bold">Search by Exact Date:</label>
          <input
            id="dateSearch"
            type="date"
            className="form-control"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>

        {/* 🗓️ Month Search */}
        <div className="form-group mt-2">
          <label htmlFor="monthSearch" className="form-label fw-bold">Search by Month (YYYY/MM):</label>
          <input
            id="monthSearch"
            type="text"
            className="form-control"
            placeholder="e.g. 2025/05"
            value={searchMonth}
            onChange={(e) => setSearchMonth(e.target.value)}
          />
        </div>

        {/* 📆 Year Search */}
        <div className="form-group mt-2">
          <label htmlFor="yearSearch" className="form-label fw-bold">Search by Year (YYYY):</label>
          <input
            id="yearSearch"
            type="text"
            className="form-control"
            placeholder="e.g. 2024"
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
          />
        </div>

        {/* 💰 Last Entry Price */}
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Remians Total Price</label>
          <div className="form-control text-center fw-bold bg-light">
            {lastPrice}
          </div>
        </div>

        {/* 📊 PDF Download Button */}
        <div className="form-group mt-2">
          <button
            className="btn delete_btn mt-4 px-4"
            onClick={handleDownloadPDF}
            disabled={filteredRecords.length === 0}
            title={filteredRecords.length === 0 ? 'No records to download' : 'Download PDF Report'}
          >
            📄 Download PDF ({filteredRecords.length})
          </button>
        </div>
      </div>

      {/* 📋 Table */}
      <div className="table-responsive p-3">
        {isLoading && (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading records...</p>
          </div>
        )}

        {isError && (
          <div className="alert alert-danger text-center">
            <strong>Error!</strong> Failed to load data. Please try again.
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Summary Info */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="text-muted">
                Showing <strong>{filteredRecords.length}</strong> records
              </p>
              {filteredRecords.length > 0 && (
                <p className="text-muted">
                  Last Price: <strong>{lastPrice}</strong>
                </p>
              )}
            </div>

            <table className="table table-bordered table-hover form_div" style={{ borderRadius: '10px', overflow: 'hidden' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                <tr>
                  <th style={TableHeadingStyle}>#</th>
                  <th style={TableHeadingStyle}>Name</th>
                  <th style={TableHeadingStyle}>Single Piece Price</th>
                  <th style={TableHeadingStyle}>Total Piece</th>
                  <th style={TableHeadingStyle}>Given Dues</th>
                  <th style={TableHeadingStyle}>Taken Dues</th>
                  <th style={TableHeadingStyle}>Remains Total Price</th>
                  <th style={TableHeadingStyle}>Date</th>
                  <th style={TableHeadingStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr key={record.id || index}>
                      <td style={TableCellStyle}>{index + 1}</td>
                      <td style={TableCellStyle}>{record.name}</td>
                      <td style={TableCellStyle}>{record.single_piece_price}</td>
                      <td style={TableCellStyle}>{record.total_piece}</td>
                      <td style={TableCellStyle}>{record.given_dues}</td>
                      <td style={TableCellStyle}>{record.taken_dues}</td>
                      <td style={TableCellStyle}>{record.price}</td>
                      <td style={TableCellStyle}>{formatDate(record.date)}</td>
                      <td style={TableCellStyle}>
                        <button
                          className="delete_btn"
                          onClick={() => handleDelete(record.id)}
                          title="Delete this record"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <div className="text-muted">
                        <i className="fas fa-inbox fa-2x mb-2"></i>
                        <br />
                        No records found
                        {(searchName || searchDate || searchMonth || searchYear) && (
                          <div className="mt-2">
                            <small>Try adjusting your search filters</small>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
};

export default GiveDuesRecord;