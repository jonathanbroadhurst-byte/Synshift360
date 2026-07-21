export async function downloadReportFile(cycleId: number, fileName?: string) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/reports/${cycleId}/download`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Download failed with HTTP status ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `SyncShift_360_Report_Cycle_${cycleId}.html`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up memory stream
    window.URL.revokeObjectURL(url);
    link.remove();
  } catch (error) {
    console.error("Report download error:", error);
    alert("Unable to download report. Please ensure your session is active.");
  }
}
