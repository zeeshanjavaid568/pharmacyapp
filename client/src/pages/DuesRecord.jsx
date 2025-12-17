import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  const speechQueueRef = useRef([]);
  const currentUtteranceRef = useRef(null);

  // ✅ Filters
  const [searchDate, setSearchDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchMonth, setSearchMonth] = useState('');
  const [searchYear, setSearchYear] = useState('');

  // ✅ Khata Management
  const [selectedKhata, setSelectedKhata] = useState('');

  // ✅ Scroll to top/bottom states
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // ✅ Enhanced Voice synthesis states for offline functionality
  const [speakingRecordId, setSpeakingRecordId] = useState(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSpeechInitialized, setIsSpeechInitialized] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [speechError, setSpeechError] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // ✅ Initialize speech synthesis with offline capability
  useEffect(() => {
    const initSpeechSynthesis = () => {
      if ('speechSynthesis' in window) {
        setIsSpeechSupported(true);
        
        // Check if we're offline
        setIsOfflineMode(!navigator.onLine);
        
        // Load available voices
        const loadVoices = () => {
          const voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            setAvailableVoices(voices);
            
            // Try to find a natural-sounding offline voice
            const offlineVoice = voices.find(voice => 
              !voice.localService === false && // Local voices are usually offline
              voice.lang.includes('en')
            ) || voices.find(voice => 
              voice.lang.includes('en')
            ) || voices[0];
            
            if (offlineVoice) {
              setSelectedVoice(offlineVoice);
            }
            
            setIsSpeechInitialized(true);
            setSpeechError(null);
          } else {
            // If no voices are available, we might be offline
            setTimeout(() => {
              const voices = speechSynthesis.getVoices();
              if (voices.length > 0) {
                setAvailableVoices(voices);
                setSelectedVoice(voices[0]);
                setIsSpeechInitialized(true);
              } else {
                setSpeechError('No voices available. Please check your system settings.');
              }
            }, 1000);
          }
        };
        
        // Initial load
        loadVoices();
        
        // Some browsers load voices asynchronously
        if (speechSynthesis.onvoiceschanged !== undefined) {
          speechSynthesis.onvoiceschanged = loadVoices;
        }
        
        // Listen for online/offline status
        const handleOnline = () => {
          setIsOfflineMode(false);
          loadVoices();
        };
        
        const handleOffline = () => {
          setIsOfflineMode(true);
          // Offline mode - use available voices
          loadVoices();
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          stopSpeech();
        };
      } else {
        setIsSpeechSupported(false);
        setSpeechError('Speech synthesis is not supported in your browser.');
      }
    };
    
    initSpeechSynthesis();
  }, []);

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

  // ✅ Format date for speech (more natural reading)
  const formatDateForSpeech = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

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

  // ✅ Format Name with Medicine/Feed/Other/Payment prefixes
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

  // ✅ Find last record totals
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

  // ✅ Convert number to words (up to billions)
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

  // ✅ Format number with commas for display
  const formatNumberWithCommas = (num) => {
    if (num === undefined || num === null) return '0';
    return Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // ✅ Generate speech text for single record
  const generateSpeechTextForSingle = useCallback((record) => {
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
      speechText += `Remaining total: ${formatNumberWithCommas(remainsTotal)} rupees, that is ${remainsTotalWords}. `;
    } else if (remainsTotal < 0) {
      speechText += `Remaining total: negative ${formatNumberWithCommas(remainsTotal)} rupees, that is ${remainsTotalWords}. `;
    } else {
      speechText += `Remaining total: zero rupees. `;
    }

    speechText += `Record details: Name: ${name}. `;

    if (singlePiecePrice > 0) {
      speechText += `Price or Weight: ${formatNumberWithCommas(singlePiecePrice)}. `;
    }
    speechText += `Total Price or Weight: ${formatNumberWithCommas(totalSinglePiecePrice)}. `;

    if (medicinePieces > 0) {
      speechText += `Medicine pieces: ${medicinePieces}. `;
    }
    speechText += `Total Medicines: ${formatNumberWithCommas(totalMedicinePieces)}. `;

    if (feedPieces > 0) {
      speechText += `Feed Pieces: ${feedPieces}. `;
    }
    speechText += `Total Feeds: ${formatNumberWithCommas(totalFeedPieces)}. `;

    if (otherPieces > 0) {
      speechText += `Other Pieces: ${otherPieces}. `;
    }
    speechText += `Total Others: ${formatNumberWithCommas(totalOtherPieces)}. `;

    if (givenDues > 0) {
      speechText += `Given dues: ${formatNumberWithCommas(givenDues)} rupees, that is ${givenDuesWords}. `;
    } else if (givenDues < 0) {
      speechText += `Given dues: negative ${formatNumberWithCommas(givenDues)} rupees, that is ${givenDuesWords}. `;
    } else {
      speechText += `Given dues: zero rupees. `;
    }

    if (takenDues > 0) {
      speechText += `Taken dues: ${formatNumberWithCommas(takenDues)} rupees, that is ${takenDuesWords}. `;
    } else if (takenDues < 0) {
      speechText += `Taken dues: negative ${formatNumberWithCommas(takenDues)} rupees, that is ${takenDuesWords}. `;
    } else {
      speechText += `Taken dues: zero rupees. `;
    }

    speechText += `Date: ${date}.`;

    return speechText;
  }, []);

  // ✅ Enhanced speak function with offline support
  const speakText = useCallback((text, onEnd = null) => {
    if (!isSpeechSupported || !isSpeechInitialized) {
      Swal.fire({
        title: 'Speech Not Available',
        text: speechError || 'Speech synthesis is not available. Please check your system settings.',
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return null;
    }

    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = speechVolume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeechText('');
      if (onEnd) onEnd();
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
      setCurrentSpeechText('');
      setSpeechError('Speech synthesis failed. Please try again.');
    };

    setCurrentSpeechText(text);
    setIsSpeaking(true);
    currentUtteranceRef.current = utterance;
    
    // Use try-catch for better error handling
    try {
      speechSynthesis.speak(utterance);
      return utterance;
    } catch (error) {
      console.error('Error starting speech:', error);
      setIsSpeaking(false);
      setCurrentSpeechText('');
      return null;
    }
  }, [isSpeechSupported, isSpeechInitialized, selectedVoice, speechRate, speechPitch, speechVolume, speechError]);

  // ✅ Speak record function
  const speakRecord = useCallback((record) => {
    const speechText = generateSpeechTextForSingle(record);
    const utterance = speakText(speechText);
    
    if (utterance) {
      setSpeakingRecordId(record.id);
      utterance.onend = () => {
        setSpeakingRecordId(null);
      };
    }
  }, [generateSpeechTextForSingle, speakText]);

  // ✅ Stop speech function
  const stopSpeech = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentSpeechText('');
    setSpeakingRecordId(null);
    speechQueueRef.current = [];
    currentUtteranceRef.current = null;
  }, []);

  // ✅ Toggle speech for a record
  const toggleSpeech = useCallback((record) => {
    if (speakingRecordId === record.id && isSpeaking) {
      stopSpeech();
    } else {
      speakRecord(record);
    }
  }, [speakingRecordId, isSpeaking, speakRecord, stopSpeech]);

  // ✅ Speak all records function with queue system
  const speakAllRecords = useCallback(() => {
    if (!isSpeechSupported || !isSpeechInitialized) {
      Swal.fire({
        title: 'Speech Not Available',
        text: speechError || 'Speech synthesis is not available.',
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

    stopSpeech();

    const speakNextRecord = (index) => {
      if (index >= recordsWithRunningTotals.length) {
        setSpeakingRecordId(null);
        
        // Speak summary at the end
        const summaryText = `End of records. Total ${recordsWithRunningTotals.length} records. Final remaining balance is ${formatNumberWithCommas(lastPrice)} rupees, that is ${numberToWords(lastPrice)}.`;
        speakText(summaryText);
        return;
      }

      const record = recordsWithRunningTotals[index];
      setSpeakingRecordId(record.id);
      
      const speechText = `Record ${index + 1} of ${recordsWithRunningTotals.length}. ${generateSpeechTextForSingle(record)}`;
      
      speakText(speechText, () => {
        speakNextRecord(index + 1);
      });
    };

    speakNextRecord(0);
  }, [recordsWithRunningTotals, lastPrice, isSpeechSupported, isSpeechInitialized, generateSpeechTextForSingle, speakText, stopSpeech, speechError]);

  // ✅ Speak summary function
  const speakSummary = useCallback(() => {
    if (!isSpeechSupported || !isSpeechInitialized) {
      Swal.fire({
        title: 'Speech Not Available',
        text: speechError || 'Speech synthesis is not available.',
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

    stopSpeech();

    let summaryText = `Summary for ${selectedKhata || 'All Khatas'}. `;
    summaryText += `Total records: ${recordsWithRunningTotals.length}. `;
    summaryText += `Total all pieces: ${lastTotalPieces}. `;
    summaryText += `Total price or weight: ${formatNumberWithCommas(lastSinglePiecePriceTotal)}. `;
    summaryText += `Final remaining balance: ${formatNumberWithCommas(lastPrice)} rupees, that is ${numberToWords(lastPrice)}.`;

    speakText(summaryText);
  }, [selectedKhata, recordsWithRunningTotals, lastTotalPieces, lastSinglePiecePriceTotal, lastPrice, isSpeechSupported, isSpeechInitialized, speakText, stopSpeech, speechError]);

  // ✅ Refresh voices function
  const refreshVoices = useCallback(() => {
    if ('speechSynthesis' in window) {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      if (voices.length === 0) {
        setSpeechError('No voices found. Please check your system speech settings.');
      } else {
        setSpeechError(null);
        if (!selectedVoice) {
          setSelectedVoice(voices[0]);
        }
      }
    }
  }, [selectedVoice]);

  // ✅ Handle voice selection
  const handleVoiceChange = useCallback((event) => {
    const voiceName = event.target.value;
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
    }
  }, [availableVoices]);

  // ✅ Scroll to Top Function
  const scrollToTop = useCallback(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  // ✅ Scroll to Bottom Function
  const scrollToBottom = useCallback(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: tableContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // ✅ Handle scroll event
  const handleScroll = useCallback(() => {
    if (tableContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
      setShowScrollTop(scrollTop > 100);
      setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 100);
    }
  }, []);

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
  }, [recordsWithRunningTotals.length, handleScroll]);

  // ✅ Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

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

  // ✅ PDF Download function (keep as is)
  const handleDownloadPDF = async () => {
    // ... (keep existing PDF download code)
  };

  // ✅ Styles
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

  return (
    <>
      <style>{pulseAnimation}</style>

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

      {/* 🔊 Enhanced Voice Controls with Offline Support */}
      {isSpeechSupported && (
        <div className="voice-controls mb-4 p-3 bg-light rounded shadow-sm">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="row mb-3">
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
                  <div className="text-center small">{speechRate.toFixed(1)}x</div>
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
                  <div className="text-center small">{speechPitch.toFixed(1)}</div>
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
                  <div className="text-center small">{speechVolume.toFixed(1)}</div>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Voice Selection</label>
                  <select 
                    className="form-select form-select-sm" 
                    value={selectedVoice?.name || ''}
                    onChange={handleVoiceChange}
                    disabled={!isSpeechInitialized}
                  >
                    {availableVoices.map((voice, index) => (
                      <option key={index} value={voice.name}>
                        {voice.name} ({voice.lang}) {voice.localService ? '(Local)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={refreshVoices}
                    title="Refresh available voices"
                  >
                    🔄 Refresh Voices
                  </button>
                </div>
              </div>
              
              {speechError && (
                <div className="alert alert-warning mt-2 py-2 small" role="alert">
                  ⚠️ {speechError}
                </div>
              )}
              
              {isOfflineMode && (
                <div className="alert alert-info mt-2 py-2 small" role="alert">
                  🌐 Offline Mode - Using local system voices
                </div>
              )}
            </div>
            
            <div className="col-md-4">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary"
                  onClick={speakSummary}
                  disabled={recordsWithRunningTotals.length === 0 || !isSpeechInitialized}
                >
                  📊 Speak Summary
                </button>
                <button
                  className="btn btn-info"
                  onClick={speakAllRecords}
                  disabled={recordsWithRunningTotals.length === 0 || isSpeaking || !isSpeechInitialized}
                >
                  {isSpeaking ? '🔊 Speaking...' : '🔊 Speak All Records'}
                </button>
                <button
                  className="btn btn-warning"
                  onClick={stopSpeech}
                  disabled={!isSpeaking}
                >
                  ⏹️ Stop Speech
                </button>
              </div>
              
              {currentSpeechText && (
                <div className="mt-2 p-2 bg-white border rounded small">
                  <div className="fw-bold">Currently Speaking:</div>
                  <div className="text-truncate" title={currentSpeechText}>
                    {currentSpeechText.substring(0, 80)}...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Filters (keep existing) */}
      <div className="search-container mb-3 d-flex gap-3 flex-wrap align-items-end">
        {/* ... existing filter code ... */}
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
                {!selectedKhata && <th style={TableHeadingStyle}>Khata Name</th>}
                <th style={TableHeadingStyle}>Name</th>
                <th style={TableHeadingStyle}>Price or Weight</th>
                <th style={TableHeadingStyle}>Total Price or Weight</th>
                <th style={TableHeadingStyle}>Medicine Pieces</th>
                <th style={TableHeadingStyle}>Total Medicines</th>
                <th style={TableHeadingStyle}>Feed Pieces</th>
                <th style={TableHeadingStyle}>Total Feeds</th>
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
                  <tr
                    key={record.id || index}
                    style={speakingRecordId === record.id ? SpeakingStyle : {}}
                  >
                    <td style={{ ...TableCellStyle, ...IndexStyle }}>{index + 1}</td>
                    {!selectedKhata && (
                      <td style={{ ...TableCellStyle, ...KhataStyle }}>
                        {record.khata_name}
                      </td>
                    )}
                    <td style={{ ...TableCellStyle, ...(record.isReturn ? ReturnStyle : {}) }}>
                      {record.formattedName}
                    </td>
                    <td style={{ ...TableCellStyle, ...CommonStyle }}>
                      {formatNumberWithCommas(record.single_piece_price)}
                    </td>
                    <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                      {formatNumberWithCommas(record.runningTotalSinglePiecePrice)}
                    </td>
                    <td style={{ ...TableCellStyle, ...CommonStyle }}>
                      {record.m_pieces}
                    </td>
                    <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                      {record.runningTotalMedicinePieces}
                    </td>
                    <td style={{ ...TableCellStyle, ...CommonStyle }}>
                      {record.total_piece}
                    </td>
                    <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                      {record.runningTotalFeedPieces}
                    </td>
                    <td style={{ ...TableCellStyle, ...CommonStyle }}>
                      {record.o_pieces}
                    </td>
                    <td style={{ ...TableCellStyle, ...SumOfTotalStyle }} className="fw-bold">
                      {record.runningTotalOtherPieces}
                    </td>
                    <td style={{ ...TableCellStyle, ...GivenDuesStyle }}>
                      {record.given_dues ? formatNumberWithCommas(record.given_dues) : '0'}
                    </td>
                    <td style={{ ...TableCellStyle, ...TakenDuesStyle }}>
                      {record.taken_dues ? formatNumberWithCommas(record.taken_dues) : '0'}
                    </td>
                    <td
                      style={{
                        ...TableCellStyle,
                        ...getPriceColorStyle(record.runningTotal)
                      }}
                      className="fw-bold"
                    >
                      {formatNumberWithCommas(record.runningTotal)}
                    </td>
                    <td style={TableCellStyle}>
                      {formatDate(record.date)}
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
                      {isSpeechSupported && isSpeechInitialized && (
                        <button
                          className={`btn ${speakingRecordId === record.id ? 'btn-warning' : 'btn-info'}`}
                          onClick={() => toggleSpeech(record)}
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.8rem',
                            minWidth: '60px',
                          }}
                          title={speakingRecordId === record.id ? 'Stop speaking this record' : 'Speak this record'}
                          disabled={isSpeaking && speakingRecordId !== record.id}
                        >
                          {speakingRecordId === record.id ? '⏹️ Stop' : '🔊 Speak'}
                        </button>
                      )}
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