import React, { useState, useMemo, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import DuesCard from '../components/Cards/DuesCard';
import { useGetAllDuesQuery, useDeleteGivenDuesMutation } from '../redux/features/DuesApi/giveDuesApi';
import { Link } from 'react-router-dom';

const DuesRecord = () => {
  const { data = [], isLoading, isError, refetch } = useGetAllDuesQuery();
  const [deleteGivenDues] = useDeleteGivenDuesMutation();

  // ✅ Refs for scrolling
  const tableContainerRef = useRef(null);
  const tableRef = useRef(null);

  // ✅ Filters
  const [searchDate, setSearchDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchMonth, setSearchMonth] = useState('');
  const [searchYear, setSearchYear] = useState('');

  // ✅ Khata Management
  const [selectedKhata, setSelectedKhata] = useState(''); // active khata_name

  // ✅ Scroll to top/bottom states
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // ✅ Get unique khata names
  const khataNames = useMemo(() => {
    return [...new Set(data.map((item) => item.khata_name).filter(Boolean))];
  }, [data]);

  // ✅ Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  // ✅ Filtering logic
  const filteredRecords = data.filter((record) => {
    const recordDate = formatDate(record.date);
    const matchesKhata = selectedKhata ? record.khata_name === selectedKhata : true;
    const matchesName = searchName ? record.name?.toLowerCase().includes(searchName.toLowerCase()) : true;
    const matchesDate = searchDate ? recordDate === searchDate : true;

    const recordYear = recordDate.split('-')[0];
    const recordMonth = recordDate ? `${recordYear}/${recordDate.split('-')[1]}` : '';

    const matchesMonth = searchMonth ? recordMonth === searchMonth : true;
    const matchesYear = searchYear ? recordYear === searchYear : true;

    return matchesKhata && matchesName && matchesDate && matchesMonth && matchesYear;
  });

  // ✅ Sort records by date in ascending order (oldest to newest)
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB; // Ascending order (oldest first)
    });
  }, [filteredRecords]);

  // ✅ Calculate running totals for both dues and pieces with CORRECT calculation
  const recordsWithRunningTotals = useMemo(() => {
    if (!sortedRecords.length) return [];

    let runningTotalDues = 0;
    let runningTotalPieces = 0;

    return sortedRecords.map((record) => {
      const givenDues = Number(record.given_dues) || 0;
      const takenDues = Number(record.taken_dues) || 0;
      const totalPiece = Number(record.total_piece) || 0;

      // ✅ CORRECTED CALCULATION: 
      // given_dues = money you gave (increases your receivable)
      // taken_dues = money you received (decreases your receivable)
      const netDuesForRecord = takenDues - givenDues;

      // Add to running totals
      runningTotalDues += netDuesForRecord;
      runningTotalPieces += totalPiece;

      return {
        ...record,
        runningTotal: runningTotalDues,
        runningTotalPieces: runningTotalPieces,
        netDuesForRecord: netDuesForRecord
      };
    });
  }, [sortedRecords]);

  // ✅ Find last record totals for selected khata
  const lastPrice = useMemo(() => {
    if (!selectedKhata) {
      if (recordsWithRunningTotals.length === 0) return 0;
      return recordsWithRunningTotals[recordsWithRunningTotals.length - 1]?.runningTotal || 0;
    }

    const khataRecords = recordsWithRunningTotals.filter((r) => r.khata_name === selectedKhata);
    if (khataRecords.length === 0) return 0;
    return khataRecords[khataRecords.length - 1]?.runningTotal || 0;
  }, [selectedKhata, recordsWithRunningTotals]);

  // ✅ Find last total pieces for selected khata
  const lastTotalPieces = useMemo(() => {
    if (!selectedKhata) {
      if (recordsWithRunningTotals.length === 0) return 0;
      return recordsWithRunningTotals[recordsWithRunningTotals.length - 1]?.runningTotalPieces || 0;
    }

    const khataRecords = recordsWithRunningTotals.filter((r) => r.khata_name === selectedKhata);
    if (khataRecords.length === 0) return 0;
    return khataRecords[khataRecords.length - 1]?.runningTotalPieces || 0;
  }, [selectedKhata, recordsWithRunningTotals]);

  // ✅ Scroll to Top Function
  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // ✅ Scroll to Bottom Function
  const scrollToBottom = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: tableContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // ✅ Handle scroll event to show/hide scroll buttons
  const handleScroll = () => {
    if (tableContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;

      // Show scroll to top button when scrolled down 100px
      setShowScrollTop(scrollTop > 100);

      // Show scroll to bottom button when not at the bottom
      setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 100);
    }
  };

  // ✅ Add scroll event listener
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();

      return () => {
        tableContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [recordsWithRunningTotals.length]); // Re-run when records change

  // ✅ Delete record
  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
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
      }
    } catch {
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

  // ✅ PDF Download (updated with Daily Report File name and proper formatting)
  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      // Set PDF title based on selection
      const pdfTitle = selectedKhata ? `Ledger File (${selectedKhata})` : 'Daily Report File (All Khatas)';

      doc.setFontSize(18);
      doc.text(pdfTitle, 40, 40);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 65);

      // Define table columns conditionally
      const tableColumn = [
        'Sr.#',
        ...(selectedKhata ? [] : ['Khata Name']), // Show khata name only when "All Khatas" is selected
        'Name',
        'Single Piece Price',
        'Total Pieces',
        'Sum Of Total Pieces',
        'Given Dues',
        'Taken Dues',
        'Remains Total Price',
        'Date'
      ];

      // Prepare table rows
      const tableRows = recordsWithRunningTotals.map((record, index) => {
        const baseRow = [
          index + 1,
          record.name || '-',
          record.single_piece_price || '0',
          record.total_piece || '0',
          record.runningTotalPieces || '0',
          record.given_dues || '0',
          record.taken_dues || '0',
          record.runningTotal || '0',
          formatDate(record.date),
        ];

        // Add khata name at the beginning if "All Khatas" is selected
        return selectedKhata ? baseRow : [index + 1, record.khata_name || '-', ...baseRow.slice(1)];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 100,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 }, // Smaller font for better fit
        headStyles: { fillColor: [244, 67, 54], textColor: 255, fontStyle: 'bold', halign: 'center' },
        margin: { left: 20, right: 20 }, // Add margins for better spacing
      });

      doc.save(`Ledger_File_${selectedKhata || 'All_Khatas'}_${new Date().toISOString().split('T')[0]}.pdf`);
      Swal.fire({
        title: 'Success!',
        text: `PDF downloaded for ${selectedKhata || 'All Khatas'}!`,
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });
    } catch {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate PDF.',
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
    verticalAlign: 'middle',
  };

  const TableCellStyle = {
    textAlign: 'center',
    verticalAlign: 'middle',
  };

  // ✅ Scroll button styles
  const scrollButtonStyle = {
    position: 'fixed',
    right: '20px',
    zIndex: 1000,
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease',
  };

  const scrollTopButtonStyle = {
    ...scrollButtonStyle,
    bottom: '90px',
    backgroundColor: '#f44336',
    color: 'white',
  };

  const scrollBottomButtonStyle = {
    ...scrollButtonStyle,
    bottom: '30px',
    backgroundColor: '#4CAF50',
    color: 'white',
  };

  return (
    <>
      <h1 className="d-flex justify-content-center my-4 gradient_text">
        Add Dues In Record
      </h1>

      {/* 🧾 Add Dues Form */}
      <DuesCard
        lastPrice={lastPrice}
        refetchData={refetch}
        selectedKhata={selectedKhata}
      />

      {/* 💼 Khata Buttons */}
      <div className="d-flex flex-wrap justify-content-center gap-2 my-3">
        <button
          className={`btn ${selectedKhata === '' ? 'btn-success' : 'btn-outline-success'}`}
          onClick={() => setSelectedKhata('')}
        >
          All Khatas
        </button>
        {khataNames.map((khata) => (
          <button
            key={khata}
            className={`btn ${selectedKhata === khata ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setSelectedKhata(khata)}
          >
            {khata}
          </button>
        ))}
      </div>

      <h1 className="d-flex justify-content-center my-4 gradient_text">
        {selectedKhata ? `(${selectedKhata})` : 'All Khatas'} Dues Record
      </h1>

      {/* 🔍 Filters */}
      <div className="search-container mb-3 d-flex gap-3 flex-wrap align-items-end">
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Search by Name:</label>
          <input type="text" className="form-control" placeholder="Enter name..." value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Search by Date:</label>
          <input type="date" className="form-control" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Search by Month (YYYY/MM):</label>
          <input type="text" className="form-control" placeholder="e.g. 2025/05" value={searchMonth} onChange={(e) => setSearchMonth(e.target.value)} />
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Search by Year (YYYY):</label>
          <input type="text" className="form-control" placeholder="e.g. 2024" value={searchYear} onChange={(e) => setSearchYear(e.target.value)} />
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Remains Total Price</label>
          <div className="form-control text-center fw-bold bg-light">{lastPrice}</div>
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Total Pieces</label>
          <div className="form-control text-center fw-bold bg-light">{lastTotalPieces}</div>
        </div>
        <div className="form-group mt-2">
          <button
            className="btn delete_btn mt-4 px-4"
            onClick={handleDownloadPDF}
            disabled={recordsWithRunningTotals.length === 0}
          >
            📄 Download PDF ({recordsWithRunningTotals.length})
          </button>
        </div>
      </div>

      {/* 📋 Table Container with Scroll */}
      <div
        className="table-container p-3 mb-5"
        ref={tableContainerRef}
        style={{
          maxHeight: '600px',
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '0.375rem',
          position: 'relative'
        }}
      >
        {isLoading && <p className="text-center py-4">Loading...</p>}
        {isError && <p className="text-center text-danger">Error loading data.</p>}
        {!isLoading && !isError && (
          <table className="table table-bordered table-hover form_div" ref={tableRef}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={TableHeadingStyle}>#</th>
                {/* Conditionally show Khata Name column only when "All Khatas" is selected */}
                {!selectedKhata && <th style={TableHeadingStyle}>Khata Name</th>}
                <th style={TableHeadingStyle}>Name</th>
                <th style={TableHeadingStyle}>Single Piece Price</th>
                <th style={TableHeadingStyle}>Total Pieces</th>
                <th style={TableHeadingStyle}>Sum Of Total Pieces</th>
                <th style={TableHeadingStyle}>Given Dues</th>
                <th style={TableHeadingStyle}>Taken Dues</th>
                <th style={TableHeadingStyle}>Remains Total Price</th>
                <th style={TableHeadingStyle}>Date</th>
                <th style={TableHeadingStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recordsWithRunningTotals.length > 0 ? (
                recordsWithRunningTotals.map((record, index) => (
                  <tr key={record.id || index}>
                    <td style={TableCellStyle}>{index + 1}</td>
                    {/* Conditionally show Khata Name cell only when "All Khatas" is selected */}
                    {!selectedKhata && <td style={TableCellStyle}>{record.khata_name}</td>}
                    <td style={TableCellStyle}>{record.name}</td>
                    <td style={TableCellStyle}>{record.single_piece_price}</td>
                    <td style={TableCellStyle}>{record.total_piece}</td>
                    <td style={TableCellStyle} className="fw-bold">
                      {record.runningTotalPieces}
                    </td>
                    <td style={TableCellStyle}>{record.given_dues}</td>
                    <td style={TableCellStyle}>{record.taken_dues}</td>
                    <td style={TableCellStyle} className="fw-bold">
                      {record.runningTotal}
                    </td>
                    <td style={TableCellStyle}>{formatDate(record.date)}</td>
                    <td style={TableCellStyle} className='d-flex justify-content-center align-items-center'>
                      <Link to={`/updatedues/${record.id}`} className="update_btn me-3">
                        Update
                      </Link>
                      <button
                        className="delete_btn"
                        onClick={() => handleDelete(record.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={selectedKhata ? "10" : "11"}
                    className="text-center py-4"
                  >
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 🔼 Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={scrollTopButtonStyle}
          title="Scroll to Top"
          className="scroll-button"
        >
          ↑
        </button>
      )}

      {/* 🔽 Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          style={scrollBottomButtonStyle}
          title="Scroll to Bottom"
          className="scroll-button"
        >
          ↓
        </button>
      )}
    </>
  );
};

export default DuesRecord;