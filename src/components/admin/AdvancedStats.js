import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Download,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { CSVLink } from 'react-csv';

const AdvancedStats = () => {
  const [stats, setStats] = useState({
    overview: {},
    monthlyData: [],
    categoryData: [],
    dailyTrends: [],
    topUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('monthly');

  useEffect(() => {
    loadAdvancedStats();
  }, []);

  const loadAdvancedStats = async () => {
    setLoading(true);
    try {
      const mockStats = {
        overview: {
          totalBookings: 247,
          pendingBookings: 12,
          confirmedBookings: 198,
          cancelledBookings: 37,
          monthlyGrowth: 15.3,
          avgBookingsPerDay: 8.2
        },
        monthlyData: [
          { month: 'Gen', bookings: 45, events: 12, revenue: 2400 },
          { month: 'Feb', bookings: 52, events: 15, revenue: 2800 },
          { month: 'Mar', bookings: 48, events: 18, revenue: 3200 },
          { month: 'Apr', bookings: 61, events: 22, revenue: 3800 },
          { month: 'Mag', bookings: 55, events: 19, revenue: 3400 },
          { month: 'Giu', bookings: 67, events: 25, revenue: 4200 }
        ],
        categoryData: [
          { name: 'Normali', value: 156, color: '#6366F1' },
          { name: 'Eventi', value: 91, color: '#3B82F6' },
          { name: 'VIP', value: 23, color: '#10B981' },
          { name: 'Gruppi', value: 37, color: '#F59E0B' }
        ],
        dailyTrends: [
          { day: 'Lun', morning: 5, afternoon: 8, evening: 12 },
          { day: 'Mar', morning: 7, afternoon: 11, evening: 15 },
          { day: 'Mer', morning: 6, afternoon: 9, evening: 14 },
          { day: 'Gio', morning: 8, afternoon: 13, evening: 18 },
          { day: 'Ven', morning: 12, afternoon: 16, evening: 22 },
          { day: 'Sab', morning: 15, afternoon: 20, evening: 25 },
          { day: 'Dom', morning: 10, afternoon: 14, evening: 19 }
        ],
        topUsers: [
          { name: 'Mario Rossi', bookings: 12, spent: 850 },
          { name: 'Laura Bianchi', bookings: 9, spent: 720 },
          { name: 'Giuseppe Verdi', bookings: 8, spent: 640 },
          { name: 'Anna Neri', bookings: 7, spent: 580 },
          { name: 'Marco Blu', bookings: 6, spent: 520 }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
    setLoading(false);
  };

  const csvData = stats.monthlyData.map(item => ({
    Mese: item.month,
    Prenotazioni: item.bookings,
    Eventi: item.events,
    Ricavi: item.revenue
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale Prenotazioni</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.totalBookings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+{stats.overview.monthlyGrowth}% questo mese</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Attesa</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.overview.pendingBookings}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Richiedono conferma</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confermate</p>
              <p className="text-2xl font-bold text-green-600">{stats.overview.confirmedBookings}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Media {stats.overview.avgBookingsPerDay}/giorno</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancellate</p>
              <p className="text-2xl font-bold text-red-600">{stats.overview.cancelledBookings}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">{((stats.overview.cancelledBookings / stats.overview.totalBookings) * 100).toFixed(1)}% del totale</span>
          </div>
        </motion.div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Analisi Dettagliate</h3>
          
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setActiveChart('monthly')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeChart === 'monthly'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Mensile
              </button>
              <button
                onClick={() => setActiveChart('category')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeChart === 'category'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PieChartIcon className="w-4 h-4 inline mr-1" />
                Categorie
              </button>
              <button
                onClick={() => setActiveChart('daily')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeChart === 'daily'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Giornaliero
              </button>
            </div>

            <CSVLink
              data={csvData}
              filename="statistiche-prenotazioni.csv"
              className="btn btn-outline btn-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </CSVLink>
          </div>
        </div>

        <div className="h-80">
          {activeChart === 'monthly' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#6366F1" name="Prenotazioni" />
                <Bar dataKey="events" fill="#3B82F6" name="Eventi" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'category' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => name + ' ' + (percent * 100).toFixed(0) + '%'}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={'cell-' + index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'daily' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="morning" 
                  stackId="1" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  name="Mattina"
                />
                <Area 
                  type="monotone" 
                  dataKey="afternoon" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  name="Pomeriggio"
                />
                <Area 
                  type="monotone" 
                  dataKey="evening" 
                  stackId="1" 
                  stroke="#6366F1" 
                  fill="#6366F1" 
                  name="Sera"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clienti</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Prenotazioni</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Spesa Totale</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Media</th>
              </tr>
            </thead>
            <tbody>
              {stats.topUsers.map((user, index) => (
                <motion.tr
                  key={user.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-primary-600">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.bookings}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900">€{user.spent}</td>
                  <td className="py-3 px-4 text-gray-600">€{(user.spent / user.bookings).toFixed(0)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStats; 