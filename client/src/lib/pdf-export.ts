export interface ExportData {
  title: string;
  data: any[];
  investorName: string;
  investorId: string;
}

export function exportToPDF(exportData: ExportData) {
  // This is a placeholder for PDF export functionality
  // In a real implementation, you would use a library like jsPDF or generate PDFs on the server
  console.log("Exporting to PDF:", exportData);
  
  // For now, we'll create a simple HTML print dialog
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${exportData.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .investor-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${exportData.title}</h1>
        <p>Investment Relationship Management System</p>
      </div>
      
      <div class="investor-info">
        <p><strong>Investor:</strong> ${exportData.investorName}</p>
        <p><strong>Investor ID:</strong> ${exportData.investorId}</p>
        <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Mode</th>
            <th>Transaction ID</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${exportData.data.map(transaction => `
            <tr>
              <td>${new Date(transaction.transactionDate).toLocaleDateString()}</td>
              <td>${transaction.type}</td>
              <td>₹${parseFloat(transaction.amount).toLocaleString()}</td>
              <td>${transaction.mode}</td>
              <td>${transaction.transactionId}</td>
              <td>${transaction.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>This is a computer-generated document. No signature required.</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

export function exportToExcel(exportData: ExportData) {
  // This is a placeholder for Excel export functionality
  // In a real implementation, you would use a library like SheetJS or generate Excel files on the server
  console.log("Exporting to Excel:", exportData);
  
  // Create CSV data
  const headers = ['Date', 'Type', 'Amount', 'Mode', 'Transaction ID', 'Status'];
  const csvData = [
    headers.join(','),
    ...exportData.data.map(transaction => [
      new Date(transaction.transactionDate).toLocaleDateString(),
      transaction.type,
      parseFloat(transaction.amount),
      transaction.mode,
      transaction.transactionId,
      transaction.status
    ].join(','))
  ].join('\n');
  
  // Create and download CSV file
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${exportData.title.replace(/\s+/g, '_')}_${exportData.investorId}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateInvestmentStatement(investorData: any) {
  const exportData: ExportData = {
    title: "Investment Statement",
    data: investorData.investments.flatMap((inv: any) => inv.transactions),
    investorName: `${investorData.firstName} ${investorData.lastName}`,
    investorId: investorData.id,
  };
  
  return exportData;
}

export function generatePortfolioReport(portfolioData: any) {
  const exportData: ExportData = {
    title: "Portfolio Report",
    data: portfolioData.investments || [],
    investorName: "Admin Report",
    investorId: "ADMIN",
  };
  
  return exportData;
}
