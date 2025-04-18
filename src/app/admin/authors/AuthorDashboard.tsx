"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Interface for author requests
interface AuthorRequest {
  id: string;
  handle: string;
  name: string;
  email: string;
  bio?: string;
  website_url?: string;
  api_token: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

// Interface for active authors
interface Author {
  id: string;
  handle: string;
  name: string;
  email: string;
  bio?: string;
  website_url?: string;
  api_token: string;
  role: "admin" | "member"; 
  status: "active" | "suspended"; 
  created_at: string;
  updated_at?: string; 
  listing_status: "listed" | "unlisted"; 
}

// Tab options
type TabType = "requests" | "authors" | "suspended";

// Props interface
interface AuthorDashboardProps {
  adminToken?: string;
}

export default function AuthorDashboard({ adminToken }: AuthorDashboardProps) {
  // State for tab management
  const [activeTab, setActiveTab] = useState<TabType>("authors");

  // Data states
  const [requests, setRequests] = useState<AuthorRequest[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinEnabled, setJoinEnabled] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

// Add state for suspended authors
const [suspendedAuthors, setSuspendedAuthors] = useState<Author[]>([]);

// Add function to fetch suspended authors
const fetchSuspendedAuthors = async () => {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch("/api/admin/authors/suspended", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch suspended authors");
    }

    const data = await response.json();
    setSuspendedAuthors(data.authors || []);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
};

  // Add the safeFetch utility function here
  const safeFetch = async (url: string, options: RequestInit) => {
    try {
      const response = await fetch(url, options);
      
      // Check response type before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return { response, data: await response.json() };
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 150) + '...');
        throw new Error(`Expected JSON but received ${contentType || 'unknown content type'}`);
      }
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      throw err;
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchRequests();
    fetchAuthors();
    fetchSuspendedAuthors();
    checkJoinStatus();
  }, []);

  // Add these functions to handle promotion/demotion
 // Update the promoteAuthor function with safe fetch handling
const promoteAuthor = async (handle: string) => {
  setProcessingId(handle);
  setError(null);
  
  try {
    console.log(`Promoting ${handle} to admin - adminToken: ${adminToken?.substring(0, 5)}...`);
    
    // First try to get the response without parsing JSON
    const response = await fetch(`/api/admin/authors/${handle}/role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: "admin" })
    });
    
    console.log("Response status:", response.status);
    const contentType = response.headers.get('content-type');
    console.log("Response content type:", contentType);
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Handle non-JSON response
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      throw new Error("Expected JSON response but got HTML. Check your API route.");
    }
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to promote member");
    }

    // Update state
    setAuthors(prev => prev.map(author => 
      author.handle === handle ? {...author, role: "admin"} : author
    ));
    
    setSuccessMessage(`${handle} promoted to admin successfully`);
    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (err) {
    console.error("Error in promoteAuthor:", err);
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setProcessingId(null);
  }
};

// Same update for demoteAuthor function
const demoteAuthor = async (handle: string) => {
  setProcessingId(handle);
  setError(null);
  
  try {
    console.log(`Demoting ${handle} to member - adminToken: ${adminToken?.substring(0, 5)}...`);
    
    // First try to get the response without parsing JSON
    const response = await fetch(`/api/admin/authors/${handle}/role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: "member" }) // Send "author" but display as "member"
    });
    
    console.log("Response status:", response.status);
    const contentType = response.headers.get('content-type');
    console.log("Response content type:", contentType);
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Handle non-JSON response
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      throw new Error("Expected JSON response but got HTML. Check your API route.");
    }
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to demote admin");
    }

    // Update state
    setAuthors(prev => prev.map(author => 
      author.handle === handle ? {...author, role: "member"} : author
    ));
    
    setSuccessMessage(`${handle} demoted to member successfully`);
    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (err) {
    console.error("Error in demoteAuthor:", err);
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setProcessingId(null);
  }
};

  // Function to toggle author visibility
// Function to toggle author listing status
const toggleAuthorListingStatus = async (handle: string, currentStatus: string) => {
  setProcessingId(handle);
  setError(null);
  
  const newStatus = currentStatus === "listed" ? "unlisted" : "listed";
  
  try {
    const response = await fetch(`/api/admin/authors/${handle}/listing-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ listing_status: newStatus }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update author listing status`);
    }

    // Update the specific author locally without refetching everything
    setAuthors(prev => prev.map(author => 
      author.handle === handle 
        ? {...author, listing_status: newStatus} 
        : author
    ));
    
    setSuccessMessage(
      `Author ${handle} is now ${newStatus === "listed" ? "listed" : "unlisted"} on the site`
    );
    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setProcessingId(null);
  }
};

  // Function to fetch author requests
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/author-requests", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch author requests");
      }

      const data = await response.json();
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch active authors
  const fetchAuthors = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch("/api/admin/authors", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch authors");
      }
  
      const data = await response.json();
      
      // Filter only active authors (if not already filtered by the API)
      const activeAuthors = (data.authors || []).filter(
        author => author.status === 'active'
      );
      
      setAuthors(activeAuthors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Function to check if join page is enabled
  const checkJoinStatus = async () => {
    try {
      const response = await fetch("/api/admin/settings/join-status", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await response.json();
      setJoinEnabled(!data.disabled);
    } catch (err) {
      console.error("Failed to check join status:", err);
    }
  };

  // Function to toggle join page status
  const toggleJoinStatus = async () => {
    try {
      const response = await fetch("/api/admin/settings/toggle-join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ enabled: !joinEnabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update join status");
      }

      const data = await response.json();
      setJoinEnabled(data.enabled);
      setSuccessMessage(
        `Author join page ${data.enabled ? "enabled" : "disabled"} successfully`
      );

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Function to approve an author request
  const approveRequest = async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/author-requests/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve author request");
      }

      // Refresh both data sets
      await Promise.all([fetchRequests(), fetchAuthors()]);

      setSuccessMessage("Author request approved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingId(null);
    }
  };

  // Add this helper function inside your component
  const copyToClipboard = (text: string) => {
    try {
      // Check if clipboard is available
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setSuccessMessage("API token copied to clipboard");
            setTimeout(() => setSuccessMessage(null), 3000);
          })
          .catch((err) => {
            setError(`Failed to copy: ${err.message}`);
          });
      } else {
        // Fallback using document.execCommand (older browsers)
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            setSuccessMessage("API token copied to clipboard");
          } else {
            setError("Clipboard copy failed");
          }
        } catch (err) {
          setError("Browser doesn't support clipboard access");
        }

        document.body.removeChild(textArea);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError("Unable to access clipboard");
    }
  };

  // Function to reject an author request
  const rejectRequest = async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/author-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject author request");
      }

      // Update local state and refresh requests
      await fetchRequests();

      setSuccessMessage("Author request rejected successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingId(null);
    }
  };

  // Function to delete an author request
  const deleteRequest = async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/author-requests/${requestId}/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete author request");
      }

      // Refresh requests data
      await fetchRequests();

      setSuccessMessage("Author request deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingId(null);
    }
  };

  // Add this function to your AuthorDashboard.tsx component
const deleteAuthor = async (handle: string) => {
  setProcessingId(handle);
  setError(null);

  try {
    // First, confirm deletion
    if (!confirm(`Are you sure you want to permanently delete ${handle}? This cannot be undone.`)) {
      setProcessingId(null);
      return;
    }
    
    const response = await fetch(`/api/admin/authors/${handle}/delete`, {
      method: "DELETE", // Using DELETE HTTP method for semantics
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete author");
    }

    // Update local state by removing the author
    setSuspendedAuthors(prev => prev.filter(a => a.handle !== handle));

    setSuccessMessage(`Author ${handle} has been permanently deleted`);
    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setProcessingId(null);
  }
};

  // Function to revoke an approved author
  const suspendAuthor = async (handle: string) => {
    setProcessingId(handle);
    setError(null);
  
    try {
      const response = await fetch(`/api/admin/authors/${handle}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to suspend author");
      }
  
      // Update local state
      const authorToSuspend = authors.find(a => a.handle === handle);
      if (authorToSuspend) {
        // Move from active to suspended
        setAuthors(prev => prev.filter(a => a.handle !== handle));
        setSuspendedAuthors(prev => [...prev, {...authorToSuspend, status: "suspended"}]);
      }
  
      setSuccessMessage(`Author ${handle} has been suspended`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingId(null);
    }
  };

  // Function to reinstate a suspended author
const reinstateAuthor = async (handle: string) => {
  setProcessingId(handle);
  setError(null);

  try {
    const response = await fetch(`/api/admin/authors/${handle}/reinstate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to reinstate author");
    }

    // Update local state
    const authorToReinstate = suspendedAuthors.find(a => a.handle === handle);
    if (authorToReinstate) {
      // Move from suspended to active
      setSuspendedAuthors(prev => prev.filter(a => a.handle !== handle));
      setAuthors(prev => [...prev, {...authorToReinstate, status: "active"}]);
    }

    setSuccessMessage(`Author ${handle} has been reinstated`);
    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setProcessingId(null);
  }
};

  // Get pending requests count for badge
  const pendingCount = requests.filter(
    (req) => req.status === "pending"
  ).length;

  return (
    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
         
        </h2>

        <button
          onClick={toggleJoinStatus}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            joinEnabled
              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
              : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
          }`}
        >
          {joinEnabled ? "Disable Join Page" : "Enable Join Page"}
        </button>
      </div>

      {/* Tab Navigation */}
      {/* Tab Navigation */}
<div className="border-b border-gray-200 dark:border-slate-700">
  <nav className="flex">
    <button
      onClick={() => setActiveTab("requests")}
      className={`relative py-3 px-6 text-sm font-medium ${
        activeTab === "requests"
          ? "text-orange-600 border-b-2 border-orange-500 dark:text-orange-400 dark:border-orange-400"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
    >
      Requests
      {pendingCount > 0 && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
          {pendingCount}
        </span>
      )}
    </button>

    <button
      onClick={() => setActiveTab("authors")}
      className={`py-3 px-6 text-sm font-medium ${
        activeTab === "authors"
          ? "text-orange-600 border-b-2 border-orange-500 dark:text-orange-400 dark:border-orange-400"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
    >
      Authors ({authors.length})
    </button>
    
    <button
      onClick={() => setActiveTab("suspended")}
      className={`py-3 px-6 text-sm font-medium ${
        activeTab === "suspended"
          ? "text-orange-600 border-b-2 border-orange-500 dark:text-orange-400 dark:border-orange-400"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
    >
      Suspended ({suspendedAuthors.length})
    </button>
  </nav>
</div>

      {/* Success/Error Messages */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-600 p-4"
        >
          <p className="text-green-700 dark:text-green-300">{successMessage}</p>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Requests Tab Content */}
      {activeTab === "requests" && (
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Loading requests...
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No author requests found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Handle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          API Token
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Listing Status
                    </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className={
                      request.status === "pending"
                        ? "bg-amber-50 dark:bg-amber-900/10"
                        : ""
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {request.handle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {request.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span
                        className={`
                          inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === "pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              : request.status === "approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          }
                        `}
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {request.api_token.substring(0, 12)}...
                        <button
                          className="ml-2 text-orange-500 hover:text-orange-600"
                          onClick={() => copyToClipboard(request.api_token)}
                        >
                          <svg
                            className="w-4 h-4 inline"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* Show Approve button for both pending AND rejected requests */}
                      {(request.status === "pending" ||
                        request.status === "rejected") && (
                        <button
                          onClick={() => approveRequest(request.id)}
                          disabled={!!processingId}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                        >
                          {processingId === request.id
                            ? "Processing..."
                            : "Approve"}
                        </button>
                      )}

                      {/* Only show Reject button for pending requests */}
                      {request.status === "pending" && (
                        <button
                          onClick={() => rejectRequest(request.id)}
                          disabled={!!processingId}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mr-3"
                        >
                          {processingId === request.id
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      )}

                      {/* Delete button is always visible */}
                      <button
                        onClick={() => deleteRequest(request.id)}
                        disabled={!!processingId}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        {processingId === request.id
                          ? "Processing..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Authors Tab Content */}
      {activeTab === "authors" && (
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Loading authors...
              </p>
            </div>
          ) : authors.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No active authors found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Handle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    API Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {authors.map((author) => (
                  <tr
                    key={author.id}
                    className="bg-green-50 dark:bg-green-900/10"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {author.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {author.handle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {author.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {author.api_token.substring(0, 12)}...
                        <button
                          className="ml-2 text-orange-500 hover:text-orange-600"
                          onClick={() => copyToClipboard(author.api_token)}
                        >
                          <svg
                            className="w-4 h-4 inline"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {new Date(author.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      author.role === "admin"
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"  }`}>
                                      {author.role === "admin" ? "Admin" : "Member"}
                                    </span>
                        <button
                          onClick={() =>
                            author.role === "admin"
                              ? demoteAuthor(author.handle)
                              : promoteAuthor(author.handle)
                          }
                          disabled={!!processingId}
                          className="ml-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {processingId === author.handle
                                          ? "Processing..."
                                          : author.role === "admin"
                                          ? "Demote"
                                          : "Promote"}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`
                              inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                              ${author.listing_status === "unlisted"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              }
                            `}
                          >
                            {author.listing_status === "unlisted" ? "Unlisted" : "Listed"}
                          </span>
                          <button
                            onClick={() => toggleAuthorListingStatus(author.handle, author.listing_status || "listed")}
                            disabled={!!processingId}
                            className="ml-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            {processingId === author.handle
                              ? "Processing..."
                              : author.listing_status === "unlisted"
                              ? "List"
                              : "Unlist"}
                          </button>
                        </div>
                      </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                      onClick={() => suspendAuthor(author.handle)}
                      disabled={!!processingId}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {processingId === author.handle ? "Processing..." : "Suspend"}
                    </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}


{/* Suspended Authors Tab Content */}
{activeTab === "suspended" && (
  <div className="overflow-x-auto">
    {loading ? (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Loading suspended authors...
        </p>
      </div>
    ) : suspendedAuthors.length === 0 ? (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        No suspended authors found.
      </div>
    ) : (
      <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead className="bg-gray-50 dark:bg-slate-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Handle
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Date Suspended
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
          {suspendedAuthors.map((author) => (
            <tr
              key={author.id}
              className="bg-red-50 dark:bg-red-900/10"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {author.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {author.handle}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {author.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(author.updated_at || author.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                  {author.role === "admin" ? "Admin" : "Member"}
                </span>
              </td>
              {/* Suspended Authors Table Actions Column */}
<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <button
    onClick={() => reinstateAuthor(author.handle)}
    disabled={!!processingId}
    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
  >
    {processingId === author.handle ? "Processing..." : "Unsuspend"}
  </button>
  
  {/* Add Delete Button */}
  <button
    onClick={() => deleteAuthor(author.handle)}
    disabled={!!processingId}
    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
  >
    {processingId === author.handle ? "Processing..." : "Delete"}
  </button>
</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}


    </div>
  );
}
