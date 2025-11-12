import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import DuesCard from '../components/Cards/DuesCard';
import { useGetAllDuesQuery, useDeleteGivenDuesMutation } from '../redux/features/DuesApi/giveDuesApi';
import { Link } from 'react-router-dom';

const DuesRecord = () => {
  const { data = [], isLoading, isError, refetch } = useGetAllDuesQuery();
  const [deleteGivenDues] = useDeleteGivenDuesMutation();

  // ✅ Filters
  const [searchDate, setSearchDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchMonth, setSearchMonth] = useState('');
  const [searchYear, setSearchYear] = useState('');

  // ✅ Khata Management
  const [selectedKhata, setSelectedKhata] = useState(''); // active khata_name

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

  // ✅ Find last record price for selected khata
  const lastPrice = useMemo(() => {
    if (!selectedKhata) return 0; // if no khata selected, start from 0
    const khataRecords = data.filter((r) => r.khata_name === selectedKhata);
    if (khataRecords.length === 0) return 0;
    return Number(khataRecords[khataRecords.length - 1].price) || 0;
  }, [selectedKhata, data]);

  // ✅ Get the last record ID for the selected khata to enable delete button only for last entry
  const lastRecordId = useMemo(() => {
    if (!selectedKhata) {
      // If no khata selected, find the last record from all data
      if (data.length === 0) return null;
      return data[data.length - 1]?.id || null;
    }

    const khataRecords = data.filter((r) => r.khata_name === selectedKhata);
    if (khataRecords.length === 0) return null;

    return khataRecords[khataRecords.length - 1]?.id || null;
  }, [selectedKhata, data]);

  // ✅ Delete record
  const handleDelete = async (id) => {
    // Prevent deletion if not the last record
    if (id !== lastRecordId) {
      Swal.fire({
        title: 'Not Allowed!',
        text: 'You can only delete the last entry. Previous entries are locked.',
        icon: 'warning',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_warning' },
      });
      return;
    }

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

  // ✅ PDF Download (unchanged)
  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      doc.setFontSize(18);
      doc.text(`Dues Record Report ${selectedKhata ? `(${selectedKhata})` : ''}`, 40, 40);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 65);

      const tableColumn = [
        'Sr.#', 'Name', 'Single Piece Price', 'Total Piece',
        'Given Dues', 'Taken Dues', 'Remains Total Price', 'Date'
      ];

      const tableRows = filteredRecords.map((record, index) => [
        index + 1,
        record.name || '-',
        record.single_piece_price || '0',
        record.total_piece || '0',
        record.given_dues || '0',
        record.taken_dues || '0',
        record.price || '0',
        formatDate(record.date),
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 100,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [244, 67, 54], textColor: 255, fontStyle: 'bold', halign: 'center' },
      });

      doc.save(`Given_Dues_${selectedKhata || 'All'}_${new Date().toISOString().split('T')[0]}.pdf`);
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

  // ✅ Style for disabled delete button
  const disabledDeleteButtonStyle = {
    opacity: 0.5,
    cursor: 'not-allowed',
    borderColor: '#6c757d',
    color: '#000000'
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
        {selectedKhata ? `(${selectedKhata})` : ''} Dues Record
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
          <button
            className="btn delete_btn mt-4 px-4"
            onClick={handleDownloadPDF}
            disabled={filteredRecords.length === 0}
          >
            📄 Download PDF ({filteredRecords.length})
          </button>
        </div>
      </div>

      {/* 📋 Table */}
      <div className="table-container p-3 mb-5">
        {isLoading && <p className="text-center py-4">Loading...</p>}
        {isError && <p className="text-center text-danger">Error loading data.</p>}
        {!isLoading && !isError && (
          <table className="table table-bordered table-hover form_div">
            <thead>
              <tr>
                <th style={TableHeadingStyle}>#</th>
                {/* <th style={TableHeadingStyle}>Khata Name</th> */}
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
                filteredRecords.map((record, index) => {
                  const isLastEntry = record.id === lastRecordId;
                  return (
                    <tr key={record.id || index}>
                      <td style={TableCellStyle}>{index + 1}</td>
                      {/* <td style={TableCellStyle}>{record.khata_name}</td> */}
                      <td style={TableCellStyle}>{record.name}</td>
                      <td style={TableCellStyle}>{record.single_piece_price}</td>
                      <td style={TableCellStyle}>{record.total_piece}</td>
                      <td style={TableCellStyle}>{record.given_dues}</td>
                      <td style={TableCellStyle}>{record.taken_dues}</td>
                      <td style={TableCellStyle}>{record.price}</td>
                      <td style={TableCellStyle}>{formatDate(record.date)}</td>
                      <td style={TableCellStyle}>
                        <Link to={`/updatedues/${record.id}`} className="update_btn me-3">
                          Update
                        </Link>
                        <button
                          className="delete_btn"
                          onClick={() => handleDelete(record.id)}
                          style={isLastEntry ? {} : disabledDeleteButtonStyle}
                          disabled={!isLastEntry}
                        >
                          {isLastEntry ? '🗑️ Delete' : '🔒 Locked'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="10" className="text-center py-4">No records found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

    </>
  );
};

export default DuesRecord;