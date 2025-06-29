import React from 'react';
import { FileText, FileSpreadsheet, Download, FileJson, X } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportMenuProps {
  data: any[];
  selectedRows: Set<string>;
  onClose: () => void;
}

export function ExportMenu({ data, selectedRows, onClose }: ExportMenuProps) {
  const getExportData = () => {
    return selectedRows.size > 0 
      ? data.filter(row => selectedRows.has(row.id))
      : data;
  };

  const exportToCSV = () => {
    const exportData = getExportData();
    const csv = Papa.unparse(exportData);
    downloadFile(csv, 'linkedin-data.csv', 'text/csv');
  };

  const exportToJSON = () => {
    const exportData = getExportData();
    const json = JSON.stringify(exportData, null, 2);
    downloadFile(json, 'linkedin-data.json', 'application/json');
  };

  const exportToExcel = () => {
    // For simplicity, we'll export as CSV with Excel-friendly format
    const exportData = getExportData();
    const csv = Papa.unparse(exportData);
    downloadFile(csv, 'linkedin-data.csv', 'text/csv');
  };

  const exportToPDF = () => {
    const exportData = getExportData();
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(16);
    pdf.text('LinkedIn Scraper Results', 20, 20);
    
    // Prepare table data
    const headers = ['Name', 'Headline', 'Location', 'Connections', 'Updated'];
    const rows = exportData.map(row => [
      row.name || '',
      row.headline || '',
      row.location || '',
      row.connections || '',
      new Date(row.updated).toLocaleDateString()
    ]);

    // Add table
    (pdf as any).autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    pdf.save('linkedin-data.pdf');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-2">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="py-2 space-y-1">
          <button
            onClick={exportToCSV}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export as CSV</span>
          </button>
          
          <button
            onClick={exportToExcel}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <span>Export as Excel</span>
          </button>
          
          <button
            onClick={exportToJSON}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <FileJson className="h-4 w-4 text-blue-600" />
            <span>Export as JSON</span>
          </button>
          
          <button
            onClick={exportToPDF}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <FileText className="h-4 w-4 text-red-600" />
            <span>Export as PDF</span>
          </button>
        </div>
        
        {selectedRows.size > 0 && (
          <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-500">
            Exporting {selectedRows.size} selected rows
          </div>
        )}
      </div>
    </div>
  );
}