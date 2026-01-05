import React, { useState, useMemo, useRef, useEffect } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2';
import { useSalerProductQuery, useDeleteSalerProductMutation } from '../redux/features/SalerProductApi/salerProductApi';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

const SalerRecord = () => {
  const { data, isLoading, isError, refetch } = useSalerProductQuery();
  const [deleteSalerProduct] = useDeleteSalerProductMutation();

  const [selectedYear, setSelectedYear] = useState(null);
  const [searchProductName, setSearchProductName] = useState('');
  const [searchProductPlace, setSearchProductPlace] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchMonth, setSearchMonth] = useState(''); // New state for month search
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'ascending' });
  const [viewMode, setViewMode] = useState('detailed');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [isStickySearch, setIsStickySearch] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const tableRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const searchContainerRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Month names array for dropdown
  const monthNames = [
    'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ✅ Get month number from month name
  const getMonthNumber = (monthName) => {
    return monthNames.indexOf(monthName);
  };

  // ✅ Group data by year and sort each year's records by date (ascending)
  const groupDataByYear = (data) => {
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    return sortedData.reduce((acc, record) => {
      const year = new Date(record.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(record);
      return acc;
    }, {});
  };

  // ✅ Get sorted years in descending order
  const getSortedYears = (yearlyData) => {
    return Object.keys(yearlyData).sort((a, b) => b - a);
  };

  // ✅ Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-CA', options).format(new Date(dateString));
  };

  // ✅ Format date for PDF
  const formatDateForPDF = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ✅ Get month name from date
  const getMonthFromDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return monthNames[date.getMonth() + 1]; // +1 because index 0 is "All Months"
  };

  // ✅ Group records by Product Name and Product Place
  const getSummaryByProductAndPlace = (records) => {
    const summaryMap = {};

    records.forEach(record => {
      const key = `${record.product_name}_${record.product_place}`;

      if (!summaryMap[key]) {
        summaryMap[key] = {
          product_name: record.product_name,
          product_place: record.product_place,
          total_pieces: 0,
          total_product_price: 0,
          total_pieces_price: 0,
          records_count: 0,
          records: []
        };
      }

      summaryMap[key].total_pieces += parseInt(record.stock) || 0;
      summaryMap[key].total_product_price += parseFloat(record.product_price) || 0;
      summaryMap[key].total_pieces_price += parseFloat(record.pieces_price) || 0;
      summaryMap[key].records_count += 1;
      summaryMap[key].records.push(record);
    });

    return Object.values(summaryMap);
  };

  // ✅ Group records by Product Name only (across all places)
  const getSummaryByProduct = (records) => {
    const summaryMap = {};

    records.forEach(record => {
      const productName = record.product_name;

      if (!summaryMap[productName]) {
        summaryMap[productName] = {
          product_name: productName,
          total_pieces: 0,
          total_product_price: 0,
          total_pieces_price: 0,
          records_count: 0,
          unique_places: new Set(),
          records: []
        };
      }

      summaryMap[productName].total_pieces += parseInt(record.stock) || 0;
      summaryMap[productName].total_product_price += parseFloat(record.product_price) || 0;
      summaryMap[productName].total_pieces_price += parseFloat(record.pieces_price) || 0;
      summaryMap[productName].records_count += 1;
      summaryMap[productName].unique_places.add(record.product_place);
      summaryMap[productName].records.push(record);
    });

    return Object.values(summaryMap).map(summary => ({
      ...summary,
      unique_places_count: summary.unique_places.size,
      unique_places_list: Array.from(summary.unique_places)
    }));
  };

  // ✅ Handle Delete
  const handleDelete = async (id) => {
    try {
      await deleteSalerProduct(id).unwrap();

      const storedRecords = JSON.parse(localStorage.getItem('profitEntries')) || [];
      const updatedRecords = storedRecords.filter(record => record.id !== id);
      localStorage.setItem('profitEntries', JSON.stringify(updatedRecords));

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

  // ✅ Handle sort
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // ✅ Sort detailed records
  const sortRecords = (records) => {
    if (!records || records.length === 0) return [];

    const sortedRecords = [...records].sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.key === 'product_name') {
        const nameA = a.product_name?.toLowerCase() || '';
        const nameB = b.product_name?.toLowerCase() || '';
        return sortConfig.direction === 'ascending'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else if (sortConfig.key === 'product_price') {
        const priceA = parseFloat(a.product_price) || 0;
        const priceB = parseFloat(b.product_price) || 0;
        return sortConfig.direction === 'ascending' ? priceA - priceB : priceB - priceA;
      } else if (sortConfig.key === 'product_place') {
        const placeA = a.product_place?.toLowerCase() || '';
        const placeB = b.product_place?.toLowerCase() || '';
        return sortConfig.direction === 'ascending'
          ? placeA.localeCompare(placeB)
          : placeB.localeCompare(placeA);
      }
      return 0;
    });

    return sortedRecords;
  };

  // ✅ Sort summary data by product and place
  const sortSummaryByProductAndPlace = (summaryData) => {
    if (!summaryData || summaryData.length === 0) return [];

    const sortedSummary = [...summaryData].sort((a, b) => {
      if (sortConfig.key === 'product_name') {
        const nameA = a.product_name?.toLowerCase() || '';
        const nameB = b.product_name?.toLowerCase() || '';
        return sortConfig.direction === 'ascending'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else if (sortConfig.key === 'product_place') {
        const placeA = a.product_place?.toLowerCase() || '';
        const placeB = b.product_place?.toLowerCase() || '';
        return sortConfig.direction === 'ascending'
          ? placeA.localeCompare(placeB)
          : placeB.localeCompare(placeA);
      } else if (sortConfig.key === 'total_pieces') {
        return sortConfig.direction === 'ascending'
          ? a.total_pieces - b.total_pieces
          : b.total_pieces - a.total_pieces;
      } else if (sortConfig.key === 'total_product_price') {
        return sortConfig.direction === 'ascending'
          ? a.total_product_price - b.total_product_price
          : b.total_product_price - a.total_product_price;
      }
      return 0;
    });

    return sortedSummary;
  };

  // ✅ Sort summary data by product only
  const sortSummaryByProduct = (summaryData) => {
    if (!summaryData || summaryData.length === 0) return [];

    const sortedSummary = [...summaryData].sort((a, b) => {
      if (sortConfig.key === 'product_name') {
        const nameA = a.product_name?.toLowerCase() || '';
        const nameB = b.product_name?.toLowerCase() || '';
        return sortConfig.direction === 'ascending'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else if (sortConfig.key === 'total_pieces') {
        return sortConfig.direction === 'ascending'
          ? a.total_pieces - b.total_pieces
          : b.total_pieces - a.total_pieces;
      } else if (sortConfig.key === 'total_product_price') {
        return sortConfig.direction === 'ascending'
          ? a.total_product_price - b.total_product_price
          : b.total_product_price - a.total_product_price;
      } else if (sortConfig.key === 'unique_places_count') {
        return sortConfig.direction === 'ascending'
          ? a.unique_places_count - b.unique_places_count
          : b.unique_places_count - a.unique_places_count;
      }
      return 0;
    });

    return sortedSummary;
  };

  // ✅ Get unique months from records
  const getUniqueMonths = (records) => {
    const monthsSet = new Set();
    records.forEach(record => {
      const monthName = getMonthFromDate(record.date);
      if (monthName) {
        monthsSet.add(monthName);
      }
    });
    return ['All Months', ...Array.from(monthsSet).sort((a, b) =>
      monthNames.indexOf(a) - monthNames.indexOf(b)
    )];
  };

  // ✅ PDF Export Functions
  const exportToPDF = () => {
    setIsExportingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFontSize(20);
      doc.setTextColor(244, 67, 54);
      doc.text(`Saler Records Report - ${selectedYear}`, 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 22);

      // Add filter info
      let filterInfo = '';
      if (searchProductName) filterInfo += `Product: ${searchProductName} `;
      if (searchProductPlace) filterInfo += `Place: ${searchProductPlace} `;
      if (searchDate) filterInfo += `Date: ${searchDate} `;
      if (searchMonth && searchMonth !== 'All Months') filterInfo += `Month: ${searchMonth} `;

      if (filterInfo) {
        doc.text(`Filters Applied: ${filterInfo}`, 14, 28);
      }

      // View Mode Info
      doc.text(`View Mode: ${getViewModeText(viewMode)}`, 14, 34);

      // Data based on view mode
      let tableData = [];
      let headers = [];
      let columnStyles = {};

      switch (viewMode) {
        case 'detailed':
          headers = [['#', 'Product Name', 'Product Place', 'Product Price', 'Pieces Price', 'Pieces', 'Date', 'Month']];
          columnStyles = {
            0: { cellWidth: 10 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: 25 },
            7: { cellWidth: 25 }
          };

          filteredRecords.forEach((record, index) => {
            tableData.push([
              index + 1,
              record.product_name || '-',
              record.product_place || '-',
              `Rs: ${parseFloat(record.product_price || 0).toFixed(2)}`,
              `Rs: ${parseFloat(record.pieces_price || 0).toFixed(2)}`,
              record.stock || '0',
              formatDateForPDF(record.date),
              getMonthFromDate(record.date)
            ]);
          });
          break;

        case 'summaryByProductAndPlace':
          headers = [['#', 'Product Name', 'Product Place', 'Total Product Value', 'Total Pieces Price', 'Total Pieces', 'Records Count']];
          columnStyles = {
            0: { cellWidth: 10 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 }
          };

          summaryByProductAndPlace.forEach((summary, index) => {
            tableData.push([
              index + 1,
              summary.product_name,
              summary.product_place,
              `Rs: ${summary.total_product_price.toFixed(2)}`,
              `Rs: ${summary.total_pieces_price.toFixed(2)}`,
              summary.total_pieces,
              summary.records_count
            ]);
          });
          break;

        case 'summaryByProduct':
          headers = [['#', 'Product Name', 'Different Places', 'Total Product Value', 'Total Pieces Price', 'Total Pieces', 'Records Count']];
          columnStyles = {
            0: { cellWidth: 10 },
            2: { cellWidth: 40 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 }
          };

          summaryByProduct.forEach((summary, index) => {
            tableData.push([
              index + 1,
              summary.product_name,
              `${summary.unique_places_count} places: ${summary.unique_places_list.join(', ')}`,
              `Rs: ${summary.total_product_price.toFixed(2)}`,
              `Rs: ${summary.total_pieces_price.toFixed(2)}`,
              summary.total_pieces,
              summary.records_count
            ]);
          });
          break;
      }

      // Generate table
      autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: {
          fillColor: [244, 67, 54],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: columnStyles,
        margin: { left: 14, right: 14 },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        didDrawPage: function (data) {
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      // Add summary section
      const finalY = doc.lastAutoTable.finalY + 10;

      if (finalY < 180) { // Ensure we have space for summary
        doc.setFontSize(12);
        doc.setTextColor(244, 67, 54);
        doc.text('Summary', 14, finalY + 5);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const summaryData = [
          [`Total Records: ${filteredRecords.length}`],
          [`Total Product Value: Rs: ${filteredRecords.reduce((sum, record) => sum + (parseFloat(record.product_price) || 0), 0).toFixed(2)}`],
          [`Total Pieces Price: Rs: ${filteredRecords.reduce((sum, record) => sum + (parseFloat(record.pieces_price) || 0), 0).toFixed(2)}`],
          [`Total Pieces: ${filteredRecords.reduce((sum, record) => sum + (parseInt(record.stock) || 0), 0)}`]
        ];

        autoTable(doc, {
          body: summaryData,
          startY: finalY + 10,
          theme: 'plain',
          margin: { left: 14, right: 14 },
          styles: {
            fontSize: 10,
            fontStyle: 'bold',
            cellPadding: 5
          }
        });
      }

      // Save PDF
      const fileName = `Saler_Records_${selectedYear}_${viewMode}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      Swal.fire({
        title: 'PDF Generated!',
        text: `Report saved as ${fileName}`,
        icon: 'success',
        confirmButtonText: 'Ok',
        timer: 2000
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate PDF. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportAllToPDF = () => {
    setIsExportingPDF(true);

    try {
      Swal.fire({
        title: 'Exporting All Years',
        text: 'Generating PDF for all years...',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let currentY = 15;
      let pageNumber = 1;

      // Main title
      doc.setFontSize(22);
      doc.setTextColor(244, 67, 54);
      doc.text('Complete Saler Records Report', 105, currentY, { align: 'center' });

      currentY += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, currentY, { align: 'center' });

      currentY += 15;

      // Loop through each year
      sortedYears.forEach((year, yearIndex) => {
        const yearRecords = yearlyData[year];
        const yearTotal = yearRecords.length;

        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage();
          pageNumber++;
          currentY = 15;
        }

        // Year header
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(`Year: ${year} (${yearTotal} records)`, 14, currentY);
        currentY += 10;

        // Calculate yearly totals
        const yearProductTotal = yearRecords.reduce((sum, record) => sum + (parseFloat(record.product_price) || 0), 0);
        const yearPiecesTotal = yearRecords.reduce((sum, record) => sum + (parseFloat(record.pieces_price) || 0), 0);
        const yearStockTotal = yearRecords.reduce((sum, record) => sum + (parseInt(record.stock) || 0), 0);

        // Year summary
        doc.setFontSize(10);
        doc.text(`Yearly Summary:`, 14, currentY);
        currentY += 6;
        doc.text(`  • Total Product Value: Rs: ${yearProductTotal.toFixed(2)}`, 20, currentY);
        currentY += 6;
        doc.text(`  • Total Pieces Price: Rs: ${yearPiecesTotal.toFixed(2)}`, 20, currentY);
        currentY += 6;
        doc.text(`  • Total Pieces: ${yearStockTotal}`, 20, currentY);
        currentY += 10;

        // Create table data for this year (limited to 10 records per year in overview)
        const tableData = yearRecords.slice(0, 10).map((record, index) => [
          index + 1,
          record.product_name?.substring(0, 20) || '-',
          record.product_place?.substring(0, 15) || '-',
          `Rs: ${parseFloat(record.product_price || 0).toFixed(2)}`,
          record.stock || '0',
          formatDateForPDF(record.date),
          getMonthFromDate(record.date)
        ]);

        if (yearRecords.length > 10) {
          tableData.push(['...', `... and ${yearRecords.length - 10} more records`, '', '', '', '', '']);
        }

        // Generate table for this year
        autoTable(doc, {
          head: [['#', 'Product Name', 'Product Place', 'Price', 'Pieces', 'Date', 'Month']],
          body: tableData,
          startY: currentY,
          theme: 'grid',
          headStyles: {
            fillColor: [100, 100, 100],
            textColor: [255, 255, 255]
          },
          margin: { left: 14, right: 14 },
          styles: {
            fontSize: 8,
            cellPadding: 2
          }
        });

        currentY = doc.lastAutoTable.finalY + 15;
      });

      // Add final summary page
      doc.addPage();
      currentY = 15;

      doc.setFontSize(20);
      doc.setTextColor(244, 67, 54);
      doc.text('Grand Summary', 105, currentY, { align: 'center' });
      currentY += 15;

      // Calculate overall totals
      const allRecords = Object.values(yearlyData).flat();
      const totalRecords = allRecords.length;
      const totalProductValue = allRecords.reduce((sum, record) => sum + (parseFloat(record.product_price) || 0), 0);
      const totalPiecesPrice = allRecords.reduce((sum, record) => sum + (parseFloat(record.pieces_price) || 0), 0);
      const totalPieces = allRecords.reduce((sum, record) => sum + (parseInt(record.stock) || 0), 0);
      const uniqueProducts = [...new Set(allRecords.map(record => record.product_name))].length;
      const uniquePlaces = [...new Set(allRecords.map(record => record.product_place))].length;

      const summaryData = [
        ['Metric', 'Value'],
        ['Total Years', sortedYears.length],
        ['Total Records', totalRecords],
        ['Unique Products', uniqueProducts],
        ['Unique Places', uniquePlaces],
        ['Total Product Value', `Rs: ${totalProductValue.toFixed(2)}`],
        ['Total Pieces Price', `Rs: ${totalPiecesPrice.toFixed(2)}`],
        ['Total Pieces Sold', totalPieces],
        ['Average per Record', `Rs: ${(totalProductValue / totalRecords).toFixed(2)}`]
      ];

      autoTable(doc, {
        body: summaryData,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [244, 67, 54],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 50, right: 50 },
        styles: {
          fontSize: 11,
          cellPadding: 5,
          halign: 'center'
        }
      });

      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Report generated by Saler Management System - Page ${doc.internal.getNumberOfPages()}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });

      // Save PDF
      const fileName = `Complete_Saler_Records_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      Swal.fire({
        title: 'Complete Report Generated!',
        text: `Report saved as ${fileName}`,
        icon: 'success',
        confirmButtonText: 'Ok',
        timer: 3000
      });

    } catch (error) {
      console.error('Error generating complete PDF:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate complete report. Please try again.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportSelectedToPDF = () => {
    if (filteredRecords.length === 0) {
      Swal.fire({
        title: 'No Data!',
        text: 'There are no records to export.',
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return;
    }

    Swal.fire({
      title: 'Export Options',
      html: `
        <div style="text-align: center; padding: 10px;">
          <p><strong>Export Current View:</strong> ${filteredRecords.length} records</p>
          <p><strong>View Mode:</strong> ${getViewModeText(viewMode)}</p>
          <p><strong>Filters Applied:</strong> ${searchProductName || searchProductPlace || searchDate || (searchMonth && searchMonth !== 'All Months') ? 'Yes' : 'No'}</p>
        </div>
      `,
      showCancelButton: false,
      confirmButtonText: 'Export Current View',
      cancelButtonText: 'Export All Years',
      showDenyButton: true,
      denyButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        confirmButton: 'btn btn-danger me-2',
        cancelButton: 'btn btn-primary me-2',
        denyButton: 'btn btn-success me-2'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        exportToPDF();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        exportAllToPDF();
      }
    });
  };

  // Helper function to get view mode text
  const getViewModeText = (mode) => {
    switch (mode) {
      case 'detailed': return 'Detailed View';
      case 'summaryByProductAndPlace': return 'Summary by Product & Place';
      case 'summaryByProduct': return 'Summary by Product Only';
      default: return mode;
    }
  };

  // ✅ Auto Scroll Functions
  const startAutoScroll = () => {
    if (!tableContainerRef.current || isAutoScrolling) return;

    setIsAutoScrolling(true);
    const container = tableContainerRef.current;
    const scrollStep = scrollDirection === 'down' ? scrollSpeed * 5 : -scrollSpeed * 5;

    scrollIntervalRef.current = setInterval(() => {
      if (scrollDirection === 'down') {
        if (container.scrollTop >= container.scrollHeight - container.clientHeight - 10) {
          setScrollDirection('up');
          clearInterval(scrollIntervalRef.current);
          startAutoScroll();
          return;
        }
      } else {
        if (container.scrollTop <= 10) {
          setScrollDirection('down');
          clearInterval(scrollIntervalRef.current);
          startAutoScroll();
          return;
        }
      }

      container.scrollTop += scrollStep;
    }, 50);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsAutoScrolling(false);
  };

  const toggleAutoScroll = () => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  };

  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setScrollDirection('down');
      if (isAutoScrolling) {
        stopAutoScroll();
        startAutoScroll();
      }
    }
  };

  const scrollToBottom = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: tableContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setScrollDirection('up');
      if (isAutoScrolling) {
        stopAutoScroll();
        startAutoScroll();
      }
    }
  };

  // Handle scroll to show/hide scroll button
  const handleScroll = () => {
    if (tableContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
      setShowScrollButton(scrollHeight > clientHeight + 100);

      if (scrollTop <= 10) {
        setScrollDirection('down');
      } else if (scrollTop >= scrollHeight - clientHeight - 10) {
        setScrollDirection('up');
      }
    }
  };

  // Handle search container sticky
  const handleTableScroll = () => {
    if (tableContainerRef.current) {
      setIsStickySearch(tableContainerRef.current.scrollTop > 50);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Memoize computed values
  const yearlyData = useMemo(() => data ? groupDataByYear(data) : {}, [data]);
  const sortedYears = useMemo(() => getSortedYears(yearlyData), [yearlyData]);

  // ✅ Records of selected year
  const records = selectedYear ? yearlyData[selectedYear] || [] : [];

  // ✅ Get unique months for the selected year
  const uniqueMonths = useMemo(() => {
    return getUniqueMonths(records);
  }, [records]);

  // ✅ Filter records by name, place, date & month
  const filteredRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      const matchesProductName = record.product_name?.toLowerCase().includes(searchProductName.toLowerCase());
      const matchesProductPlace = record.product_place?.toLowerCase().includes(searchProductPlace.toLowerCase());
      const matchesDate = searchDate ? formatDate(record.date) === searchDate : true;

      // Month filter logic
      let matchesMonth = true;
      if (searchMonth && searchMonth !== 'All Months') {
        const recordMonth = getMonthFromDate(record.date);
        matchesMonth = recordMonth === searchMonth;
      }

      return matchesProductName && matchesProductPlace && matchesDate && matchesMonth;
    });
    return sortRecords(filtered);
  }, [records, searchProductName, searchProductPlace, searchDate, searchMonth, sortConfig]);

  // ✅ Calculate summary data based on view mode
  const summaryByProductAndPlace = useMemo(() => {
    const summary = getSummaryByProductAndPlace(filteredRecords);
    return sortSummaryByProductAndPlace(summary);
  }, [filteredRecords, sortConfig]);

  const summaryByProduct = useMemo(() => {
    const summary = getSummaryByProduct(filteredRecords);
    return sortSummaryByProduct(summary);
  }, [filteredRecords, sortConfig]);

  // ✅ Get unique product places for dropdown
  const uniqueProductPlaces = useMemo(() => {
    const places = new Set();
    records.forEach(record => {
      if (record.product_place) {
        places.add(record.product_place);
      }
    });
    return Array.from(places).sort();
  }, [records]);

  // ✅ Get unique product names for dropdown
  const uniqueProductNames = useMemo(() => {
    const names = new Set();
    records.forEach(record => {
      if (record.product_name) {
        names.add(record.product_name);
      }
    });
    return Array.from(names).sort();
  }, [records]);

  // ✅ Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  const fontColorStyle = { color: 'rgb(244, 67, 54)' };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading data.</p>;

  return (
    <>
      {!selectedYear ? (
        <>
          <div className="d-flex flex-column justify-content-between align-items-center my-4">
            <h1 className='gradient_text mb-0'>
              SALES ALL YEAR RECORD
            </h1>
            <button
              className="btn delete_btn mt-3"
              onClick={exportAllToPDF}
              disabled={isExportingPDF}
            >
              {isExportingPDF ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Generating PDF...
                </>
              ) : (
                '📄 Export All Years to PDF'
              )}
            </button>
          </div>
          <div className='responsive_card'>
            {sortedYears.map((year) => (
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
          <div className="d-flex flex-column justify-content-center align-items-center my-4">
            <h1 className='year_record_table gradient_text mb-0'>
              SALER RECORD DETAILS ({selectedYear})
            </h1>
            <div>
              <button
                className="btn btn-outline-danger me-2 mt-3"
                onClick={() => setSelectedYear(null)}
              >
                ← Back to All Years
              </button>

            </div>
          </div>

          {/* 📊 Quick Stats */}
          {filteredRecords.length > 0 && (
            <div className="px-3">
              <div className="row">
                <div className="col-md-3">
                  <div className="card text-white bg-primary mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Records</h5>
                      <p className="card-text fs-4">{filteredRecords.length}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-success mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Product Value</h5>
                      <p className="card-text fs-4">
                        Rs: {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.product_price) || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-warning mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Pieces Price</h5>
                      <p className="card-text fs-4">
                        Rs: {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.pieces_price) || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-info mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Pieces</h5>
                      <p className="card-text fs-4">
                        {filteredRecords.reduce((sum, record) => sum + (parseInt(record.stock) || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 📊 View Mode Toggle */}
              <div className="row mb-3">
                <div className="col-12">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${viewMode === 'detailed' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => setViewMode('detailed')}
                    >
                      Detailed View
                    </button>
                    <button
                      type="button"
                      className={`btn ${viewMode === 'summaryByProductAndPlace' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => setViewMode('summaryByProductAndPlace')}
                    >
                      By Product & Place
                    </button>
                    <button
                      type="button"
                      className={`btn ${viewMode === 'summaryByProduct' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => setViewMode('summaryByProduct')}
                    >
                      By Product Only
                    </button>
                  </div>
                  <small className="text-muted ms-3">
                    {viewMode === 'detailed' && `Showing ${filteredRecords.length} individual records`}
                    {viewMode === 'summaryByProductAndPlace' && `Showing ${summaryByProductAndPlace.length} unique product-location combinations`}
                    {viewMode === 'summaryByProduct' && `Showing ${summaryByProduct.length} unique products across different places`}
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* 🔍 Search Filters - Sticky when scrolling */}
          <div
            ref={searchContainerRef}
            className={`search-container px-3 d-flex justify-content-start align-items-center flex-wrap mb-3 ${isStickySearch ? 'sticky-search' : ''}`}
            style={{
              position: isStickySearch ? 'sticky' : 'relative',
              top: isStickySearch ? '0' : 'auto',
              zIndex: 1000,
              backgroundColor: isStickySearch ? 'white' : 'transparent',
              padding: isStickySearch ? '10px' : '0',
              boxShadow: isStickySearch ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="form-group mt-2 me-3">
              <label htmlFor="productSearch">Search by Product Name:</label>
              <input
                id="productSearch"
                type="text"
                className="form-control"
                placeholder="Enter product name"
                value={searchProductName}
                onChange={(e) => setSearchProductName(e.target.value)}
                list="nameSuggestions"
              />
              <datalist id="nameSuggestions">
                {uniqueProductNames.map((name, index) => (
                  <option key={index} value={name} />
                ))}
              </datalist>
            </div>
            <div className="form-group mt-2 me-3">
              <label htmlFor="placeSearch">Search by Product Place:</label>
              <div className="input-group">
                <input
                  id="placeSearch"
                  type="text"
                  className="form-control"
                  placeholder="Enter product place"
                  value={searchProductPlace}
                  onChange={(e) => setSearchProductPlace(e.target.value)}
                  list="placeSuggestions"
                />
                <datalist id="placeSuggestions">
                  {uniqueProductPlaces.map((place, index) => (
                    <option key={index} value={place} />
                  ))}
                </datalist>
                {searchProductPlace && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchProductPlace('')}
                    title="Clear place filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="form-group mt-2 me-3">
              <label htmlFor="dateSearch">Search by Date:</label>
              <input
                id="dateSearch"
                type="date"
                className="form-control"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
            <div className="form-group mt-2 me-3">
              <label htmlFor="monthSearch">Search by Month:</label>
              <select
                id="monthSearch"
                className="form-control"
                value={searchMonth}
                onChange={(e) => setSearchMonth(e.target.value)}
              >
                {uniqueMonths.map((month, index) => (
                  <option key={index} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group mt-2">
              <button
                className="btn btn-outline-danger mt-4"
                onClick={() => {
                  setSearchProductName('');
                  setSearchProductPlace('');
                  setSearchDate('');
                  setSearchMonth('All Months');
                }}
              >
                Clear All Filters
              </button>
              <button
                className="btn delete_btn mt-4 ms-3"
                onClick={exportSelectedToPDF}
                disabled={isExportingPDF}
              >
                {isExportingPDF ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Exporting...
                  </>
                ) : (
                  '📄 Export to PDF'
                )}
              </button>
            </div>
          </div>

          {/* 📊 Filter Status */}
          {(searchProductName || searchProductPlace || searchDate || (searchMonth && searchMonth !== 'All Months')) && (
            <div className="px-3 mt-2">
              <div className="alert alert-light border d-flex justify-content-between align-items-center">
                <div>
                  <strong>Active Filters:</strong>
                  {searchProductName && (
                    <span className="badge bg-primary ms-2">
                      Product Name: {searchProductName}
                      <button
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => setSearchProductName('')}
                        aria-label="Remove"
                      ></button>
                    </span>
                  )}
                  {searchProductPlace && (
                    <span className="badge bg-success ms-2">
                      Product Place: {searchProductPlace}
                      <button
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => setSearchProductPlace('')}
                        aria-label="Remove"
                      ></button>
                    </span>
                  )}
                  {searchDate && (
                    <span className="badge bg-warning ms-2">
                      Date: {searchDate}
                      <button
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => setSearchDate('')}
                        aria-label="Remove"
                      ></button>
                    </span>
                  )}
                  {searchMonth && searchMonth !== 'All Months' && (
                    <span className="badge bg-info ms-2">
                      Month: {searchMonth}
                      <button
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => setSearchMonth('All Months')}
                        aria-label="Remove"
                      ></button>
                    </span>
                  )}
                </div>
                <div>
                  <span className="badge bg-info">
                    Showing {
                      viewMode === 'detailed' ? filteredRecords.length :
                        viewMode === 'summaryByProductAndPlace' ? summaryByProductAndPlace.length :
                          summaryByProduct.length
                    } items
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 🧾 Table Container with Scroll Controls */}
          <div
            className='table-container p-3 mt-3 ms-3 position-relative'
            ref={tableContainerRef}
            onScroll={() => {
              handleScroll();
              handleTableScroll();
            }}
            style={{
              maxHeight: '600px',
              overflowY: 'auto',
              borderRadius: '10px',
              position: 'relative'
            }}
          >
            {/* 🧾 Table - Detailed View */}
            {viewMode === 'detailed' && (
              <table className='table table-bordered table-hover form_div' style={{ borderRadius: '10px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                  <tr>
                    <th style={{ backgroundColor: '#f44336', color: 'white' }}>#</th>
                    <th
                      style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                      onClick={() => handleSort('product_name')}
                    >
                      Product Name{<SortIndicator columnKey="product_name" />}
                    </th>
                    <th
                      style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                      onClick={() => handleSort('product_place')}
                    >
                      Product Place{<SortIndicator columnKey="product_place" />}
                    </th>
                    <th
                      style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                      onClick={() => handleSort('product_price')}
                    >
                      Product Price{<SortIndicator columnKey="product_price" />}
                    </th>
                    <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces Price</th>
                    <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces</th>
                    <th
                      style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                      onClick={() => handleSort('date')}
                    >
                      Date{<SortIndicator columnKey="date" />}
                    </th>
                    <th style={{ backgroundColor: '#f44336', color: 'white' }}>Month</th>
                    <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id || index}>
                      <td>{index + 1}</td>
                      <td>{record.product_name}</td>
                      <td>{record.product_place}</td>
                      <td>Rs: {parseFloat(record.product_price).toFixed(2)}</td>
                      <td>Rs: {parseFloat(record.pieces_price).toFixed(2)}</td>
                      <td>{record.stock}</td>
                      <td>{formatDate(record.date)}</td>
                      <td>{getMonthFromDate(record.date)}</td>
                      <td>
                        <Link to={`/updatesalerproduct/${record.id}`} className="update_btn me-3">
                          Update
                        </Link>
                        <button
                          className="delete_btn"
                          onClick={() => {
                            Swal.fire({
                              title: 'Are you sure?',
                              text: "You won't be able to revert this!",
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#d33',
                              cancelButtonColor: '#3085d6',
                              confirmButtonText: 'Yes, delete it!',
                              cancelButtonText: 'Cancel'
                            }).then((result) => {
                              if (result.isConfirmed) {
                                handleDelete(record.id);
                              }
                            });
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <div className="alert alert-warning mb-0">
                          No records found
                          {(searchProductName || searchProductPlace || searchDate || (searchMonth && searchMonth !== 'All Months')) && " for the current filters"}
                          {!searchProductName && !searchProductPlace && !searchDate && (!searchMonth || searchMonth === 'All Months') && " for the selected year"}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredRecords.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong style={fontColorStyle}>Total Rs:</strong></td>
                      <td>
                        <strong>
                          Rs: {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.product_price) || 0), 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <strong>
                          Rs: {filteredRecords.reduce((sum, record) => sum + (parseFloat(record.pieces_price) || 0), 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <strong>
                          {filteredRecords.reduce((sum, record) => sum + (parseInt(record.stock) || 0), 0)}
                        </strong>
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}

            {/* 📊 Summary View - Grouped by Product and Place */}
            {viewMode === 'summaryByProductAndPlace' && (
              <>
                <div className="alert alert-info mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  This view groups records by Product Name and Product Place to show totals for each combination.
                </div>
                <table className='table table-bordered table-hover form_div' style={{ borderRadius: '10px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                    <tr>
                      <th style={{ backgroundColor: '#f44336', color: 'white' }}>#</th>
                      <th
                        style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                        onClick={() => handleSort('product_name')}
                      >
                        Product Name{<SortIndicator columnKey="product_name" />}
                      </th>
                      <th
                        style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                        onClick={() => handleSort('product_place')}
                      >
                        Product Place{<SortIndicator columnKey="product_place" />}
                      </th>
                      <th
                        style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                        onClick={() => handleSort('total_product_price')}
                      >
                        Total Product Value{<SortIndicator columnKey="total_product_price" />}
                      </th>
                      <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces Price</th>
                      <th
                        style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                        onClick={() => handleSort('total_pieces')}
                      >
                        Total Pieces{<SortIndicator columnKey="total_pieces" />}
                      </th>
                      <th style={{ backgroundColor: '#f44336', color: 'white' }}>Records Count</th>
                      <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryByProductAndPlace.map((summary, index) => (
                      <tr key={`${summary.product_name}_${summary.product_place}`}>
                        <td>{index + 1}</td>
                        <td>{summary.product_name}</td>
                        <td>{summary.product_place}</td>
                        <td>Rs: {summary.total_product_price.toFixed(2)}</td>
                        <td>Rs: {summary.total_pieces_price.toFixed(2)}</td>
                        <td>
                          <strong>{summary.total_pieces}</strong>
                          {summary.records_count > 1 && (
                            <small className="text-muted ms-2">
                              ({summary.records_count} records)
                            </small>
                          )}
                        </td>
                        <td>{summary.records_count}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger me-2"
                            onClick={() => {
                              Swal.fire({
                                title: `${summary.product_name} - ${summary.product_place}`,
                                html: `
                                  <div style="text-align: left;">
                                    <p><strong>Total Pieces:</strong> ${summary.total_pieces}</p>
                                    <p><strong>Total Product Value:</strong> Rs: ${summary.total_product_price.toFixed(2)}</p>
                                    <p><strong>Total Pieces Price:</strong> Rs: ${summary.total_pieces_price.toFixed(2)}</p>
                                    <p><strong>Number of Records:</strong> ${summary.records_count}</p>
                                    <hr>
                                    <h6>Individual Records:</h6>
                                    <ul>
                                      ${summary.records.map(r =>
                                  `<li>${formatDate(r.date)} (${getMonthFromDate(r.date)}): ${r.stock} pieces (Rs: ${parseFloat(r.product_price).toFixed(2)})</li>`
                                ).join('')}
                                    </ul>
                                  </div>
                                `,
                                icon: 'info',
                                confirmButtonText: 'Close',
                                width: '600px'
                              });
                            }}
                          >
                            📊 Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {summaryByProductAndPlace.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <div className="alert alert-warning mb-0">
                            No summary data found
                            {(searchProductName || searchProductPlace || searchDate || (searchMonth && searchMonth !== 'All Months')) && " for the current filters"}
                            {!searchProductName && !searchProductPlace && !searchDate && (!searchMonth || searchMonth === 'All Months') && " for the selected year"}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {summaryByProductAndPlace.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong style={fontColorStyle}>Grand Total:</strong></td>
                        <td>
                          <strong>
                            Rs: {summaryByProductAndPlace.reduce((sum, s) => sum + s.total_product_price, 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            Rs: {summaryByProductAndPlace.reduce((sum, s) => sum + s.total_pieces_price, 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {summaryByProductAndPlace.reduce((sum, s) => sum + s.total_pieces, 0)}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {summaryByProductAndPlace.reduce((sum, s) => sum + s.records_count, 0)}
                          </strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </>
            )}

            {/* 📊 Summary View - Grouped by Product Only */}
            {viewMode === 'summaryByProduct' && (
              <>
                <div className="alert alert-info mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  This view groups records by Product Name only, showing totals across all different places.
                </div>
                <table className='table table-bordered table-hover form_div' style={{ borderRadius: '10px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                    <tr>
                      <th style={{ backgroundColor: '#f44336', color: 'white' }}>#</th>
                      <th
                        style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                        onClick={() => handleSort('product_name')}
                      >
                        Product Name{<SortIndicator columnKey="product_name" />}
                      </th>
                      <th
                        style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                        onClick={() => handleSort('unique_places_count')}
                      >
                        Different Places{<SortIndicator columnKey="unique_places_count" />}
                      </th>
                      <th
                        style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                        onClick={() => handleSort('total_product_price')}
                      >
                        Total Product Value{<SortIndicator columnKey="total_product_price" />}
                      </th>
                      <th style={{ backgroundColor: '#f44336', color: 'white' }}>Total Pieces Price</th>
                      <th
                        style={{ backgroundColor: '#f44336', color: 'white', cursor: 'pointer' }}
                        onClick={() => handleSort('total_pieces')}
                      >
                        Total Pieces{<SortIndicator columnKey="total_pieces" />}
                      </th>
                      <th style={{ backgroundColor: '#f44336', color: 'white' }}>Records Count</th>
                      <th style={{ backgroundColor: '#f44336', color: 'white' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryByProduct.map((summary, index) => (
                      <tr key={summary.product_name}>
                        <td>{index + 1}</td>
                        <td>{summary.product_name}</td>
                        <td>
                          <span className="badge bg-info me-1">{summary.unique_places_count} places</span>
                          <small className="text-muted">
                            {summary.unique_places_list.slice(0, 3).join(', ')}
                            {summary.unique_places_list.length > 3 && ` and ${summary.unique_places_list.length - 3} more...`}
                          </small>
                        </td>
                        <td>Rs: {summary.total_product_price.toFixed(2)}</td>
                        <td>Rs: {summary.total_pieces_price.toFixed(2)}</td>
                        <td>
                          <strong>{summary.total_pieces}</strong>
                          {summary.records_count > 1 && (
                            <small className="text-muted ms-2">
                              ({summary.records_count} records)
                            </small>
                          )}
                        </td>
                        <td>{summary.records_count}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger me-2"
                            onClick={() => {
                              Swal.fire({
                                title: `${summary.product_name} - Across ${summary.unique_places_count} Places`,
                                html: `
                                  <div style="text-align: left;">
                                    <p><strong>Total Pieces:</strong> ${summary.total_pieces}</p>
                                    <p><strong>Total Product Value:</strong> Rs: ${summary.total_product_price.toFixed(2)}</p>
                                    <p><strong>Total Pieces Price:</strong> Rs: ${summary.total_pieces_price.toFixed(2)}</p>
                                    <p><strong>Number of Records:</strong> ${summary.records_count}</p>
                                    <p><strong>Different Places (${summary.unique_places_count}):</strong> ${summary.unique_places_list.join(', ')}</p>
                                    <hr>
                                    <h6>Records by Place:</h6>
                                    <ul>
                                      ${summary.records.map(r =>
                                  `<li>${formatDate(r.date)} (${getMonthFromDate(r.date)}) - ${r.product_place}: ${r.stock} pieces (Rs: ${parseFloat(r.product_price).toFixed(2)})</li>`
                                ).join('')}
                                    </ul>
                                  </div>
                                `,
                                icon: 'info',
                                confirmButtonText: 'Close',
                                width: '700px'
                              });
                            }}
                          >
                            📊 Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {summaryByProduct.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <div className="alert alert-warning mb-0">
                            No summary data found
                            {(searchProductName || searchProductPlace || searchDate || (searchMonth && searchMonth !== 'All Months')) && " for the current filters"}
                            {!searchProductName && !searchProductPlace && !searchDate && (!searchMonth || searchMonth === 'All Months') && " for the selected year"}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {summaryByProduct.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong style={fontColorStyle}>Grand Total:</strong></td>
                        <td>
                          <strong>
                            Rs: {summaryByProduct.reduce((sum, s) => sum + s.total_product_price, 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            Rs: {summaryByProduct.reduce((sum, s) => sum + s.total_pieces_price, 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {summaryByProduct.reduce((sum, s) => sum + s.total_pieces, 0)}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {summaryByProduct.reduce((sum, s) => sum + s.records_count, 0)}
                          </strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </>
            )}

            {/* 🔘 Auto Scroll Control Panel */}
            {showScrollButton && (
              <div className="scroll-control-panel" style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1050,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {/* Scroll Speed Controls */}
                <div className="btn-group" role="group" style={{
                  backgroundColor: 'white',
                  padding: '5px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${scrollSpeed === 1 ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setScrollSpeed(1)}
                    title="Slow Scroll"
                  >
                    🐢
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${scrollSpeed === 2 ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setScrollSpeed(2)}
                    title="Medium Scroll"
                  >
                    🚶
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${scrollSpeed === 3 ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setScrollSpeed(3)}
                    title="Fast Scroll"
                  >
                    🏃
                  </button>
                </div>

                {/* Main Scroll Buttons */}
                <div className="btn-group-vertical" role="group" style={{
                  backgroundColor: 'white',
                  padding: '10px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <button
                    className="btn btn-danger btn-sm mb-2"
                    onClick={scrollToTop}
                    title="Scroll to Top"
                    style={{ minWidth: '40px' }}
                  >
                    ↑ Top
                  </button>

                  <button
                    className={`btn ${isAutoScrolling ? 'btn-warning' : 'btn-danger'} btn-sm mb-2`}
                    onClick={toggleAutoScroll}
                    title={isAutoScrolling ? 'Stop Auto Scroll' : 'Start Auto Scroll'}
                    style={{ minWidth: '40px' }}
                  >
                    {isAutoScrolling ? (
                      <span style={{ animation: 'pulse 1s infinite' }}>
                        ⏸️ {scrollDirection === 'down' ? '▼' : '▲'}
                      </span>
                    ) : (
                      '🔁 Auto'
                    )}
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={scrollToBottom}
                    title="Scroll to Bottom"
                    style={{ minWidth: '40px' }}
                  >
                    ↓ Bottom
                  </button>
                </div>

                {/* Scroll Indicator */}
                {isAutoScrolling && (
                  <div className="scroll-indicator" style={{
                    backgroundColor: '#ff9800',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    textAlign: 'center',
                    animation: 'pulse 2s infinite'
                  }}>
                    Auto-scrolling {scrollDirection === 'down' ? 'down' : 'up'} • Speed: {
                      scrollSpeed === 1 ? 'Slow' : scrollSpeed === 2 ? 'Medium' : 'Fast'
                    }
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add CSS for pulse animation */}
          <style>
            {`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
              }
              
              .sticky-search {
                transition: all 0.3s ease;
              }
              
              .table-container::-webkit-scrollbar {
                width: 8px;
              }
              
              .table-container::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              
              .table-container::-webkit-scrollbar-thumb {
                background: #f44336;
                border-radius: 10px;
              }
              
              .table-container::-webkit-scrollbar-thumb:hover {
                background: #d32f2f;
              }
              
              .scroll-control-panel button {
                transition: all 0.3s ease;
              }
              
              .scroll-control-panel button:hover {
                transform: scale(1.1);
              }
            `}
          </style>
        </>
      )}
    </>
  );
};

export default SalerRecord;