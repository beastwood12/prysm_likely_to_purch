import { useState, useMemo, useEffect, useRef } from 'react';
import * as Chart from 'chart.js';

export default function Calculator() {
  const [rates, setRates] = useState({ veryHigh: 78, high: 56, medium: 34, low: 17, veryLow: 6 });
  const [price, setPrice] = useState(300);
  const [region, setRegion] = useState('overall');
  const [devicesPerUser, setDevicesPerUser] = useState(1);

  const devicesChartRef = useRef(null);
  const purchasersChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const devicesChartInstance = useRef(null);
  const purchasersChartInstance = useRef(null);
  const revenueChartInstance = useRef(null);

  // Configuration constants
  const CATEGORIES = ['veryHigh', 'high', 'medium', 'low', 'veryLow'];
  const CATEGORY_NAMES = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];
  const PRESETS = {
    optimistic: { veryHigh: 85, high: 70, medium: 50, low: 25, veryLow: 10 },
    likely: { veryHigh: 78, high: 56, medium: 34, low: 17, veryLow: 6 },
    conservative: { veryHigh: 65, high: 45, medium: 25, low: 10, veryLow: 3 }
  };

  // Regional data
  const data: Record<string, Record<string, number>> = {
    overall: { veryHigh: 882, high: 2852, medium: 19208, low: 13264, veryLow: 5335 },
    japan: { veryHigh: 245, high: 824, medium: 5502, low: 1295, veryLow: 179 },
    latinAmerica: { veryHigh: 171, high: 267, medium: 1246, low: 1563, veryLow: 420 },
    korea: { veryHigh: 60, high: 354, medium: 3249, low: 1939, veryLow: 228 },
    hkmctw: { veryHigh: 54, high: 234, medium: 1446, low: 1246, veryLow: 409 },
    eua: { veryHigh: 92, high: 328, medium: 2574, low: 1576, veryLow: 219 },
    seAsia: { veryHigh: 64, high: 260, medium: 1525, low: 2691, veryLow: 3299 },
    northAmerica: { veryHigh: 157, high: 517, medium: 3141, low: 2324, veryLow: 418 },
    pacific: { veryHigh: 39, high: 68, medium: 525, low: 630, veryLow: 163 }
  };

  // Time series data for trends
  const timeSeriesData = [
    { month: 'Jun 2024', users: 32258 },
    { month: 'Jul 2024', users: 32757 },
    { month: 'Aug 2024', users: 32452 },
    { month: 'Sep 2024', users: 32829 },
    { month: 'Oct 2024', users: 32152 },
    { month: 'Nov 2024', users: 31636 },
    { month: 'Dec 2024', users: 31838 }
  ];

  // Main calculations
  const calculations = useMemo(() => {
    const regionData = data[region];
    
    // Calculate total unique users (sum of all categories represents unique users)
    const totalUniqueUsers = Object.values(regionData).reduce((sum, count) => sum + count, 0);
    
    // For each category, calculate purchasing users (these are mutually exclusive)
    const results = CATEGORIES.map((cat, i) => {
      const users = regionData[cat];
      const rate = rates[cat] / 100;
      const purchasingUsers = Math.round(users * rate);
      const devicesSold = purchasingUsers * devicesPerUser;
      const revenue = devicesSold * price;
      
      return {
        category: CATEGORY_NAMES[i],
        users,
        rate: rates[cat],
        purchasingUsers,
        devicesSold,
        revenue
      };
    });

    // Sum up purchasing users and devices (these don't double-count since categories are mutually exclusive)
    const totalPurchasingUsers = results.reduce((sum, result) => sum + result.purchasingUsers, 0);
    const totalDevicesSold = results.reduce((sum, result) => sum + result.devicesSold, 0);

    return {
      results,
      totalUsers: totalUniqueUsers,
      totalPurchasingUsers,
      totalDevicesSold,
      totalRevenue: totalDevicesSold * price,
      conversionRate: ((totalPurchasingUsers / totalUniqueUsers) * 100).toFixed(1)
    };
  }, [rates, price, region, devicesPerUser, CATEGORIES, CATEGORY_NAMES, data]);

  // Time series calculations - proper category-based purchasing with quota tracking
  const timeSeriesResults = useMemo(() => {
    const regionData = data[region];
    
    // Track each user's purchase count (simplified: track by category)
    const userPurchaseTracker = {
      veryHigh: Array(regionData.veryHigh).fill(0),
      high: Array(regionData.high).fill(0),
      medium: Array(regionData.medium).fill(0),
      low: Array(regionData.low).fill(0),
      veryLow: Array(regionData.veryLow).fill(0)
    };
    
    return timeSeriesData.map((monthData, monthIndex) => {
      let totalPotentialPurchasers = 0;
      let totalWouldPurchase = 0;
      let totalActualPurchasers = 0;
      let totalDevicesPurchased = 0;
      
      // For each category, determine purchases this month
      CATEGORIES.forEach((category, catIndex) => {
        const categoryUsers = regionData[category];
        const categoryRate = rates[category] / 100;
        
        // Count users in this category who haven't hit quota
        const usersNotAtQuota = userPurchaseTracker[category].filter(count => count < devicesPerUser).length;
        totalPotentialPurchasers += usersNotAtQuota;
        
        // Determine who would purchase based on their category rate
        const wouldPurchaseThisMonth = Math.round(usersNotAtQuota * categoryRate);
        totalWouldPurchase += wouldPurchaseThisMonth;
        
        // Actually purchase (limited by quota)
        let actualPurchasers = 0;
        for (let i = 0; i < userPurchaseTracker[category].length && actualPurchasers < wouldPurchaseThisMonth; i++) {
          if (userPurchaseTracker[category][i] < devicesPerUser) {
            userPurchaseTracker[category][i]++;
            actualPurchasers++;
          }
        }
        
        totalActualPurchasers += actualPurchasers;
        totalDevicesPurchased += actualPurchasers;
      });
      
      const percentagePurchasers = totalPotentialPurchasers > 0 
        ? ((totalActualPurchasers / totalPotentialPurchasers) * 100).toFixed(1)
        : '0.0';
      
      const revenue = totalDevicesPurchased * price;
      
      return {
        ...monthData,
        potentialPurchasers: totalPotentialPurchasers,
        percentagePurchasers: percentagePurchasers,
        numberPurchasers: totalActualPurchasers,
        devicesPurchased: totalDevicesPurchased,
        revenue: revenue
      };
    });
  }, [data, region, rates, devicesPerUser, price, timeSeriesData, CATEGORIES]);

  // Chart creation effect
  useEffect(() => {
    // Register Chart.js components
    if (Chart.Chart && Chart.registerables) {
      Chart.Chart.register(...Chart.registerables);
    }

    // Destroy existing charts
    if (devicesChartInstance.current) {
      devicesChartInstance.current.destroy();
    }
    if (purchasersChartInstance.current) {
      purchasersChartInstance.current.destroy();
    }
    if (revenueChartInstance.current) {
      revenueChartInstance.current.destroy();
    }

    // Create charts
    if (devicesChartRef.current && timeSeriesResults.length > 0) {
      devicesChartInstance.current = new Chart.Chart(devicesChartRef.current, {
        type: 'bar',
        data: {
          labels: timeSeriesResults.map(r => r.month),
          datasets: [{
            label: 'Devices Sold',
            data: timeSeriesResults.map(r => r.devicesPurchased),
            backgroundColor: '#8884d8'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { size: 10 } }
            },
            x: {
              ticks: { 
                font: { size: 9 },
                maxRotation: 45
              }
            }
          }
        }
      });
    }

    if (purchasersChartRef.current && timeSeriesResults.length > 0) {
      purchasersChartInstance.current = new Chart.Chart(purchasersChartRef.current, {
        type: 'line',
        data: {
          labels: timeSeriesResults.map(r => r.month),
          datasets: [{
            label: 'Purchasers',
            data: timeSeriesResults.map(r => r.numberPurchasers),
            borderColor: '#82ca9d',
            backgroundColor: 'rgba(130, 202, 157, 0.1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { size: 10 } }
            },
            x: {
              ticks: { 
                font: { size: 9 },
                maxRotation: 45
              }
            }
          }
        }
      });
    }

    if (revenueChartRef.current && timeSeriesResults.length > 0) {
      revenueChartInstance.current = new Chart.Chart(revenueChartRef.current, {
        type: 'bar',
        data: {
          labels: timeSeriesResults.map(r => r.month),
          datasets: [{
            label: 'Revenue',
            data: timeSeriesResults.map(r => r.revenue),
            backgroundColor: '#ffc658'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { 
                font: { size: 10 },
                callback: function(value) {
                  return '$' + (value / 1000).toFixed(0) + 'k';
                }
              }
            },
            x: {
              ticks: { 
                font: { size: 9 },
                maxRotation: 45
              }
            }
          }
        }
      });
    }

    return () => {
      if (devicesChartInstance.current) devicesChartInstance.current.destroy();
      if (purchasersChartInstance.current) purchasersChartInstance.current.destroy();
      if (revenueChartInstance.current) revenueChartInstance.current.destroy();
    };
  }, [timeSeriesResults]);

  // Event handlers
  const setPreset = (preset) => setRates(PRESETS[preset]);
  const updateRate = (category, value) => 
    setRates(prev => ({ ...prev, [category]: parseFloat(value) || 0 }));

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Device Sales Calculator</h1>
      
      {/* Controls */}
      <div className="mb-4 p-3 bg-white rounded shadow">
        {/* Main controls row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Choose A Region</label>
            <select 
              value={region} 
              onChange={(e) => setRegion(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="overall">Global</option>
              <option value="japan">Japan</option>
              <option value="latinAmerica">Latin America</option>
              <option value="korea">Korea</option>
              <option value="hkmctw">HK/MC/TW</option>
              <option value="eua">EU&A</option>
              <option value="seAsia">S.E. Asia</option>
              <option value="northAmerica">North America</option>
              <option value="pacific">Pacific</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Device Price (USD)</label>
            <div className="relative">
              <span className="absolute left-2 top-2 text-gray-500">$</span>
              <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(parseInt(e.target.value) || 300)}
                className="w-full p-2 pl-6 border rounded"
                placeholder="300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Devices Per User</label>
            <input 
              type="number" 
              value={devicesPerUser} 
              onChange={(e) => setDevicesPerUser(parseFloat(e.target.value) || 1)}
              className="w-full p-2 border rounded"
              placeholder="1"
              step="0.1"
              min="0.1"
            />
          </div>
        </div>
      </div>

      {/* Rate Inputs with Presets */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded shadow-md mb-4">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-xl font-semibold text-blue-800">
            Likelihood To Purchase (%)
          </label>
          <div className="flex gap-2">
            <label className="text-xs font-medium text-gray-600 mr-2">Preset Scenarios:</label>
            {Object.keys(PRESETS).map(preset => (
              <button 
                key={preset}
                onClick={() => setPreset(preset)}
                className={`px-2 py-1 text-white rounded text-xs capitalize ${
                  preset === 'optimistic' ? 'bg-green-500 hover:bg-green-600' :
                  preset === 'likely' ? 'bg-blue-500 hover:bg-blue-600' :
                  'bg-red-500 hover:bg-red-600'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIES.map((category, index) => (
            <div key={category} className="text-center">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {CATEGORY_NAMES[index]}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rates[category]}
                  onChange={(e) => updateRate(category, e.target.value)}
                  className="w-full p-1 border border-blue-300 rounded text-sm text-center pr-4 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  step="0.1"
                />
                <span className="absolute right-1 top-1 text-xs text-gray-400">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Device Sales Trends Over Time</h2>
        <p className="text-sm text-gray-600 mb-4">
          Projected device sales and revenue based on category-specific conversion rates and quota tracking over time
        </p>
      </div>

      {/* Trends Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-white rounded shadow">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {timeSeriesResults.reduce((sum: number, month) => sum + (month.numberPurchasers || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Total Purchasing Users</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {timeSeriesResults.reduce((sum: number, month) => sum + (month.devicesPurchased || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Total Devices Sold</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">
            ${timeSeriesResults.reduce((sum: number, month) => sum + (month.revenue || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Total Projected Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {(() => {
              const totalPurchasers = timeSeriesResults.reduce((sum: number, month) => sum + (month.numberPurchasers || 0), 0);
              const totalPotential = timeSeriesResults.reduce((sum: number, month) => sum + (month.potentialPurchasers || 0), 0);
              return totalPotential > 0 ? ((totalPurchasers / totalPotential) * 100).toFixed(1) : '0.0';
            })()}%
          </div>
          <div className="text-xs text-gray-600">Avg Conversion Rate</div>
        </div>
      </div>

      {/* Time Series Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Month</th>
              <th className="px-3 py-2 text-right">Potential Purchasers</th>
              <th className="px-3 py-2 text-right">% Purchasers</th>
              <th className="px-3 py-2 text-right"># Purchasers</th>
              <th className="px-3 py-2 text-right">Devices Purchased</th>
              <th className="px-3 py-2 text-right">Monthly Revenue</th>
            </tr>
          </thead>
          <tbody>
            {timeSeriesResults.map((month, i) => {
              const isMarketExhausted = month.potentialPurchasers === 0;
              return (
                <tr key={i} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-3 py-2 font-medium">{month.month}</td>
                  <td className={`px-3 py-2 text-right ${isMarketExhausted ? 'text-red-600 font-bold' : ''}`}>
                    {month.potentialPurchasers.toLocaleString()}
                    {isMarketExhausted && <span className="text-xs ml-1">🚫</span>}
                  </td>
                  <td className="px-3 py-2 text-right">{month.percentagePurchasers}%</td>
                  <td className="px-3 py-2 text-right font-medium">{month.numberPurchasers.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-medium">{month.devicesPurchased.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">${month.revenue.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="px-3 py-2">TOTAL</td>
              <td className="px-3 py-2 text-right">-</td>
              <td className="px-3 py-2 text-right">-</td>
              <td className="px-3 py-2 text-right">
                {timeSeriesResults.reduce((sum: number, month) => sum + (month.numberPurchasers || 0), 0).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right">
                {timeSeriesResults.reduce((sum: number, month) => sum + (month.devicesPurchased || 0), 0).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right">
                ${timeSeriesResults.reduce((sum: number, month) => sum + (month.revenue || 0), 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4 mt-6 mb-6">
        {/* Devices Sold Chart */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm font-semibold mb-3 text-gray-800">Devices Sold by Month</h3>
          <div style={{ height: '200px' }}>
            <canvas ref={devicesChartRef}></canvas>
          </div>
        </div>

        {/* Purchasers Chart */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm font-semibold mb-3 text-gray-800"># Purchasers by Month</h3>
          <div style={{ height: '200px' }}>
            <canvas ref={purchasersChartRef}></canvas>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm font-semibold mb-3 text-gray-800">Revenue by Month</h3>
          <div style={{ height: '200px' }}>
            <canvas ref={revenueChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">📈 Category-Based Purchase Model</h3>
        <div className="text-xs text-gray-700 space-y-1">
          <p>• <strong>Monthly Categorization:</strong> Each month, users are categorized and purchase based on their category likelihood</p>
          <p>• <strong>Category Rates:</strong> Very High: {rates.veryHigh}%, High: {rates.high}%, Medium: {rates.medium}%, Low: {rates.low}%, Very Low: {rates.veryLow}%</p>
          <p>• <strong>Quota Enforcement:</strong> Users who would purchase but have hit quota ({devicesPerUser} device{devicesPerUser > 1 ? 's' : ''}) are blocked</p>
          <p>• <strong>% Purchasers:</strong> Actual purchase rate considering both category likelihood AND quota limitations</p>
          <p>• <strong>Potential Purchasers:</strong> Only includes users who haven't reached their device limit</p>
          <p>• Final remaining market: {timeSeriesResults[timeSeriesResults.length - 1]?.potentialPurchasers.toLocaleString() || '0'} users still eligible to purchase</p>
        </div>
      </div>

      {/* Information Sections */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">💡 Corrected Single-Purchase Model</h3>
        <div className="text-xs text-gray-700 space-y-2">
          <p><strong>Target Product:</strong> $300 carotenoid measurement device with tracking app to help distributors demonstrate SCS vitamin effectiveness</p>
          <p><strong>Survey Data Foundation:</strong> 75% interested in concept, 63% would purchase at $249, ~56% estimated at $300</p>
          <p><strong>Key Model Fix:</strong> Now properly treats users as unique individuals who can only purchase once (or specified devices per user)</p>
          <p><strong>User Categories Are Mutually Exclusive:</strong> Each of the {calculations.totalUsers.toLocaleString()} users belongs to exactly one category based on their overall behavior</p>
          <div>
            <p><strong>Scoring Model (100 points):</strong></p>
            <ul className="ml-4 mt-1 space-y-0.5">
              <li>• <strong>Average SCS Product Engagement (35%):</strong> Higher consistent SCS purchases indicate greater need to demonstrate effectiveness</li>
              <li>• <strong>Average Sales Volume (25%):</strong> High-volume sellers more likely to invest in professional sales tools</li>
              <li>• <strong>Subscription Consistency (25%):</strong> Percentage of months with active subscriptions shows commitment</li>
              <li>• <strong>Purchase Stability (10%):</strong> Consistent buying patterns indicate reliable, professional distributors</li>
              <li>• <strong>Activity Frequency (5%):</strong> Active throughout the 7-month period shows ongoing engagement</li>
            </ul>
          </div>
          <p><strong>Categories:</strong> Very High (75-100 pts), High (60-74), Medium (40-59), Low (20-39), Very Low (0-19)</p>
          <p><strong>Realistic Market Size:</strong> {calculations.totalUsers.toLocaleString()} unique distributors → {calculations.totalPurchasingUsers.toLocaleString()} likely purchasers → {calculations.totalDevicesSold.toLocaleString()} total devices</p>
          <p><strong>Time Series Note:</strong> Historical months show month-by-month potential, but represent the SAME user base, not cumulative opportunity</p>
          <p><strong>Devices Per User:</strong> Adjustable parameter (default: 1) allows modeling scenarios where users might purchase multiple devices for teams, replacements, or business expansion.</p>
        </div>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">📋 Survey Data</h3>
        <div className="text-xs text-gray-700 grid grid-cols-2 gap-2">
          <div>
            <p>• 75% interested in concept</p>
            <p>• 85% think helps increase customers</p>
            <p>• 86% think helps attract new people</p>
            <p>• 85% think helps sell more SCS</p>
          </div>
          <div>
            <p>• 70% would buy at $199</p>
            <p>• 63% would buy at $249</p>
            <p>• ~56% estimated at $300</p>
            <p>• Includes tracking app</p>
          </div>
        </div>
      </div>
    </div>
  );
}
