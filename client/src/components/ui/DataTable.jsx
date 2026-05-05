import React, { useState } from 'react';
import { Search, ChevronDown, MoreHorizontal, Plus } from 'lucide-react';

export default function DataTable({ 
  title, 
  tabs = [], 
  activeTab, 
  onTabChange, 
  filters = [], 
  actionButton, 
  columns = [], 
  data = [], 
  onRowAction,
  onAnalyticsClick
}) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="bg-white rounded-lg shadow-sm font-sans flex flex-col h-full border border-gray-100 overflow-hidden">
      
      {/* Header & Tabs */}
      <div className="flex justify-between items-end px-8 pt-8 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-light text-[#1f2937]">{title}</h1>
        {tabs.length > 0 && (
          <div className="flex space-x-6 text-sm font-medium">
            {tabs.map((tab, idx) => (
              <button 
                key={idx}
                onClick={() => onTabChange && onTabChange(tab)}
                className={`pb-4 px-1 border-b-2 transition-colors ${activeTab === tab ? 'border-blue-800 text-blue-900 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center space-x-6 w-full max-w-3xl">
          <Search className="w-5 h-5 text-gray-400" />
          
          {filters.map((filter, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[10px] text-cyan-600 font-medium ml-1">{filter.label}</span>
              <div className="relative">
                {filter.type === 'text' ? (
                  <input 
                    type="text"
                    value={filter.value}
                    onChange={(e) => filter.onChange && filter.onChange(e.target.value)}
                    placeholder={filter.placeholder || ''}
                    className="bg-white border border-gray-300 text-gray-700 py-1.5 px-3 rounded focus:outline-none focus:border-blue-500 text-sm w-32"
                  />
                ) : (
                  <>
                    <select 
                      value={filter.value}
                      onChange={(e) => filter.onChange && filter.onChange(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 text-gray-700 py-1.5 pl-3 pr-8 rounded focus:outline-none focus:border-blue-500 text-sm w-32"
                    >
                      {filter.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                  </>
                )}
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => onAnalyticsClick && onAnalyticsClick()}
            className="text-sm font-medium text-gray-800 hover:text-blue-600 ml-4 flex items-center"
          >
            Analytics <ChevronDown className="w-4 h-4 ml-1 transform -rotate-90" />
          </button>
        </div>

        {actionButton && (
          <button 
            onClick={actionButton.onClick}
            className="bg-[#ef4444] hover:bg-red-600 text-white font-medium text-sm py-2 px-6 rounded shadow-sm flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> {actionButton.label}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-[#64748b] text-xs uppercase tracking-wider border-y border-gray-200">
              <th className="py-4 pl-8 pr-4 font-medium w-12">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
              </th>
              {columns.map((col, idx) => (
                <th key={idx} className="py-4 px-4 font-medium">{col.header}</th>
              ))}
              <th className="py-4 px-8 text-right font-medium w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 transition-colors group">
                <td className="py-5 pl-8 pr-4">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                </td>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="py-5 px-4 text-gray-800">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
                <td className="py-5 px-8 text-right">
                  <button 
                    onClick={() => onRowAction && onRowAction(row)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
