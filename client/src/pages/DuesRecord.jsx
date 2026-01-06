import React, { useState, useMemo, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import DuesCard from '../components/Cards/DuesCard';
import { useGetAllDuesQuery, useDeleteGivenDuesMutation } from '../redux/features/DuesApi/giveDuesApi';
import { Link } from 'react-router-dom';
import { useSpeechSynthesis } from 'react-speech-kit';

const DuesRecord = () => {
  const { data = [], isLoading, isError, refetch } = useGetAllDuesQuery();
  const [deleteGivenDues] = useDeleteGivenDuesMutation();

  // ✅ Use react-speech-kit hook
  const { speak, speaking, cancel, voices, supported } = useSpeechSynthesis({
    onEnd: () => setSpeakingRecordId(null),
    onError: (event) => {
      console.error('Speech synthesis error:', event);
      setSpeakingRecordId(null);
      Swal.fire({
        title: 'Speech Error',
        text: 'Failed to speak the record. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  });

  // ✅ Bank names and abbreviations list
  const bankNamesAndAbbreviations = [
    'State Bank of Pakistan', 'SBP',
    'National Bank of Pakistan', 'NBP',
    'First Women Bank Limited', 'FWBL',
    'Sindh Bank Limited', 'SBL',
    'Bank of Punjab', 'BOP',
    'Bank of Khyber', 'BOK',
    'Habib Bank Limited', 'HBL',
    'United Bank Limited', 'Ubl',
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
  const khataSearchRef = useRef(null);

  // ✅ Filters
  const [searchDate, setSearchDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchMonth, setSearchMonth] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [khataSearch, setKhataSearch] = useState('');

  // ✅ Khata Management
  const [selectedKhata, setSelectedKhata] = useState('');
  const [showKhataDropdown, setShowKhataDropdown] = useState(false);

  // ✅ Scroll to top/bottom states
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // ✅ Voice synthesis states
  const [speakingRecordId, setSpeakingRecordId] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);

  // ✅ Delete All states
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [totalToDelete, setTotalToDelete] = useState(0);

  // ✅ Zero value check states
  const [hasCheckedInitialZeroValues, setHasCheckedInitialZeroValues] = useState(false);
  const [showZeroValueCheckButton, setShowZeroValueCheckButton] = useState(true);

  // ✅ Get unique khata names
  const khataNames = useMemo(() => {
    return [...new Set(data.map((item) => item.khata_name).filter(Boolean))].sort();
  }, [data]);

  // ✅ Filtered khata names based on search
  const filteredKhataNames = useMemo(() => {
    if (!khataSearch.trim()) return khataNames;
    return khataNames.filter(khata =>
      khata.toLowerCase().includes(khataSearch.toLowerCase())
    );
  }, [khataNames, khataSearch]);

  // ✅ Handle khata selection
  const handleKhataSelect = (khata) => {
    setSelectedKhata(khata);
    setKhataSearch('');
    setShowKhataDropdown(false);
  };

  // ✅ Clear khata selection
  const handleClearKhata = () => {
    setSelectedKhata('');
    setKhataSearch('');
    setShowKhataDropdown(false);
  };

  // ✅ Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (khataSearchRef.current && !khataSearchRef.current.contains(event.target)) {
        setShowKhataDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  // ✅ Format date for speech (more natural reading)
  const formatDateForSpeech = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    // Add ordinal suffix to day
    const getOrdinalSuffix = (n) => {
      if (n > 3 && n < 21) return 'th';
      switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
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

    const hasMedicine = medicinePieces > 0;
    const hasFeed = feedPieces > 0;
    const hasOther = otherPieces > 0;
    const hasBankName = isBankName(name);
    const isReturn = isReturnRecord(name);

    let piecePrefix = '';
    const pieceTypes = [];
    if (hasMedicine) pieceTypes.push('Medicine');
    if (hasFeed) pieceTypes.push('Feed');
    if (hasOther) pieceTypes.push('Other');

    if (pieceTypes.length === 1) {
      piecePrefix = pieceTypes[0] + ' ';
    } else if (pieceTypes.length === 2) {
      piecePrefix = pieceTypes.join(' & ') + ' ';
    } else if (pieceTypes.length === 3) {
      piecePrefix = 'Medicine & Feed & Other ';
    }

    let prefix = piecePrefix;

    if (hasBankName && !name.toLowerCase().includes('payment')) {
      if (prefix) {
        prefix = 'Payment ' + prefix;
      } else {
        prefix = 'Payment ';
      }
    }

    if (isReturn && !name.toLowerCase().startsWith('return')) {
      if (prefix) {
        prefix = 'Return ' + prefix;
      } else {
        prefix = 'Return ';
      }
    }

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

    const hasMedicine = medicinePieces > 0;
    const hasFeed = feedPieces > 0;
    const hasBankName = isBankName(name);
    const isReturn = isReturnRecord(name);

    let piecePrefix = '';
    const pieceTypes = [];
    if (hasMedicine) pieceTypes.push('Medicine');
    if (hasFeed) pieceTypes.push('Feed');

    if (pieceTypes.length === 1) {
      piecePrefix = pieceTypes[0] + ' ';
    } else if (pieceTypes.length === 2) {
      piecePrefix = pieceTypes.join(' & ') + ' ';
    }

    let prefix = piecePrefix;

    if (hasBankName && !name.toLowerCase().includes('payment')) {
      if (prefix) {
        prefix = 'Payment ' + prefix;
      } else {
        prefix = 'Payment ';
      }
    }

    if (isReturn && !name.toLowerCase().startsWith('return')) {
      if (prefix) {
        prefix = 'Return ' + prefix;
      } else {
        prefix = 'Return ';
      }
    }

    if (prefix && !name.toLowerCase().startsWith(prefix.toLowerCase().trim())) {
      return prefix + name;
    }

    return name;
  };

  // ✅ Filtering logic
  const filteredRecords = data.filter((record) => {
    const recordDate = formatDate(record.date);
    const matchesKhata = selectedKhata ? record.khata_name === selectedKhata : true;

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

  // ✅ Sort records by date in ascending order
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });
  }, [filteredRecords]);

  // ✅ NEW: Format number with commas and optional 2 decimal places
  const formatNumberWithCommas = (num, showDecimals = false) => {
    if (num === undefined || num === null) return '0';

    const number = Math.abs(num);

    // Check if the number has decimal values
    const hasDecimals = number % 1 !== 0;

    if (showDecimals && hasDecimals) {
      // Format with exactly 2 decimal places
      const formatted = number.toFixed(2);
      // Add commas to integer part
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join('.');
    } else {
      // Format without decimals
      return Math.round(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  };

  // ✅ NEW: Special formatter for the 5 specific columns
  const formatWithOptionalDecimals = (num) => {
    return formatNumberWithCommas(num, true);
  };

  // ✅ Calculate running totals
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

      const netDuesForRecord = takenDues - givenDues;
      const isReturn = isReturnRecord(record.name || '');

      runningTotalDues += netDuesForRecord;
      runningTotalSinglePiecePrice += singlePiecePrice;

      if (isReturn) {
        runningTotalMedicinePieces -= medicinePieces;
        runningTotalFeedPieces -= feedPieces;
        runningTotalOtherPieces -= otherPieces;
      } else {
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
      return { color: '#dc3545', fontWeight: 'bold' };
    } else if (value > 0) {
      return { color: '#198754', fontWeight: 'bold' };
    } else {
      return { color: '#6c757d', fontWeight: 'bold' };
    }
  };

  // ✅ Convert number to words
  const numberToWords = (num) => {
    const number = Math.abs(num);
    if (number === 0) return 'zero';

    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const thousands = ['', 'thousand', 'lakh', 'crore', 'arab', 'kharab'];

    let words = '';
    let tempNumber = number;
    let groupIndex = 0;

    while (tempNumber > 0) {
      let group;

      if (groupIndex === 0) {
        group = tempNumber % 1000;
        tempNumber = Math.floor(tempNumber / 1000);
      } else {
        group = tempNumber % 100;
        tempNumber = Math.floor(tempNumber / 100);
      }

      if (group > 0) {
        let groupWords = '';

        if (group >= 100) {
          groupWords += ones[Math.floor(group / 100)] + ' hundred ';
          group %= 100;
        }

        if (group >= 20) {
          groupWords += tens[Math.floor(group / 10)] + ' ';
          group %= 10;
          if (group > 0) {
            groupWords += ones[group] + ' ';
          }
        } else if (group >= 10) {
          groupWords += teens[group - 10] + ' ';
        } else if (group > 0) {
          groupWords += ones[group] + ' ';
        }

        if (thousands[groupIndex]) {
          groupWords += thousands[groupIndex] + ' ';
        }

        words = groupWords + words;
      }

      groupIndex++;
    }

    if (num < 0) {
      words = 'negative ' + words;
    }

    words = words.trim();
    words = words.charAt(0).toUpperCase() + words.slice(1);
    words += ' only';

    return words;
  };

  // ✅ Generate speech text for a single record
  const generateSpeechTextForSingle = (record) => {
    const name = record.formattedName || 'No Name';
    const date = formatDateForSpeech(record.date) || 'No Date';

    const singlePiecePrice = Number(record.single_piece_price) || 0;
    const totalSinglePiecePrice = record.runningTotalSinglePiecePrice || 0;
    const medicinePieces = Number(record.m_pieces) || 0;
    const totalMedicinePieces = record.runningTotalMedicinePieces || 0;
    const feedPieces = Number(record.total_piece) || 0;
    const totalFeedPieces = record.runningTotalFeedPieces || 0;
    const otherPieces = Number(record.o_pieces) || 0;
    const totalOtherPieces = record.runningTotalOtherPieces || 0;
    const givenDues = Number(record.given_dues) || 0;
    const takenDues = Number(record.taken_dues) || 0;
    const remainsTotal = record.runningTotal || 0;

    const givenDuesWords = givenDues !== 0 ? numberToWords(givenDues) : 'zero';
    const takenDuesWords = takenDues !== 0 ? numberToWords(takenDues) : 'zero';
    const remainsTotalWords = remainsTotal !== 0 ? numberToWords(remainsTotal) : 'zero';

    let speechText = '';

    if (remainsTotal > 0) {
      speechText += `Balance: ${formatNumberWithCommas(remainsTotal)} rupees, that is ${remainsTotalWords}. `;
    } else if (remainsTotal < 0) {
      speechText += `Balance: negative ${formatNumberWithCommas(remainsTotal)} rupees, that is ${remainsTotalWords}. `;
    } else {
      speechText += `Balance: zero rupees. `;
    }

    speechText += `Record details: Date: ${date}.`;

    speechText += `Name: ${name}. `;

    if (singlePiecePrice > 0) {
      speechText += `Rate or Weight: ${formatNumberWithCommas(singlePiecePrice)}. `;
    }
    speechText += `Total Rate or Weight: ${formatWithOptionalDecimals(totalSinglePiecePrice)}. `;

    if (medicinePieces > 0) {
      speechText += `Medicine Qty: ${medicinePieces}. `;
    }
    speechText += `Total Medicines: ${formatWithOptionalDecimals(totalMedicinePieces)}. `;

    if (feedPieces > 0) {
      speechText += `Feed Qty: ${feedPieces}. `;
    }
    speechText += `Total Feeds: ${formatWithOptionalDecimals(totalFeedPieces)}. `;

    if (otherPieces > 0) {
      speechText += `Other Qty: ${otherPieces}. `;
    }
    speechText += `Total Others: ${formatWithOptionalDecimals(totalOtherPieces)}. `;

    if (givenDues > 0) {
      speechText += `Debit: ${formatNumberWithCommas(givenDues)} rupees, that is ${givenDuesWords}. `;
    } else if (givenDues < 0) {
      speechText += `Debit: negative ${formatNumberWithCommas(givenDues)} rupees, that is ${givenDuesWords}. `;
    } else {
      speechText += `Debit: zero rupees. `;
    }

    if (takenDues > 0) {
      speechText += `Credit: ${formatNumberWithCommas(takenDues)} rupees, that is ${takenDuesWords}. `;
    } else if (takenDues < 0) {
      speechText += `Credit: negative ${formatNumberWithCommas(takenDues)} rupees, that is ${takenDuesWords}. `;
    } else {
      speechText += `Credit: zero rupees. `;
    }

    if (remainsTotal > 0) {
      speechText += `Balance: ${formatWithOptionalDecimals(remainsTotal)} rupees, that is ${remainsTotalWords}. `;
    } else if (remainsTotal < 0) {
      speechText += `Balance: negative ${formatWithOptionalDecimals(remainsTotal)} rupees, that is ${remainsTotalWords}. `;
    } else {
      speechText += `Balance: zero rupees. `;
    }

    speechText += `Date: ${date}.`;

    return speechText;
  };

  // ✅ Generate speech text with record number
  const generateSpeechText = (record, recordNumber, totalRecords) => {
    const name = record.formattedName || 'No Name';
    const date = formatDateForSpeech(record.date) || 'No Date';

    const singlePiecePrice = Number(record.single_piece_price) || 0;
    const totalSinglePiecePrice = record.runningTotalSinglePiecePrice || 0;
    const medicinePieces = Number(record.m_pieces) || 0;
    const totalMedicinePieces = record.runningTotalMedicinePieces || 0;
    const feedPieces = Number(record.total_piece) || 0;
    const totalFeedPieces = record.runningTotalFeedPieces || 0;
    const otherPieces = Number(record.o_pieces) || 0;
    const totalOtherPieces = record.runningTotalOtherPieces || 0;
    const givenDues = Number(record.given_dues) || 0;
    const takenDues = Number(record.taken_dues) || 0;
    const remainsTotal = record.runningTotal || 0;

    const givenDuesWords = givenDues !== 0 ? numberToWords(givenDues) : 'zero';
    const takenDuesWords = takenDues !== 0 ? numberToWords(takenDues) : 'zero';
    const remainsTotalWords = remainsTotal !== 0 ? numberToWords(remainsTotal) : 'zero';

    let speechText = '';

    if (recordNumber && totalRecords) {
      speechText += `Record ${recordNumber} of ${totalRecords}. `;
    }

    speechText += `Date: ${date}.`;

    speechText += `Name: ${name}. `;

    if (singlePiecePrice > 0) {
      speechText += `Price or Weight: ${formatNumberWithCommas(singlePiecePrice)}. `;
    }
    speechText += `Total Price or Weight: ${formatWithOptionalDecimals(totalSinglePiecePrice)}. `;

    if (medicinePieces > 0) {
      speechText += `Medicine Qty: ${medicinePieces}. `;
    }
    speechText += `Total Medicines: ${formatWithOptionalDecimals(totalMedicinePieces)}. `;

    if (feedPieces > 0) {
      speechText += `Feed Qty: ${feedPieces}. `;
    }
    speechText += `Total Feeds: ${formatWithOptionalDecimals(totalFeedPieces)}. `;

    if (otherPieces > 0) {
      speechText += `Other Qty: ${otherPieces}. `;
    }
    speechText += `Total Others: ${formatWithOptionalDecimals(totalOtherPieces)}. `;

    if (givenDues > 0) {
      speechText += `Debit: ${formatNumberWithCommas(givenDues)} rupees, that is ${givenDuesWords}. `;
    } else if (givenDues < 0) {
      speechText += `Debit: negative ${formatNumberWithCommas(givenDues)} rupees, that is ${givenDuesWords}. `;
    } else {
      speechText += `Debit: zero rupees. `;
    }

    if (takenDues > 0) {
      speechText += `Credit: ${formatNumberWithCommas(takenDues)} rupees, that is ${takenDuesWords}. `;
    } else if (takenDues < 0) {
      speechText += `Credit: negative ${formatNumberWithCommas(takenDues)} rupees, that is ${takenDuesWords}. `;
    } else {
      speechText += `Credit: zero rupees. `;
    }

    if (remainsTotal > 0) {
      speechText += `Balance: ${formatWithOptionalDecimals(remainsTotal)} rupees, that is ${remainsTotalWords}. `;
    } else if (remainsTotal < 0) {
      speechText += `Balance: negative ${formatWithOptionalDecimals(remainsTotal)} rupees, that is ${remainsTotalWords}. `;
    } else {
      speechText += `Balance: zero rupees. `;
    }

    return speechText;
  };

  // ✅ Speak record function using react-speech-kit
  const speakRecord = (record) => {
    if (!supported) {
      Swal.fire({
        title: 'Speech Not Supported',
        text: 'Text-to-speech is not supported in your browser.',
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Stop any ongoing speech
    if (speaking) {
      cancel();
    }

    const speechText = generateSpeechTextForSingle(record);

    // Find the best voice (prefer English voices)
    const availableVoices = voices || [];
    const englishVoice = availableVoices.find(voice =>
      voice.lang.includes('en') || voice.lang.startsWith('en-')
    ) || (availableVoices.length > 0 ? availableVoices[0] : null);

    // Set speaking state
    setSpeakingRecordId(record.id);

    // Speak with react-speech-kit
    speak({
      text: speechText,
      rate: speechRate,
      pitch: speechPitch,
      volume: speechVolume,
      voice: englishVoice,
      onEnd: () => setSpeakingRecordId(null),
      onError: (event) => {
        console.error('Speech synthesis error:', event);
        setSpeakingRecordId(null);
        Swal.fire({
          title: 'Speech Error',
          text: 'Failed to speak the record. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  };

  // ✅ Stop speech function
  const stopSpeech = () => {
    if (speaking) {
      cancel();
      setSpeakingRecordId(null);
    }
  };

  // ✅ Toggle speech for a record
  const toggleSpeech = (record) => {
    if (speakingRecordId === record.id && speaking) {
      stopSpeech();
    } else {
      speakRecord(record);
    }
  };

  // ✅ Speak all records function
  const speakAllRecords = () => {
    if (!supported) {
      Swal.fire({
        title: 'Speech Not Supported',
        text: 'Text-to-speech is not supported in your browser.',
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return;
    }

    if (recordsWithRunningTotals.length === 0) {
      Swal.fire({
        title: 'No Records',
        text: 'There are no records to speak.',
        icon: 'info',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Stop any ongoing speech
    if (speaking) {
      cancel();
    }

    let currentIndex = 0;

    const speakNextRecord = () => {
      if (currentIndex >= recordsWithRunningTotals.length) {
        setSpeakingRecordId(null);

        // Speak summary at the end
        const summaryText = `End of records. Total ${recordsWithRunningTotals.length} records. Final remaining balance is ${formatWithOptionalDecimals(lastPrice)} rupees, that is ${numberToWords(lastPrice)}.`;

        const availableVoices = voices || [];
        const englishVoice = availableVoices.find(voice =>
          voice.lang.includes('en') || voice.lang.startsWith('en-')
        ) || (availableVoices.length > 0 ? availableVoices[0] : null);

        speak({
          text: summaryText,
          rate: speechRate,
          pitch: speechPitch,
          volume: speechVolume,
          voice: englishVoice
        });

        return;
      }

      const record = recordsWithRunningTotals[currentIndex];
      setSpeakingRecordId(record.id);

      const speechText = generateSpeechText(record, currentIndex + 1, recordsWithRunningTotals.length);

      const availableVoices = voices || [];
      const englishVoice = availableVoices.find(voice =>
        voice.lang.includes('en') || voice.lang.startsWith('en-')
      ) || (availableVoices.length > 0 ? availableVoices[0] : null);

      speak({
        text: speechText,
        rate: speechRate,
        pitch: speechPitch,
        volume: speechVolume,
        voice: englishVoice,
        onEnd: () => {
          currentIndex++;
          setTimeout(speakNextRecord, 500); // Small delay between records
        },
        onError: () => {
          currentIndex++;
          setTimeout(speakNextRecord, 500);
        }
      });
    };

    speakNextRecord();
  };

  // ✅ Speak summary function
  const speakSummary = () => {
    if (!supported) {
      Swal.fire({
        title: 'Speech Not Supported',
        text: 'Text-to-speech is not supported in your browser.',
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return;
    }

    if (recordsWithRunningTotals.length === 0) {
      Swal.fire({
        title: 'No Records',
        text: 'There are no records to speak.',
        icon: 'info',
        confirmButtonText: 'Ok'
      });
      return;
    }

    if (speaking) {
      cancel();
    }

    let summaryText = `Summary for ${selectedKhata || 'All Khatas'}. `;
    summaryText += `Total records: ${recordsWithRunningTotals.length}. `;
    summaryText += `Total all pieces: ${lastTotalPieces}. `;
    summaryText += `Total price or weight: ${formatWithOptionalDecimals(lastSinglePiecePriceTotal)}. `;
    summaryText += `Final remaining balance: ${formatWithOptionalDecimals(lastPrice)} rupees, that is ${numberToWords(lastPrice)}.`;

    const availableVoices = voices || [];
    const englishVoice = availableVoices.find(voice =>
      voice.lang.includes('en') || voice.lang.startsWith('en-')
    ) || (availableVoices.length > 0 ? availableVoices[0] : null);

    speak({
      text: summaryText,
      rate: speechRate,
      pitch: speechPitch,
      volume: speechVolume,
      voice: englishVoice
    });
  };

  // ✅ Check for zero values in Debit and Credit columns
  const checkZeroValues = () => {
    // Group zero value records by khata
    const zeroValueRecords = {};

    recordsWithRunningTotals.forEach((record, index) => {
      const givenDues = Number(record.given_dues) || 0;
      const takenDues = Number(record.taken_dues) || 0;

      // Check if both Debit and Credit are 0
      if (givenDues === 0 && takenDues === 0) {
        const khataName = record.khata_name || 'All Khatas';

        if (!zeroValueRecords[khataName]) {
          zeroValueRecords[khataName] = [];
        }

        zeroValueRecords[khataName].push({
          recordNumber: index + 1,
          name: record.formattedName,
          date: formatDate(record.date)
        });
      }
    });

    return zeroValueRecords;
  };

  // ✅ Show zero value alert
  const showZeroValueAlert = (zeroValueRecords, isAutoCheck = false) => {
    const totalZeroRecords = Object.values(zeroValueRecords).reduce((acc, arr) => acc + arr.length, 0);

    if (totalZeroRecords === 0) {
      Swal.fire({
        title: isAutoCheck ? 'No Zero Values Found' : 'Check Complete',
        text: 'No records found with both Debit and Credit values as 0.',
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_success' },
      });
      return;
    }

    // Create HTML content for the alert
    let htmlContent = `
      <div style="text-align: left; max-height: 400px; overflow-y: auto;">
        <p style="color: #dc3545; font-weight: bold; margin-bottom: 15px;">
          Found ${totalZeroRecords} record${totalZeroRecords > 1 ? 's' : ''} with both Debit and Credit as 0
        </p>
    `;

    // Group by khata
    Object.entries(zeroValueRecords).forEach(([khataName, records]) => {
      htmlContent += `
        <div style="margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
          <h6 style="color: #62109F; margin-bottom: 10px;">
            ${khataName === 'All Khatas' ? '📁 All Khatas' : `📒 ${khataName}`}
          </h6>
          <div style="padding-left: 15px;">
      `;

      records.forEach(record => {
        htmlContent += `
          <div style="margin-bottom: 8px; padding: 8px; background: white; border-left: 4px solid #ffc107; border-radius: 3px;">
            <span style="font-weight: bold; color: #6c757d;">Record #${record.recordNumber}</span>
            <div style="font-size: 0.9em; color: #495057; margin-top: 3px;">
              <span style="display: block;">📝 ${record.name}</span>
              <span style="display: block;">📅 ${record.date}</span>
            </div>
          </div>
        `;
      });

      htmlContent += `
          </div>
        </div>
      `;
    });

    htmlContent += `
        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px; border: 1px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-size: 0.9em;">
            <strong>Note:</strong> These records have both Debit and Credit values as 0. 
            You may want to review or update them.
          </p>
        </div>
      </div>
    `;

    Swal.fire({
      title: isAutoCheck ? '⚠️ Zero Value Alert' : '🔍 Zero Value Check',
      html: htmlContent,
      icon: 'warning',
      width: '700px',
      confirmButtonText: 'Ok, I Understand',
      showCancelButton: !isAutoCheck,
      cancelButtonText: 'Close',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger me-2',
        cancelButton: 'btn btn-success',
        popup: 'sweetalert_zero_value_popup'
      },
      didOpen: () => {
        // Add custom styles for scrollbar
        const popup = document.querySelector('.sweetalert_zero_value_popup');
        if (popup) {
          const style = document.createElement('style');
          style.textContent = `
            .sweetalert_zero_value_popup .swal2-html-container {
              max-height: 400px;
              overflow-y: auto;
            }
            .sweetalert_zero_value_popup .swal2-html-container::-webkit-scrollbar {
              width: 8px;
            }
            .sweetalert_zero_value_popup .swal2-html-container::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 4px;
            }
            .sweetalert_zero_value_popup .swal2-html-container::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 4px;
            }
            .sweetalert_zero_value_popup .swal2-html-container::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          `;
          popup.appendChild(style);
        }
      }
    });
  };

  // ✅ Run automatic zero value check on component mount
  useEffect(() => {
    if (!hasCheckedInitialZeroValues && recordsWithRunningTotals.length > 0) {
      const zeroValueRecords = checkZeroValues();
      const totalZeroRecords = Object.values(zeroValueRecords).reduce((acc, arr) => acc + arr.length, 0);

      if (totalZeroRecords > 0) {
        // Delay the alert slightly to ensure page is loaded
        setTimeout(() => {
          showZeroValueAlert(zeroValueRecords, true);
          setHasCheckedInitialZeroValues(true);
        }, 1500);
      } else {
        setHasCheckedInitialZeroValues(true);
      }
    }
  }, [recordsWithRunningTotals, hasCheckedInitialZeroValues]);

  // ✅ Handle manual zero value check
  const handleCheckZeroValues = () => {
    const zeroValueRecords = checkZeroValues();
    showZeroValueAlert(zeroValueRecords, false);
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
      setShowScrollTop(scrollTop > 100);
      setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 100);
    }
  };

  // ✅ Add scroll event listener
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      handleScroll();

      return () => {
        tableContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [recordsWithRunningTotals.length]);

  // ✅ Delete record
  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336',
        cancelButtonColor: '#4caf50',
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

  // ✅ DELETE ALL RECORDS FUNCTION
  const handleDeleteAll = async () => {
    // Check if there are records to delete
    if (recordsWithRunningTotals.length === 0) {
      Swal.fire({
        title: 'No Records',
        text: 'There are no records to delete.',
        icon: 'info',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Delete All Records?',
      html: `
        <div style="text-align: left;">
          <p><strong>You are about to delete:</strong></p>
          <p>• <strong>${recordsWithRunningTotals.length}</strong> records from the table</p>
          <p>• This action <strong>cannot be undone</strong></p>
          <p>• All data will be permanently removed</p>
          <p>• Current filters applied: ${selectedKhata || 'All Khatas'}</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#4caf50',
      confirmButtonText: 'Yes, Delete All!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'swal2-danger'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    // Get confirmation for critical action
    const confirmResult = await Swal.fire({
      title: 'Final Confirmation',
      text: `Type "DELETE" to confirm deletion of ${recordsWithRunningTotals.length} records`,
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Confirm Delete',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#4caf50',
      showLoaderOnConfirm: true,
      preConfirm: (input) => {
        if (input !== 'DELETE') {
          Swal.showValidationMessage('You must type DELETE in uppercase to confirm');
        }
        return input === 'DELETE';
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setIsDeletingAll(true);
    setTotalToDelete(recordsWithRunningTotals.length);
    setDeleteProgress(0);

    // Show progress dialog
    Swal.fire({
      title: 'Deleting Records...',
      html: `
        <div style="text-align: center;">
          <p>Deleting records from the table...</p>
          <div class="progress" style="height: 25px; margin: 20px 0;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger" 
                 role="progressbar" 
                 style="width: 0%; height: 100%;">
              <span class="progress-text">0%</span>
            </div>
          </div>
          <p><strong>Progress:</strong> <span class="progress-count">0</span> / ${recordsWithRunningTotals.length}</p>
          <p class="text-danger"><small>Please do not close this window</small></p>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      // Delete records one by one with progress tracking
      for (let i = 0; i < recordsWithRunningTotals.length; i++) {
        const record = recordsWithRunningTotals[i];

        try {
          await deleteGivenDues(record.id).unwrap();
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            id: record.id,
            name: record.formattedName,
            error: error.message || 'Unknown error'
          });
          console.error(`Failed to delete record ${record.id}:`, error);
        }

        // Update progress
        const progress = Math.round(((i + 1) / recordsWithRunningTotals.length) * 100);
        setDeleteProgress(progress);

        // Update progress in SweetAlert
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        const progressCount = document.querySelector('.progress-count');

        if (progressBar) {
          progressBar.style.width = `${progress}%`;
          if (progressText) progressText.textContent = `${progress}%`;
          if (progressCount) progressCount.textContent = `${i + 1}`;
        }

        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Refetch data after deletion
      await refetch();

      // Close progress dialog
      Swal.close();

      // Show result summary
      let resultHtml = '';

      if (successCount > 0) {
        resultHtml += `
          <div style="text-align: left; margin-bottom: 15px;">
            <p style="color: #198754; font-weight: bold;">✅ Successfully deleted: ${successCount} records</p>
          </div>
        `;
      }

      if (errorCount > 0) {
        resultHtml += `
          <div style="text-align: left; margin-bottom: 15px;">
            <p style="color: #dc3545; font-weight: bold;">❌ Failed to delete: ${errorCount} records</p>
            <details style="margin-top: 10px;">
              <summary style="cursor: pointer; color: #6c757d;">View error details</summary>
              <div style="max-height: 150px; overflow-y: auto; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                ${errors.map(err => `<p style="margin: 5px 0; font-size: 12px;"><strong>${err.name}</strong>: ${err.error}</p>`).join('')}
              </div>
            </details>
          </div>
        `;
      }

      Swal.fire({
        title: successCount > 0 ? 'Deletion Complete!' : 'Deletion Partially Complete',
        html: resultHtml,
        icon: errorCount === 0 ? 'success' : (successCount > 0 ? 'warning' : 'error'),
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: {
          confirmButton: errorCount === 0 ? 'sweetalert_btn_success' : 'sweetalert_btn_warning',
          popup: 'sweetalert_delete_popup'
        },
      });

    } catch (error) {
      console.error('Bulk delete error:', error);
      Swal.fire({
        title: 'Deletion Failed!',
        text: 'An unexpected error occurred during bulk deletion.',
        icon: 'error',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
    } finally {
      setIsDeletingAll(false);
      setDeleteProgress(0);
      setTotalToDelete(0);
    }
  };

  // ✅ PDF Download - Fixed version
  const handleDownloadPDF = async () => {
    try {
      // Check if there are records to export
      if (recordsWithRunningTotals.length === 0) {
        Swal.fire({
          title: 'No Records',
          text: 'There are no records to export to PDF.',
          icon: 'warning',
          confirmButtonText: 'Ok'
        });
        return;
      }

      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      // Create PDF in landscape mode
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      // Calculate date range from records
      const getDateRange = () => {
        if (recordsWithRunningTotals.length === 0) return 'No records';

        const dates = recordsWithRunningTotals
          .map(record => new Date(record.date))
          .filter(date => !isNaN(date.getTime()));

        if (dates.length === 0) return 'No valid dates';

        const startDate = new Date(Math.min(...dates));
        const endDate = new Date(Math.max(...dates));

        const format = (date) => {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        };

        return `${format(startDate)} to ${format(endDate)}`;
      };

      // PDF title based on selected khata
      const pdfTitle = selectedKhata
        ? `Ledger File - ${selectedKhata}`
        : 'Daily Report File - All Khatas';

      const recordCount = recordsWithRunningTotals.length;
      const dateRangeText = getDateRange();

      // Add header information
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text(pdfTitle, 40, 40);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 65);
      doc.text(`Record Period: ${dateRangeText}`, 40, 85);
      doc.text(`Total Records: ${recordCount}`, 40, 105);

      // Define table columns - Match your table structure
      const tableColumn = [
        'Sr.#',
        ...(selectedKhata ? [] : ['Khata Name']), // Conditional column
        'Date',
        'Name',
        'Rate or Weight',
        'Total Rate or Weight',
        'Medicine Qty',
        'Total Medicines',
        'Feed Qty',
        'Total Feeds',
        'Other Qty',
        'Total Others',
        'Debit (-)',
        'Credit (+)',
        'Balance'
      ];

      // Prepare table rows
      const tableRows = recordsWithRunningTotals.map((record, index) => {
        const baseRow = [
          index + 1,
          formatDate(record.date),
          formatNameForPDF(record) || '-',
          formatNumberWithCommas(record.single_piece_price) || '0',
          formatWithOptionalDecimals(record.runningTotalSinglePiecePrice) || '0', // Changed
          record.m_pieces || '0',
          formatWithOptionalDecimals(record.runningTotalMedicinePieces) || '0', // Changed
          record.total_piece || '0',
          formatWithOptionalDecimals(record.runningTotalFeedPieces) || '0', // Changed
          record.o_pieces || '0',
          formatWithOptionalDecimals(record.runningTotalOtherPieces) || '0', // Changed
          formatNumberWithCommas(record.given_dues) || '0',
          formatNumberWithCommas(record.taken_dues) || '0',
          formatWithOptionalDecimals(record.runningTotal) || '0' // Changed
        ];

        // Add khata name if showing all khatas
        return selectedKhata
          ? baseRow
          : [index + 1, record.khata_name || '-', ...baseRow.slice(1)];
      });

      // Define column styles with consistent color scheme
      const columnStyles = {};

      // Base column index adjustments based on whether khata column is included
      const baseIndex = selectedKhata ? 0 : 1;

      // Color scheme definition
      const colors = {
        index: { text: [90, 14, 36], background: [240, 240, 240] },
        khata: { text: [220, 14, 14], background: [255, 255, 255] },
        date: { text: [60, 60, 60], background: [245, 245, 245] },
        name: { text: [0, 0, 0], background: [255, 255, 255] },
        common: { text: [90, 14, 36], background: [250, 250, 250] },
        total: { text: [6, 7, 113], background: [232, 249, 255] },
        debit: { text: [220, 53, 69], background: [254, 227, 236] },
        credit: { text: [25, 135, 84], background: [202, 247, 227] },
        balance: { text: [33, 37, 41], background: [248, 249, 250] }
      };

      // Apply styles to each column
      if (selectedKhata) {
        columnStyles[0] = {
          textColor: colors.index.text,
          fillColor: colors.index.background,
          fontStyle: 'bold'
        };
        columnStyles[1] = {
          textColor: colors.date.text,
          fillColor: colors.date.background
        };
        columnStyles[2] = {
          textColor: colors.name.text,
          fillColor: colors.name.background,
          fontStyle: 'bold'
        };
        columnStyles[3] = {
          textColor: colors.common.text,
          fillColor: colors.common.background
        };
        columnStyles[4] = {
          textColor: colors.total.text,
          fillColor: colors.total.background,
          fontStyle: 'bold'
        };
        columnStyles[5] = {
          textColor: colors.common.text,
          fillColor: colors.common.background
        };
        columnStyles[6] = {
          textColor: colors.total.text,
          fillColor: colors.total.background,
          fontStyle: 'bold'
        };
        columnStyles[7] = {
          textColor: colors.common.text,
          fillColor: colors.common.background
        };
        columnStyles[8] = {
          textColor: colors.total.text,
          fillColor: colors.total.background,
          fontStyle: 'bold'
        };
        columnStyles[9] = {
          textColor: colors.common.text,
          fillColor: colors.common.background
        };
        columnStyles[10] = {
          textColor: colors.total.text,
          fillColor: colors.total.background,
          fontStyle: 'bold'
        };
        columnStyles[11] = {
          textColor: colors.debit.text,
          fillColor: colors.debit.background,
          fontStyle: 'bold'
        };
        columnStyles[12] = {
          textColor: colors.credit.text,
          fillColor: colors.credit.background,
          fontStyle: 'bold'
        };
        columnStyles[13] = {
          textColor: colors.balance.text,
          fillColor: colors.balance.background,
          fontStyle: 'bold'
        };
      } else {
        columnStyles[0] = {
          textColor: colors.index.text,
          fillColor: colors.index.background,
          fontStyle: 'bold'
        };
        columnStyles[1] = {
          textColor: colors.khata.text,
          fillColor: colors.khata.background,
          fontStyle: 'bold'
        };
        columnStyles[2] = {
          textColor: colors.date.text,
          fillColor: colors.date.background
        };
        columnStyles[3] = {
          textColor: colors.name.text,
          fillColor: colors.name.background,
          fontStyle: 'bold'
        };
        columnStyles[4] = {
          textColor: colors.common.text,
          fillColor: colors.common.background
        };
        columnStyles[5] = {
          textColor: colors.total.text,
          fillColor: colors.total.background,
          fontStyle: 'bold'
        };
        columnStyles[6] = {
          textColor: colors.common.text,
          fillColor: colors.common.background
        };
        columnStyles[7] = {
          textColor: colors.total.text,
          fillColor: colors.total.background,
          fontStyle: 'bold'
        };
        columnStyles[8] = {
          textColor: colors.common.text,
          fillColor: colors.common.background
        };
        columnStyles[9] = {
          textColor: colors.total.text,
          fillColor: colors.total.background,
          fontStyle: 'bold'
        };
        columnStyles[10] = {
          textColor: colors.common.text,
          fillColor: colors.common.background
        };
        columnStyles[11] = {
          textColor: colors.total.text,
          fillColor: colors.total.background,
          fontStyle: 'bold'
        };
        columnStyles[12] = {
          textColor: colors.debit.text,
          fillColor: colors.debit.background,
          fontStyle: 'bold'
        };
        columnStyles[13] = {
          textColor: colors.credit.text,
          fillColor: colors.credit.background,
          fontStyle: 'bold'
        };
        columnStyles[14] = {
          textColor: colors.balance.text,
          fillColor: colors.balance.background,
          fontStyle: 'bold'
        };
      }

      // Table styles
      const styles = {
        fontSize: 8,
        cellPadding: 4,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.5,
        lineColor: [200, 200, 200]
      };

      // Custom cell parsing for balance column coloring
      const didParseCell = (data) => {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const columnIndex = data.column.index;
          const record = recordsWithRunningTotals[rowIndex];

          if (!record) return;

          const balanceColumnIndex = selectedKhata ? 13 : 14;

          if (columnIndex === balanceColumnIndex) {
            const balanceValue = record.runningTotal;

            if (balanceValue < 0) {
              data.cell.styles.textColor = [220, 53, 69];
              data.cell.styles.fontStyle = 'bold';
            } else if (balanceValue > 0) {
              data.cell.styles.textColor = [25, 135, 84];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [108, 117, 125];
            }
          }

          if (record.isReturn) {
            data.cell.styles.fillColor = [255, 243, 224];
            data.cell.styles.textColor = [255, 107, 53];
          }
        }
      };

      // Generate the table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 120,
        theme: 'grid',
        styles: styles,
        columnStyles: columnStyles,
        headStyles: {
          fillColor: [244, 67, 54],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9,
          lineWidth: 0.5,
          lineColor: [200, 200, 200]
        },
        margin: { left: 20, right: 20 },
        didParseCell: didParseCell,
        willDrawCell: (data) => {
          if (data.section === 'body' && data.row.index % 2 === 0) {
            if (!data.cell.styles.fillColor ||
              JSON.stringify(data.cell.styles.fillColor) === JSON.stringify([255, 255, 255])) {
              data.cell.styles.fillColor = [248, 249, 250];
            }
          }
        }
      });

      // Add footer with summary
      const finalY = doc.lastAutoTable.finalY || 500;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);

      const summaryText = `Summary: ${recordCount} records | ` +
        `Final Balance: ${formatWithOptionalDecimals(lastPrice)} | ` +
        `Total Pieces: ${lastTotalPieces}`;

      doc.text(summaryText, 40, finalY + 30);

      // Generate filename with date range
      const today = new Date().toISOString().split('T')[0];
      const fileName = selectedKhata
        ? `Ledger_${selectedKhata.replace(/\s+/g, '_')}_${today}.pdf`
        : `All_Khatas_Ledger_${today}.pdf`;

      // Save the PDF
      doc.save(fileName);

      // Success notification
      Swal.fire({
        title: 'PDF Generated Successfully!',
        html: `
        <div style="text-align: left;">
          <p><strong>File:</strong> ${fileName}</p>
          <p><strong>Records:</strong> ${recordCount}</p>
          <p><strong>Period:</strong> ${dateRangeText}</p>
          <p><strong>Final Balance:</strong> ${formatWithOptionalDecimals(lastPrice)}</p>
        </div>
      `,
        icon: 'success',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'sweetalert_btn_success',
          popup: 'sweetalert_pdf_popup'
        },
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      Swal.fire({
        title: 'PDF Generation Failed!',
        text: 'An error occurred while generating the PDF. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok',
        buttonsStyling: false,
        customClass: { confirmButton: 'sweetalert_btn_error' },
      });
    }
  };

  // ✅ Style objects
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
  const SpeakingStyle = {
    backgroundColor: '#e8f4fd',
    borderLeft: '4px solid #2196f3',
    animation: 'pulse 2s infinite'
  }

  // ✅ CSS for pulse animation
  const pulseAnimation = `
    @keyframes pulse {
      0% { background-color: #e8f4fd; }
      50% { background-color: #bbdefb; }
      100% { background-color: #e8f4fd; }
    }
  `;

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

  // ✅ Khata dropdown styles
  const khataDropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '0.375rem',
    zIndex: 1000,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  };

  return (
    <>
      <style>{pulseAnimation}</style>

      <h1 className="d-flex justify-content-center my-4 gradient_text">
        ADD DUES IN RECORD
      </h1>

      {/* 🧾 Add Dues Form */}
      <DuesCard
        lastPrice={lastPrice}
        refetchData={refetch}
        selectedKhata={selectedKhata}
      />



      <h1 className="d-flex justify-content-center mb-4 mt-5 gradient_text">
        {selectedKhata ? `(${selectedKhata})` : 'All Khatas'}
      </h1>

      {/* 🔊 Voice Controls */}
      {supported && (
        <div className="voice-controls mb-4 p-3 bg-light rounded shadow-sm">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="row">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Speech Rate</label>
                  <input
                    type="range"
                    className="form-range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  />
                  <div className="text-center">{speechRate.toFixed(1)}x</div>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Speech Pitch</label>
                  <input
                    type="range"
                    className="form-range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  />
                  <div className="text-center">{speechPitch.toFixed(1)}</div>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Speech Volume</label>
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={speechVolume}
                    onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                  />
                  <div className="text-center">{speechVolume.toFixed(1)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <button
                className="btn me-2" style={{ backgroundColor: '#62109F', color: 'white' }}
                onClick={speakSummary}
                disabled={recordsWithRunningTotals.length === 0 || speaking}
              >
                📊 Speak Summary
              </button>
              <button
                className="btn btn-info me-2"
                onClick={speakAllRecords}
                disabled={recordsWithRunningTotals.length === 0 || speaking}
              >
                🔊 Speak All Records
              </button>
              <button
                className="btn btn-warning mt-2"
                onClick={stopSpeech}
                disabled={!speaking}
              >
                ⏹️ Stop Speech
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Filters */}
      <div className="search-container mb-3 d-flex gap-3 flex-wrap align-items-end">
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Search by Name:</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Search by Date:</label>
          <input
            type="date"
            className="form-control"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Search by Month (YYYY/MM):</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. 2025/05"
            value={searchMonth}
            onChange={(e) => setSearchMonth(e.target.value)}
          />
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Search by Year (YYYY):</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. 2024"
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
          />
        </div>

        <div className="form-group mt-2">
          <label className="form-label fw-bold">Total All Pieces</label>
          <div className="form-control text-center fw-bold bg-light" style={{ color: 'rgb(6, 7, 113)' }}>
            {lastTotalPieces}
          </div>
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Total Price or Weight</label>
          <div className="form-control text-center fw-bold bg-light" style={{ color: 'rgb(6, 7, 113)' }}>
            {formatWithOptionalDecimals(lastSinglePiecePriceTotal)}
          </div>
        </div>
        <div className="form-group mt-2">
          <label className="form-label fw-bold">Remains Total Balance</label>
          <div
            className="form-control text-center fw-bold bg-light"
            style={getPriceColorStyle(lastPrice)}
          >
            {formatWithOptionalDecimals(lastPrice)}
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

        {/* 🔍 Zero Value Check Button */}
        <div className="form-group">
          <button
            className="btn btn-warning px-4"
            onClick={handleCheckZeroValues}
            disabled={recordsWithRunningTotals.length === 0}
            title="Check for records with both Debit and Credit as 0"
          >
            🔍 Check Zero Values
          </button>
        </div>

        {/* 🗑️ Delete All Button */}
        <div className="form-group">
          <button
            className="btn delete_btn px-4"
            onClick={handleDeleteAll}
            disabled={recordsWithRunningTotals.length === 0 || isDeletingAll}
            title={`Delete all ${recordsWithRunningTotals.length} records from the table`}
          >
            {isDeletingAll ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting... ({deleteProgress}%)
              </>
            ) : (
              `🗑️ Delete All (${recordsWithRunningTotals.length})`
            )}
          </button>
        </div>
        {/* 💼 Khata Search and Selection */}
        <div className="d-flex flex-wrap justify-content-center gap-3 ">
          {/* All Khatas Button */}
          <button
            className={`btn ${selectedKhata === '' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={handleClearKhata}
          >
            All Khatas
          </button>

          {/* Khata Search Dropdown */}
          <div className="position-relative" ref={khataSearchRef}>
            <div className="input-group" style={{ width: '300px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search Khatas..."
                value={khataSearch}
                onChange={(e) => {
                  setKhataSearch(e.target.value);
                  setShowKhataDropdown(true);
                }}
                onFocus={() => setShowKhataDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredKhataNames.length > 0) {
                    handleKhataSelect(filteredKhataNames[0]);
                  }
                }}
              />
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={() => setShowKhataDropdown(!showKhataDropdown)}
              >
                {showKhataDropdown ? '▲' : '▼'}
              </button>
            </div>

            {/* Khata Dropdown */}
            {showKhataDropdown && (
              <div style={khataDropdownStyle}>
                {filteredKhataNames.length > 0 ? (
                  filteredKhataNames.map((khata) => (
                    <div
                      key={khata}
                      className={`dropdown-item ${selectedKhata === khata ? 'active bg-primary text-white' : ''}`}
                      onClick={() => handleKhataSelect(khata)}
                      style={{
                        cursor: 'pointer',
                        padding: '10px 15px',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedKhata === khata ? '#007bff' : 'white'}
                    >
                      {khata}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-item text-muted" style={{ padding: '10px 15px' }}>
                    No khata found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Khata Display */}
          {selectedKhata && (
            <div className="d-flex align-items-center">
              <div className="badge bg-danger p-2 d-flex align-items-center">
                <span className="me-2">Selected:</span>
                <strong>{selectedKhata}</strong>
                <button
                  className="btn btn-sm btn-light ms-2 p-1"
                  onClick={handleClearKhata}
                  style={{ width: '24px', height: '24px', lineHeight: '1' }}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Khata Count Badge */}
          <div className="badge p-2 d-flex align-items-center" style={{ backgroundColor: '#62109F' }}>
            <span className="me-1">Total Khatas:</span>
            <strong>{khataNames.length}</strong>
          </div>
        </div>
      </div>

      {/* 📋 Table Container with Scroll */}
      <div
        className="table-container p-3 mb-5"
        ref={tableContainerRef}
        style={{
          maxHeight: '500px',
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
                {!selectedKhata && <th style={TableHeadingStyle}>Khata Name</th>}
                <th style={TableHeadingStyle}>Date</th>
                <th style={TableHeadingStyle}>Name</th>
                <th style={TableHeadingStyle}>Rate or Weight</th>
                <th style={TableHeadingStyle}>Total Rate or Weight</th>
                <th style={TableHeadingStyle}>Medicine Qty</th>
                <th style={TableHeadingStyle}>Total Medicines</th>
                <th style={TableHeadingStyle}>Feed Qty</th>
                <th style={TableHeadingStyle}>Total Feeds</th>
                <th style={TableHeadingStyle}>Other Qty</th>
                <th style={TableHeadingStyle}>Total Others</th>
                <th style={TableHeadingStyle}>Debit (-)</th>
                <th style={TableHeadingStyle}>Credit (+)</th>
                <th style={TableHeadingStyle}>Balance</th>
                <th style={TableHeadingStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recordsWithRunningTotals.length > 0 ? (
                recordsWithRunningTotals.map((record, index) => {
                  const givenDues = Number(record.given_dues) || 0;
                  const takenDues = Number(record.taken_dues) || 0;
                  const isZeroValue = givenDues === 0 && takenDues === 0;

                  return (
                    <tr
                      key={record.id || index}
                      style={{
                        ...(speakingRecordId === record.id ? SpeakingStyle : {}),
                        ...(isZeroValue ? { backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107' } : {})
                      }}
                    >
                      <td style={{ ...TableCellStyle, ...IndexStyle }}>{index + 1}</td>
                      {!selectedKhata && (
                        <td style={{ ...TableCellStyle, ...KhataStyle }}>
                          {record.khata_name}
                        </td>
                      )}
                      <td style={TableCellStyle}>
                        {formatDate(record.date)}
                      </td>
                      <td style={{ ...TableCellStyle, ...(record.isReturn ? ReturnStyle : {}) }}>
                        {record.formattedName}
                        {isZeroValue && (
                          <span className="badge bg-warning text-dark ms-2" title="Both Debit and Credit are 0">
                            ⚠️ Zero
                          </span>
                        )}
                      </td>
                      <td style={{ ...TableCellStyle, ...CommonStyle }}>
                        {formatNumberWithCommas(record.single_piece_price)}
                      </td>
                      {/* 🔄 CHANGED: Use formatWithOptionalDecimals for these 5 columns */}
                      <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                        {formatWithOptionalDecimals(record.runningTotalSinglePiecePrice)}
                      </td>
                      <td style={{ ...TableCellStyle, ...CommonStyle }}>
                        {record.m_pieces}
                      </td>
                      <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                        {formatWithOptionalDecimals(record.runningTotalMedicinePieces)}
                      </td>
                      <td style={{ ...TableCellStyle, ...CommonStyle }}>
                        {record.total_piece}
                      </td>
                      <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                        {formatWithOptionalDecimals(record.runningTotalFeedPieces)}
                      </td>
                      <td style={{ ...TableCellStyle, ...CommonStyle }}>
                        {record.o_pieces}
                      </td>
                      <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                        {formatWithOptionalDecimals(record.runningTotalOtherPieces)}
                      </td>
                      <td style={{ ...TableCellStyle, ...GivenDuesStyle }}>
                        {record.given_dues ? formatNumberWithCommas(record.given_dues) : '0'}
                      </td>
                      <td style={{ ...TableCellStyle, ...TakenDuesStyle }}>
                        {record.taken_dues ? formatNumberWithCommas(record.taken_dues) : '0'}
                      </td>
                      {/* 🔄 CHANGED: Use formatWithOptionalDecimals for Balance column */}
                      <td
                        style={{
                          ...TableCellStyle,
                          ...getPriceColorStyle(record.runningTotal)
                        }}
                        className="fw-bold"
                      >
                        {formatWithOptionalDecimals(record.runningTotal)}
                      </td>

                      <td style={TableCellStyle} className='d-flex justify-content-center align-items-center gap-2'>
                        <Link to={`/updatedues/${record.id}`} className="update_btn">
                          Update
                        </Link>
                        <button
                          className="delete_btn"
                          onClick={() => handleDelete(record.id)}
                        >
                          Delete
                        </button>
                        {supported && (
                          <button
                            className={`btn ${speakingRecordId === record.id ? 'btn-warning' : 'btn-info'}`}
                            onClick={() => toggleSpeech(record)}
                            style={{
                              padding: '2px 8px',
                              fontSize: '0.8rem',
                              minWidth: '60px',
                            }}
                            title={speakingRecordId === record.id ? 'Stop speaking this record' : 'Speak this record with amounts in words'}
                          >
                            {speakingRecordId === record.id ? '⏹️ Stop' : '🔊 Speak'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
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