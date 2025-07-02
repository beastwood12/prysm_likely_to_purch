import React, { useState } from 'react';

export default function Calculator() {
  const [rates, setRates] = useState({ veryHigh: 78, high: 56, medium: 34, low: 17, veryLow: 6 });
  const [price, setPrice] = useState(300);
  const [region, setRegion] = useState('overall');

  const data = {
    overall: { veryHigh: 4993, high: 3799, medium: 6467, low: 6262, veryLow: 7843 },
    japan: { veryHigh: 1342, high: 1025, medium: 1732, low: 1603, veryLow: 516 },
    latinAmerica: { veryHigh: 748, high: 365, medium: 644, low: 748, veryLow: 550 },
    korea: { veryHigh: 571, high: 622, medium: 870, low: 547, veryLow: 553 },
    hkmctw: { veryHigh: 431, high: 336, medium: 633, low: 473, veryLow: 499 },
    eua: { veryHigh: 652, high: 472, medium: 692, low: 707, veryLow: 1163 },
    seAsia: { veryHigh: 388, high: 478, medium: 788, low: 849, veryLow: 1104 },
    northAmerica: { veryHigh: 715, high: 417, medium: 922, low: 1111, veryLow: 2479 },
    pacific: { veryHigh: 146, high: 84, medium: 186, low: 224, veryLow: 979 }
  };

  const regionData = data[region];
  const categories = ['veryHigh', 'high', 'medium', 'low', 'veryLow'];
  const categoryNames = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];

  const calculate = () => {
    let totalUsers = 0;
    let totalSales = 0;
    const results = [];

    categories.forEach((cat, i) => {
      const users = regionData[cat];
      const rate = rates[cat] / 100;
      const sales = Math.round(users * rate);
      const revenue = sales * price;
      
      totalUsers += users;
      totalSales += sales;
      
      results.push({
        category: categoryNames[i],
        users,
        rate: rates[cat],
        sales,
        revenue
      });
    });

    return { results, totalUsers, totalSales, totalRevenue: totalSales * price };
  };

  const { results, totalUsers, totalSales, totalRevenue } = calculate();
  const conversionRate = ((totalSales / totalUsers) * 100).toFixed(1);

  const setPreset = (preset) => {
    if (preset === 'optimistic') {
      setRates({ veryHigh: 85, high: 70, medium: 50, low: 25, veryLow: 10 });
    } else if (preset === 'likely') {
      setRates({ veryHigh: 78, high: 56, medium: 34, low: 17, veryLow: 6 });
    } else if (preset === 'conservative') {
      setRates({ veryHigh: 65, high: 45, medium: 25, low: 10, veryLow: 3 });
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Device Sales Calculator</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-white rounded shadow">
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
        
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Preset Scenarios</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setPreset('optimistic')}
              className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Optimistic
            </button>
            <button 
              onClick={() => setPreset('likely')}
              className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Likely
            </button>
            <button 
              onClick={() => setPreset('conservative')}
              className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Conservative
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded shadow-md mb-4">
        <label className="block text-sm font-medium text-blue-800 mb-3">% of accounts in each category that will purchase</label>
        <div className="grid grid-cols-5 gap-2">
          {categories.map((cat, i) => (
            <div key={cat} className="text-center">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {categoryNames[i]}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rates[cat]}
                  onChange={(e) => setRates(prev => ({ ...prev, [cat]: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-1 border border-blue-300 rounded text-sm text-center pr-4 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  step="0.1"
                />
                <span className="absolute right-1 top-1 text-xs text-gray-400">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4 p-4 bg-white rounded shadow">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{totalUsers.toLocaleString()}</div>
          <div className="text-xs text-gray-600">Users</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{totalSales.toLocaleString()}</div>
          <div className="text-xs text-gray-600">Sales</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">{conversionRate}%</div>
          <div className="text-xs text-gray-600">Conversion</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-600">Device Revenue</div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-right">Users</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Sales</th>
              <th className="px-3 py-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, i) => (
              <tr key={i} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-3 py-2 font-medium">{result.category}</td>
                <td className="px-3 py-2 text-right">{result.users.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{result.rate}%</td>
                <td className="px-3 py-2 text-right font-medium">{result.sales.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">${result.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="px-3 py-2">TOTAL</td>
              <td className="px-3 py-2 text-right">{totalUsers.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">{conversionRate}%</td>
              <td className="px-3 py-2 text-right">{totalSales.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">${totalRevenue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">💡 Likelihood To Purchase Logic</h3>
        <div className="text-xs text-gray-700 space-y-2">
          <p><strong>Target Product:</strong> $300 carotenoid measurement device with tracking app to help distributors demonstrate SCS vitamin effectiveness</p>
          <p><strong>Survey Data Foundation:</strong> 75% interested in concept, 63% would purchase at $249, ~56% estimated at $300</p>
          <div>
            <p><strong>Scoring Model (100 points):</strong></p>
            <ul className="ml-4 mt-1 space-y-0.5">
              <li>• <strong>SCS Product Engagement (40%):</strong> Higher SCS purchases indicate greater need to demonstrate product effectiveness</li>
              <li>• <strong>Total Sales Volume (30%):</strong> High-volume sellers more likely to invest in professional sales tools</li>
              <li>• <strong>Subscription Behavior (20%):</strong> Subscribers show commitment to long-term product usage and results</li>
              <li>• <strong>SCS Subscription Activity (10%):</strong> Specific SCS subscription shows dedicated belief in these products</li>
            </ul>
          </div>
          <p><strong>Categories:</strong> Very High (75-100 pts), High (60-74), Medium (40-59), Low (20-39), Very Low (0-19)</p>
          <p><strong>Conversion Rates:</strong> Based on survey data adjusted by propensity segments. Survey shows 86% believe it helps attract new people, 85% think it increases SCS sales.</p>
          <p><strong>Business Logic:</strong> Device enables distributors to provide real-time proof of SCS vitamin effectiveness to prospects, supporting the 85% who believe it will help sell more SCS products and 86% who think it will attract new people.</p>
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
