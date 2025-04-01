/**
 * Tests if the revalidation API key is valid
 * @param secretToken The API key to test
 * @param apiUrl The full URL to your API endpoint
 */
export async function testApiKey(secretToken: string, apiUrl: string): Promise<{
  success: boolean;
  message: string;
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
        test: true
      })
    });

    // Parse the response
    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || 'API key is valid'
      };
    } else {
      return {
        success: false,
        message: 'API key validation failed',
        error: data.error || `Error code: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error testing API key',
      error: error.message || 'Unknown error'
    };
  }
}