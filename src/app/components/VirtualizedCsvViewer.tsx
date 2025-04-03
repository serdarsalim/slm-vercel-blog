import { useState, useEffect } from 'react';
import { FixedSizeList } from 'react-window';

export default function VirtualizedCsvViewer({ htmlContent }) {
  const [csvRows, setCsvRows] = useState([]);
  
  useEffect(() => {
    // Parse CSV data from HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const codeBlocks = doc.querySelectorAll('.ql-code-block');
    
    // Extract text from code blocks
    const rows = Array.from(codeBlocks).map(block => block.textContent);
    setCsvRows(rows);
  }, [htmlContent]);

  // Render only visible rows for performance
  return (
    <div className="csv-viewer bg-slate-50 dark:bg-slate-800 rounded-lg p-4 my-4 overflow-x-auto">
      <div className="text-sm font-mono">
        {csvRows.length > 100 ? (
          <FixedSizeList
            height={400}
            width="100%"
            itemCount={csvRows.length}
            itemSize={24}
          >
            {({ index, style }) => (
              <div style={style} className="whitespace-nowrap">
                {csvRows[index]}
              </div>
            )}
          </FixedSizeList>
        ) : (
          // For smaller CSVs, render normally
          csvRows.map((row, i) => (
            <div key={i} className="whitespace-nowrap py-0.5">
              {row}
            </div>
          ))
        )}
      </div>
    </div>
  );
}