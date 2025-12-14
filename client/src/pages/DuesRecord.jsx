import React, { useState, useMemo, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import DuesCard from '../components/Cards/DuesCard';
import { useGetAllDuesQuery, useDeleteGivenDuesMutation } from '../redux/features/DuesApi/giveDuesApi';
import { Link } from 'react-router-dom';

const DuesRecord = () => {
  const { data = [], isLoading, isError, refetch } = useGetAllDuesQuery();
  const [deleteGivenDues] = useDeleteGivenDuesMutation();

  // ✅ Bank names and abbreviations list
  const bankNamesAndAbbreviations = [
    'State Bank of Pakistan', 'SBP',
    'National Bank of Pakistan', 'NBP',
    'First Women Bank Limited', 'FWBL',
    'Sindh Bank Limited', 'SBL',
    'Bank of Punjab', 'BOP',
    'Bank of Khyber', 'BOK',
    'Habib Bank Limited', 'HBL',
    'United Bank Limited', 'UBL',
    'Muslim Commercial Bank', 'MCB',
    'Allied Bank Limited', 'ABL',
    'Standard Chartered Bank', 'SCB',
    'Bank Alfalah Limited', 'BAFL', 'Alfalah',
    'Askari Bank Limited', 'AKBL',
    'Faysal Bank Limited', 'FBL',
    'JS Bank Limited', 'JSBL',
    'Summit Bank Limited', 'SBL',
    'Soneri Bank Limited', 'SNBL',
    'Silkbank Limited', 'SILK',
    'SAMBA Bank Limited', 'SAMBA',
    'Habib Metropolitan Bank', 'HMB',
    'Dubai Islamic Bank Pakistan', 'DIBPL',
    'Meezan Bank Limited', 'MBL',
    'Meezan Bank', 'MBL',
    'Bank Islami Pakistan', 'BIPL',
    'Al Baraka Bank Pakistan', 'ABPL',
    'Dubai Islamic Bank', 'DIB',
    'MIB', 'MCB Islamic Bank', 'MIB',
    'Khushhali Microfinance Bank', 'KMBL',
    'Telenor Microfinance Bank', 'TMB',
    'U Microfinance Bank', 'U Bank',
    'NRSP Microfinance Bank', 'NRSP',
    'Easy Paisa', 'Easypaisa', 'Jazzcash'
  ];

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

  // ✅ Check if name contains bank name or abbreviation
  const isBankName = (name) => {
    if (!name) return false;
    const lowerName = name.toLowerCase();
    return bankNamesAndAbbreviations.some(bank =>
      lowerName.includes(bank.toLowerCase())
    );
  };

  // ✅ Check if name contains Return or gai
  const isReturnRecord = (name) => {
    if (!name) return false;
    const lowerName = name.toLowerCase();
    return lowerName.includes('return') || lowerName.includes('gai');
  };

  // ✅ Format Name with Medicine/Feed/Other/Payment prefixes (For Table Display)
  const formatNameWithPieces = (record) => {
    let name = record.name || '';
    const medicinePieces = Number(record.m_pieces) || 0;
    const feedPieces = Number(record.total_piece) || 0;
    const otherPieces = Number(record.o_pieces) || 0;

    // Check if medicine pieces exist and are non-zero
    const hasMedicine = medicinePieces > 0;
    // Check if feed pieces exist and are non-zero
    const hasFeed = feedPieces > 0;
    // Check if other pieces exist and are non-zero
    const hasOther = otherPieces > 0;
    // Check if name contains bank name or abbreviation
    const hasBankName = isBankName(name);
    // Check if it's a return record
    const isReturn = isReturnRecord(name);

    // Build the prefix string for pieces
    let piecePrefix = '';

    // Create an array of piece types that are present
    const pieceTypes = [];
    if (hasMedicine) pieceTypes.push('Medicine');
    if (hasFeed) pieceTypes.push('Feed');
    if (hasOther) pieceTypes.push('Other');

    // Build the piece prefix based on which types are present
    if (pieceTypes.length === 1) {
      piecePrefix = pieceTypes[0] + ' ';
    } else if (pieceTypes.length === 2) {
      piecePrefix = pieceTypes.join(' & ') + ' ';
    } else if (pieceTypes.length === 3) {
      piecePrefix = 'Medicine & Feed & Other ';
    }

    // Start with the piece prefix
    let prefix = piecePrefix;

    // Then, add Payment prefix if it's a bank name and Payment is not already in the name
    if (hasBankName && !name.toLowerCase().includes('payment')) {
      // Check if we already have a piece prefix
      if (prefix) {
        // If piece prefix exists, add Payment at the beginning
        prefix = 'Payment ' + prefix;
      } else {
        // If no piece prefix, just add Payment
        prefix = 'Payment ';
      }
    }

    // Add Return prefix if it's a return record and Return is not already in the name
    if (isReturn && !name.toLowerCase().startsWith('return')) {
      if (prefix) {
        // If we have other prefixes, add Return at the beginning
        prefix = 'Return ' + prefix;
      } else {
        prefix = 'Return ';
      }
    }

    // Only add prefix if it doesn't already exist in the name
    if (prefix && !name.toLowerCase().startsWith(prefix.toLowerCase().trim())) {
      return prefix + name;
    }

    return name;
  };

  // ✅ Format Name without "Other" prefix for PDF
  const formatNameForPDF = (record) => {
    let name = record.name || '';
    const medicinePieces = Number(record.m_pieces) || 0;
    const feedPieces = Number(record.total_piece) || 0;

    // Check if medicine pieces exist and are non-zero
    const hasMedicine = medicinePieces > 0;
    // Check if feed pieces exist and are non-zero
    const hasFeed = feedPieces > 0;
    // Check if name contains bank name or abbreviation
    const hasBankName = isBankName(name);
    // Check if it's a return record
    const isReturn = isReturnRecord(name);

    // Build the prefix string for pieces (without "Other")
    let piecePrefix = '';

    // Create an array of piece types that are present (excluding "Other")
    const pieceTypes = [];
    if (hasMedicine) pieceTypes.push('Medicine');
    if (hasFeed) pieceTypes.push('Feed');

    // Build the piece prefix based on which types are present
    if (pieceTypes.length === 1) {
      piecePrefix = pieceTypes[0] + ' ';
    } else if (pieceTypes.length === 2) {
      piecePrefix = pieceTypes.join(' & ') + ' ';
    }

    // Start with the piece prefix
    let prefix = piecePrefix;

    // Then, add Payment prefix if it's a bank name and Payment is not already in the name
    if (hasBankName && !name.toLowerCase().includes('payment')) {
      // Check if we already have a piece prefix
      if (prefix) {
        // If piece prefix exists, add Payment at the beginning
        prefix = 'Payment ' + prefix;
      } else {
        // If no piece prefix, just add Payment
        prefix = 'Payment ';
      }
    }

    // Add Return prefix if it's a return record and Return is not already in the name
    if (isReturn && !name.toLowerCase().startsWith('return')) {
      if (prefix) {
        // If we have other prefixes, add Return at the beginning
        prefix = 'Return ' + prefix;
      } else {
        prefix = 'Return ';
      }
    }

    // Only add prefix if it doesn't already exist in the name
    if (prefix && !name.toLowerCase().startsWith(prefix.toLowerCase().trim())) {
      return prefix + name;
    }

    return name;
  };

  // ✅ Filtering logic
  const filteredRecords = data.filter((record) => {
    const recordDate = formatDate(record.date);
    const matchesKhata = selectedKhata ? record.khata_name === selectedKhata : true;

    // Use formatted name for search
    const formattedName = formatNameWithPieces(record);
    const matchesName = searchName ?
      formattedName.toLowerCase().includes(searchName.toLowerCase()) : true;

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

  // ✅ Calculate running totals for dues, single piece price, and all three piece types
  const recordsWithRunningTotals = useMemo(() => {
    if (!sortedRecords.length) return [];

    let runningTotalDues = 0;
    let runningTotalSinglePiecePrice = 0;
    let runningTotalMedicinePieces = 0;
    let runningTotalFeedPieces = 0;
    let runningTotalOtherPieces = 0;

    return sortedRecords.map((record) => {
      const givenDues = Number(record.given_dues) || 0;
      const takenDues = Number(record.taken_dues) || 0;
      const singlePiecePrice = Number(record.single_piece_price) || 0;
      const medicinePieces = Number(record.m_pieces) || 0;
      const feedPieces = Number(record.total_piece) || 0;
      const otherPieces = Number(record.o_pieces) || 0;

      // ✅ CORRECTED CALCULATION: 
      // given_dues = money you gave (increases your receivable)
      // taken_dues = money you received (decreases your receivable)
      const netDuesForRecord = takenDues - givenDues;

      // Check if it's a return record
      const isReturn = isReturnRecord(record.name || '');

      // Add to running totals
      runningTotalDues += netDuesForRecord;
      runningTotalSinglePiecePrice += singlePiecePrice;

      // Handle pieces differently for return records
      if (isReturn) {
        // For return records, SUBTRACT pieces from running totals
        runningTotalMedicinePieces -= medicinePieces;
        runningTotalFeedPieces -= feedPieces;
        runningTotalOtherPieces -= otherPieces;
      } else {
        // For normal records, ADD pieces to running totals
        runningTotalMedicinePieces += medicinePieces;
        runningTotalFeedPieces += feedPieces;
        runningTotalOtherPieces += otherPieces;
      }

      return {
        ...record,
        runningTotal: runningTotalDues,
        runningTotalSinglePiecePrice: runningTotalSinglePiecePrice,
        runningTotalMedicinePieces: runningTotalMedicinePieces,
        runningTotalFeedPieces: runningTotalFeedPieces,
        runningTotalOtherPieces: runningTotalOtherPieces,
        netDuesForRecord: netDuesForRecord,
        // Add formatted name and return status to the record
        formattedName: formatNameWithPieces(record),
        isReturn: isReturn
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

  // ✅ Find last total pieces for selected khata (all types combined)
  const lastTotalPieces = useMemo(() => {
    if (!selectedKhata) {
      if (recordsWithRunningTotals.length === 0) return 0;
      const lastRecord = recordsWithRunningTotals[recordsWithRunningTotals.length - 1];
      return (lastRecord?.runningTotalMedicinePieces || 0) +
        (lastRecord?.runningTotalFeedPieces || 0) +
        (lastRecord?.runningTotalOtherPieces || 0);
    }

    const khataRecords = recordsWithRunningTotals.filter((r) => r.khata_name === selectedKhata);
    if (khataRecords.length === 0) return 0;
    const lastRecord = khataRecords[khataRecords.length - 1];
    return (lastRecord?.runningTotalMedicinePieces || 0) +
      (lastRecord?.runningTotalFeedPieces || 0) +
      (lastRecord?.runningTotalOtherPieces || 0);
  }, [selectedKhata, recordsWithRunningTotals]);

  // ✅ Find last single piece price total for selected khata
  const lastSinglePiecePriceTotal = useMemo(() => {
    if (!selectedKhata) {
      if (recordsWithRunningTotals.length === 0) return 0;
      return recordsWithRunningTotals[recordsWithRunningTotals.length - 1]?.runningTotalSinglePiecePrice || 0;
    }

    const khataRecords = recordsWithRunningTotals.filter((r) => r.khata_name === selectedKhata);
    if (khataRecords.length === 0) return 0;
    return khataRecords[khataRecords.length - 1]?.runningTotalSinglePiecePrice || 0;
  }, [selectedKhata, recordsWithRunningTotals]);

  // ✅ Color coding for positive/negative values
  const getPriceColorStyle = (value) => {
    if (value < 0) {
      return { color: '#dc3545', fontWeight: 'bold' }; // Red for negative
    } else if (value > 0) {
      return { color: '#198754', fontWeight: 'bold' }; // Green for positive
    } else {
      return { color: '#6c757d', fontWeight: 'bold' }; // Gray for zero
    }
  };

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

  // ✅ PDF Download with background colors and fixed font duplication issue
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
        ...(selectedKhata ? [] : ['Khata Name']),
        'Name',
        'Single Piece Price',
        'Total Price or Weight',
        'Medicine Pieces',
        'Total Medicines',
        'Feed Pieces',
        'Total Feeds',
        'Other Pieces',
        'Total Others',
        'Given Dues (-)',
        'Taken Dues (+)',
        'Remains Total Price',
        'Date'
      ];

      // Prepare table rows
      const tableRows = recordsWithRunningTotals.map((record, index) => {
        const baseRow = [
          index + 1,
          formatNameForPDF(record) || '-', // Use PDF-specific name formatting (without "Other")
          record.single_piece_price || '0',
          record.runningTotalSinglePiecePrice || '0',
          record.m_pieces || '0',
          record.runningTotalMedicinePieces || '0',
          record.total_piece || '0',
          record.runningTotalFeedPieces || '0',
          record.o_pieces || '0',
          record.runningTotalOtherPieces || '0',
          record.given_dues || '0',
          record.taken_dues || '0',
          record.runningTotal || '0',
          formatDate(record.date),
        ];

        // Add khata name at the beginning if "All Khatas" is selected
        return selectedKhata ? baseRow : [index + 1, record.khata_name || '-', ...baseRow.slice(1)];
      });

      // Define column styles with background colors
      const columnStyles = {};

      if (selectedKhata) {
        // When specific khata is selected
        columnStyles[0] = { textColor: [90, 14, 36], fillColor: [240, 240, 240] };
        columnStyles[1] = { textColor: [90, 14, 36], fillColor: [255, 255, 255] };
        columnStyles[2] = { textColor: [90, 14, 36], fillColor: [246, 246, 246] };
        columnStyles[3] = { textColor: [6, 7, 113], fillColor: [232, 249, 255] }; // Sum of Price or Weight
        columnStyles[4] = { textColor: [90, 14, 36], fillColor: [246, 246, 246] };
        columnStyles[5] = { textColor: [6, 7, 113], fillColor: [232, 249, 255] };
        columnStyles[6] = { textColor: [90, 14, 36], fillColor: [246, 246, 246] };
        columnStyles[7] = { textColor: [6, 7, 113], fillColor: [232, 249, 255] };
        columnStyles[8] = { textColor: [90, 14, 36], fillColor: [246, 246, 246] };
        columnStyles[9] = { textColor: [6, 7, 113], fillColor: [232, 249, 255] };
        columnStyles[10] = { textColor: [220, 53, 69], fillColor: [254, 227, 236] };
        columnStyles[11] = { textColor: [25, 135, 84], fillColor: [202, 247, 227] };
        // Remains Total Price will be handled dynamically
        columnStyles[13] = { textColor: [90, 14, 36], fillColor: [255, 255, 255] };
      } else {
        // When showing all khatas
        columnStyles[0] = { textColor: [90, 14, 36], fillColor: [240, 240, 240] };
        columnStyles[1] = { textColor: [220, 14, 14], fillColor: [255, 255, 255] };
        columnStyles[2] = { textColor: [90, 14, 36], fillColor: [255, 255, 255] };
        columnStyles[3] = { textColor: [90, 14, 36], fillColor: [246, 246, 246] };
        columnStyles[4] = { textColor: [6, 7, 113], fillColor: [232, 249, 255] }; // Sum of Price or Weight
        columnStyles[5] = { textColor: [90, 14, 36], fillColor: [246, 246, 246] };
        columnStyles[6] = { textColor: [6, 7, 113], fillColor: [232, 249, 255] };
        columnStyles[7] = { textColor: [90, 14, 36], fillColor: [246, 246, 246] };
        columnStyles[8] = { textColor: [6, 7, 113], fillColor: [232, 249, 255] };
        columnStyles[9] = { textColor: [90, 14, 36], fillColor: [246, 246, 246] };
        columnStyles[10] = { textColor: [6, 7, 113], fillColor: [232, 249, 255] };
        columnStyles[11] = { textColor: [220, 53, 69], fillColor: [254, 227, 236] };
        columnStyles[12] = { textColor: [25, 135, 84], fillColor: [202, 247, 227] };
        // Remains Total Price will be handled dynamically
        columnStyles[14] = { textColor: [90, 14, 36], fillColor: [255, 255, 255] };
      }

      // Define cell styles for PDF
      const styles = {
        fontSize: 8,
        cellPadding: 3,
        halign: 'center',
      };

      // FIXED: Use didParseCell instead of didDrawCell to avoid font duplication
      const didParseCell = (data) => {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const columnIndex = data.column.index;

          // Get the original record for this row
          const record = recordsWithRunningTotals[rowIndex];

          if (!record) return;

          // Only handle Remains Total Price column dynamically
          const remainsTotalPriceColumn = selectedKhata ? 12 : 13;

          if (columnIndex === remainsTotalPriceColumn) {
            // Set dynamic color based on value
            if (record.runningTotal < 0) {
              data.cell.styles.textColor = [220, 53, 69]; // Red for negative
            } else if (record.runningTotal > 0) {
              data.cell.styles.textColor = [25, 135, 84]; // Green for positive
            } else {
              data.cell.styles.textColor = [108, 117, 125]; // Gray for zero
            }
            data.cell.styles.fontStyle = 'bold';
          }
        }
      };

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 100,
        theme: 'grid',
        styles: styles,
        columnStyles: columnStyles,
        headStyles: {
          fillColor: [244, 67, 54],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8
        },
        margin: { left: 20, right: 20 },
        didParseCell: didParseCell,
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
  const IndexStyle = {
    backgroundColor: '#F0F0F0'
  }
  const KhataStyle = {
    color: '#DC0E0E',
  }
  const CommonStyle = {
    color: '#5A0E24',
    backgroundColor: '#F6F6F6'
  }
  const SumOfTotalStyle = {
    color: '#060771',
    backgroundColor: '#E8F9FF'
  }
  const GivenDuesStyle = {
    color: 'rgb(220, 53, 69)',
    backgroundColor: '#FEE3EC'
  }
  const TakenDuesStyle = {
    color: 'rgb(25, 135, 84)',
    backgroundColor: '#CAF7E3'
  }
  const ReturnStyle = {
    color: '#ff6b35',
    backgroundColor: '#fff3e0',
    fontWeight: 'bold'
  }

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
          <label className="form-label fw-bold">Total All Pieces</label>
          <div className="form-control text-center fw-bold bg-light" style={{ color: 'rgb(6, 7, 113)' }}>{lastTotalPieces}</div>
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Total Price or Weight</label>
          <div className="form-control text-center fw-bold bg-light" style={{ color: 'rgb(6, 7, 113)' }}>{lastSinglePiecePriceTotal}</div>
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Remains Total Price</label>
          <div
            className="form-control text-center fw-bold bg-light"
            style={getPriceColorStyle(lastPrice)}
          >
            {lastPrice}
          </div>
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
                <th style={TableHeadingStyle}>Price or Weight</th>
                <th style={TableHeadingStyle}>Total Price or Weight</th>

                {/* Medicine Pieces Section */}
                <th style={TableHeadingStyle}>Medicine Pieces</th>
                <th style={TableHeadingStyle}>Total Medicines</th>

                {/* Feed Pieces Section */}
                <th style={TableHeadingStyle}>Feed Pieces</th>
                <th style={TableHeadingStyle}>Total Feeds</th>

                {/* Other Pieces Section */}
                <th style={TableHeadingStyle}>Other Pieces</th>
                <th style={TableHeadingStyle}>Total Others</th>

                <th style={TableHeadingStyle}>Given Dues (-)</th>
                <th style={TableHeadingStyle}>Taken Dues (+)</th>
                <th style={TableHeadingStyle}>Remains Total Price</th>
                <th style={TableHeadingStyle}>Date</th>
                <th style={TableHeadingStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recordsWithRunningTotals.length > 0 ? (
                recordsWithRunningTotals.map((record, index) => (
                  <tr key={record.id || index}>
                    <td style={{ ...TableCellStyle, ...IndexStyle }}>{index + 1}</td>

                    {/* Conditionally show Khata Name cell only when "All Khatas" is selected */}
                    {!selectedKhata && (
                      <td style={{ ...TableCellStyle, ...KhataStyle }}>
                        {record.khata_name}
                      </td>
                    )}

                    {/* Display formatted name with Medicine/Feed/Other/Payment prefixes */}
                    <td style={{ ...TableCellStyle, ...(record.isReturn ? ReturnStyle : {}) }}>
                      {record.formattedName}
                    </td>

                    {/* Single Piece Price */}
                    <td style={{ ...TableCellStyle, ...CommonStyle }}>
                      {record.single_piece_price}
                    </td>

                    {/* Sum of Price or Weight (Running Total of Single Piece Price) */}
                    <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                      {record.runningTotalSinglePiecePrice}
                    </td>

                    {/* Medicine Pieces */}
                    <td style={{ ...TableCellStyle, ...CommonStyle }}>
                      {record.m_pieces}
                    </td>
                    <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                      {record.runningTotalMedicinePieces}
                    </td>

                    {/* Feed Pieces */}
                    <td style={{ ...TableCellStyle, ...CommonStyle }}>
                      {record.total_piece}
                    </td>
                    <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                      {record.runningTotalFeedPieces}
                    </td>

                    {/* Other Pieces */}
                    <td style={{ ...TableCellStyle, ...CommonStyle }}>
                      {record.o_pieces}
                    </td>
                    <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                      {record.runningTotalOtherPieces}
                    </td>

                    <td style={{ ...TableCellStyle, ...GivenDuesStyle }}>
                      {record.given_dues}
                    </td>
                    <td style={{ ...TableCellStyle, ...TakenDuesStyle }}>
                      {record.taken_dues}
                    </td>
                    <td
                      style={{
                        ...TableCellStyle,
                        ...getPriceColorStyle(record.runningTotal)
                      }}
                      className="fw-bold"
                    >
                      {record.runningTotal}
                    </td>
                    <td style={TableCellStyle}>
                      {formatDate(record.date)}
                    </td>
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
                    colSpan={selectedKhata ? "15" : "16"}
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