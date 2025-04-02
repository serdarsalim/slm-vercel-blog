// In src/app/utils/apiUtils.ts
// Add a new function to upload different sheet types

/**
 * Uploads CSV data from a specific sheet to the blog
 * @param secretToken The API key to use
 * @param apiUrl The full URL to your API endpoint
 * @param csvContent The CSV content to upload
 * @param sheetType The type of sheet ('posts' or 'settings')
 */
export async function uploadSheetData(
  secretToken: string, 
  apiUrl: string, 
  csvContent: string, 
  sheetType: 'posts' | 'settings' = 'posts'
): Promise<{
  success: boolean;
  message: string;
  url?: string;
  error?: string;
}> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretToken,
        csvContent: csvContent,
        sheetType: sheetType
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Data uploaded successfully',
        url: data.url
      };
    } else {
      return {
        success: false,
        message: 'Failed to upload data',
        error: data.error || `Error code: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error uploading data',
      error: error.message || 'Unknown error'
    };
  }
}