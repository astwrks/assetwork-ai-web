'use client';

import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { Badge } from 'primereact/badge';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Divider } from 'primereact/divider';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Percent,
  Clock,
  Download,
  Calendar as CalendarIcon,
  Settings,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  LineChart,
  Globe,
  Sparkles,
  Shield,
  RefreshCw
} from 'lucide-react';
import { useState } from 'react';
import { cn, formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

export default function PrimeReactDemo() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Enterprise Dashboard Data
  const performanceMetrics = [
    {
      id: 1,
      metric: 'Total Revenue',
      value: 2847293,
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      color: '#1B2951'
    },
    {
      id: 2,
      metric: 'Active Users',
      value: 48392,
      change: 8.2,
      trend: 'up',
      icon: Users,
      color: '#405D80'
    },
    {
      id: 3,
      metric: 'Conversion Rate',
      value: 3.24,
      change: -0.4,
      trend: 'down',
      icon: Percent,
      color: '#FD7E14',
      isPercentage: true
    },
    {
      id: 4,
      metric: 'Avg. Session',
      value: '8m 42s',
      change: 2.1,
      trend: 'up',
      icon: Clock,
      color: '#28A745'
    },
  ];

  const recentTransactions = [
    { id: 'TXN-94821', client: 'Acme Corporation', amount: 45780, status: 'Completed', date: '2025-10-08', type: 'Enterprise', priority: 'high' },
    { id: 'TXN-94820', client: 'TechStart Inc.', amount: 12450, status: 'Processing', date: '2025-10-08', type: 'Professional', priority: 'medium' },
    { id: 'TXN-94819', client: 'Global Finance Ltd.', amount: 89320, status: 'Completed', date: '2025-10-07', type: 'Enterprise', priority: 'high' },
    { id: 'TXN-94818', client: 'Innovation Hub', amount: 23150, status: 'Pending', date: '2025-10-07', type: 'Standard', priority: 'low' },
    { id: 'TXN-94817', client: 'Market Leaders Co.', amount: 67890, status: 'Completed', date: '2025-10-06', type: 'Enterprise', priority: 'high' },
    { id: 'TXN-94816', client: 'Digital Solutions', amount: 34520, status: 'Completed', date: '2025-10-06', type: 'Professional', priority: 'medium' },
  ];

  const regionData = [
    { region: 'North America', revenue: 1240000, growth: 15.2, customers: 18234, trend: 'up' },
    { region: 'Europe', revenue: 890000, growth: 12.8, customers: 14521, trend: 'up' },
    { region: 'Asia Pacific', revenue: 567000, growth: 24.5, customers: 9847, trend: 'up' },
    { region: 'Latin America', revenue: 150293, growth: 8.3, customers: 5790, trend: 'up' },
  ];

  const regions = [
    { label: 'All Regions', value: null },
    { label: 'North America', value: 'NA' },
    { label: 'Europe', value: 'EU' },
    { label: 'Asia Pacific', value: 'APAC' },
    { label: 'Latin America', value: 'LATAM' },
  ];

  // Chart configurations
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [
      {
        label: 'Revenue',
        data: [185000, 192000, 201000, 198000, 215000, 228000, 242000, 251000, 268000, 284729],
        fill: true,
        borderColor: '#1B2951',
        backgroundColor: 'rgba(27, 41, 81, 0.08)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#1B2951',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Target',
        data: [180000, 190000, 200000, 210000, 220000, 230000, 240000, 250000, 260000, 270000],
        fill: false,
        borderColor: '#6C7B95',
        borderDash: [8, 4],
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const distributionChartData = {
    labels: ['Enterprise', 'Professional', 'Standard', 'Trial'],
    datasets: [
      {
        data: [42, 28, 20, 10],
        backgroundColor: ['#1B2951', '#405D80', '#6C7B95', '#E8F4FD'],
        hoverBackgroundColor: ['#0F1529', '#2C4766', '#5A6A82', '#D1E8FA'],
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#FFFFFF',
      },
    ],
  };

  const regionalChartData = {
    labels: ['North America', 'Europe', 'Asia Pacific', 'Latin America'],
    datasets: [
      {
        label: 'Revenue ($K)',
        data: [1240, 890, 567, 150],
        backgroundColor: '#1B2951',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#2C3E50',
          font: {
            family: 'Euclid Circular A, sans-serif',
            size: 13,
            weight: 600,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#1B2951',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#6C7B95',
        borderWidth: 1,
        padding: 16,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#6C7B95',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 8,
        },
        grid: {
          color: 'rgba(233, 236, 239, 0.5)',
          drawBorder: false,
          lineWidth: 1,
        },
      },
      y: {
        ticks: {
          color: '#6C7B95',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 12,
        },
        grid: {
          color: 'rgba(233, 236, 239, 0.5)',
          drawBorder: false,
          lineWidth: 1,
        },
      },
    },
  };

  const pieOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#2C3E50',
          font: {
            family: 'Euclid Circular A, sans-serif',
            size: 13,
            weight: 500,
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      tooltip: {
        backgroundColor: '#1B2951',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#6C7B95',
        borderWidth: 1,
        padding: 16,
        cornerRadius: 12,
      },
    },
    cutout: '65%',
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        beginAtZero: true,
      },
    },
  };

  // Templates
  const statusBodyTemplate = (rowData: any) => {
    const severity = rowData.status === 'Completed' ? 'success' : rowData.status === 'Processing' ? 'info' : 'warning';
    return (
      <Tag
        value={rowData.status}
        severity={severity}
        style={{ fontWeight: 600, fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
      />
    );
  };

  const typeBodyTemplate = (rowData: any) => {
    const color = rowData.type === 'Enterprise' ? '#1B2951' : rowData.type === 'Professional' ? '#405D80' : '#6C7B95';
    return (
      <Chip
        label={rowData.type}
        style={{
          backgroundColor: color,
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '0.8125rem',
          padding: '0.375rem 0.875rem'
        }}
      />
    );
  };

  const amountBodyTemplate = (rowData: any) => {
    return <span className="font-bold text-base" style={{ color: '#1B2951' }}>{formatCurrency(rowData.amount)}</span>;
  };

  const priorityBodyTemplate = (rowData: any) => {
    const config = {
      high: { color: '#DC3545', label: 'High' },
      medium: { color: '#FD7E14', label: 'Medium' },
      low: { color: '#6C7B95', label: 'Low' },
    };
    const { color, label } = config[rowData.priority as keyof typeof config];
    return (
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
        <span style={{ color, fontWeight: 600, fontSize: '0.875rem' }}>{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F8F9FA 0%, #FFFFFF 100%)' }}>
      {/* Premium Header with refined spacing */}
      <div
        className="relative overflow-hidden border-b"
        style={{
          background: 'linear-gradient(135deg, #1B2951 0%, #2C3E50 50%, #1B2951 100%)',
          boxShadow: '0 4px 20px rgba(27, 41, 81, 0.15)',
          borderBottom: '1px solid rgba(108, 123, 149, 0.1)'
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />

        <div className="max-w-[1400px] mx-auto px-10 py-10 relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Title Section with better spacing */}
              <div className="flex items-center gap-5 mb-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  <Sparkles className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-[3rem] font-bold text-white mb-2 tracking-tight leading-none">
                    Enterprise Analytics
                  </h1>
                  <p className="text-xl text-white/90 font-medium">
                    AssetWorks Intelligence Platform
                  </p>
                </div>
              </div>

              <p className="text-base text-white/80 mb-8 max-w-2xl leading-relaxed">
                Real-time business intelligence, advanced reporting, and predictive analytics
                for data-driven enterprise decision-making
              </p>

              {/* Action buttons with better spacing */}
              <div className="flex gap-4">
                <Button
                  label="Export Dashboard"
                  icon={<Download className="w-4 h-4 mr-2" />}
                  className="px-6 py-3"
                  style={{
                    backgroundColor: 'white',
                    color: '#1B2951',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Button
                  label="Schedule Report"
                  icon={<CalendarIcon className="w-4 h-4 mr-2" />}
                  className="px-6 py-3"
                  outlined
                  style={{
                    borderColor: 'white',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    borderRadius: '10px',
                    borderWidth: '2px'
                  }}
                />
                <Button
                  icon={<Settings className="w-4 h-4" />}
                  text
                  style={{ color: 'white', fontSize: '0.9375rem' }}
                  className="px-4 py-3"
                />
              </div>
            </div>

            {/* Status Card with refined design */}
            <Card
              className="shadow-2xl border-0"
              style={{
                backgroundColor: 'rgba(255,255,255,0.98)',
                minWidth: '260px',
                borderRadius: '16px',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div className="text-center px-2 py-1">
                <p className="text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: '#6C7B95', letterSpacing: '0.05em' }}>
                  Last Updated
                </p>
                <p className="text-3xl font-bold mb-1" style={{ color: '#1B2951' }}>14:32</p>
                <p className="text-sm mb-4" style={{ color: '#6C7B95' }}>Oct 9, 2025 UTC</p>

                <Divider className="my-4" />

                <div className="flex items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28A745' }}></div>
                    <div
                      className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
                      style={{ backgroundColor: '#28A745', opacity: 0.4 }}
                    ></div>
                  </div>
                  <span className="font-semibold text-sm" style={{ color: '#28A745' }}>
                    All Systems Online
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-10">
        {/* Advanced Filters with better spacing */}
        <Card
          className="mb-10 border-0"
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
          }}
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Filter className="w-5 h-5" style={{ color: '#1B2951' }} />
              <h3 className="text-xl font-bold" style={{ color: '#1B2951' }}>
                Advanced Filters
              </h3>
            </div>
            <p className="text-sm" style={{ color: '#6C7B95' }}>
              Customize your dashboard view with precision filters and date ranges
            </p>
          </div>

          <div className="grid grid-cols-4 gap-5">
            <div>
              <label className="block text-sm font-bold mb-3" style={{ color: '#2C3E50' }}>
                Date Range
              </label>
              <Calendar
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.value as Date)}
                showIcon
                placeholder="Select Date"
                className="w-full"
                style={{ borderRadius: '10px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-3" style={{ color: '#2C3E50' }}>
                Region
              </label>
              <Dropdown
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.value)}
                options={regions}
                placeholder="All Regions"
                className="w-full"
                style={{ borderRadius: '10px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-3" style={{ color: '#2C3E50' }}>
                Search
              </label>
              <span className="p-input-icon-left w-full">
                <Search className="w-4 h-4 ml-3" style={{ color: '#6C7B95' }} />
                <InputText
                  placeholder="Search transactions..."
                  className="w-full pl-10"
                  style={{ borderRadius: '10px' }}
                />
              </span>
            </div>
            <div className="flex items-end gap-3">
              <Button
                label="Apply"
                icon={<CheckCircle className="w-4 h-4 mr-2" />}
                className="flex-1"
                style={{ borderRadius: '10px', height: '44px' }}
              />
              <Button
                icon={<RefreshCw className="w-4 h-4" />}
                severity="secondary"
                style={{ borderRadius: '10px', width: '44px', height: '44px' }}
              />
            </div>
          </div>
        </Card>

        {/* Premium KPI Cards with refined spacing */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {performanceMetrics.map((metric) => {
            const Icon = metric.icon;
            const isPositive = metric.change > 0;

            return (
              <Card
                key={metric.id}
                className="border-0 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                style={{
                  borderRadius: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Gradient overlay on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                  style={{ background: `linear-gradient(135deg, ${metric.color} 0%, transparent 100%)` }}
                />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${metric.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: metric.color }} strokeWidth={2.5} />
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                      style={{
                        backgroundColor: isPositive ? '#28A74510' : '#DC354510'
                      }}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5" style={{ color: '#28A745' }} strokeWidth={2.5} />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" style={{ color: '#DC3545' }} strokeWidth={2.5} />
                      )}
                      <span
                        className="text-xs font-bold"
                        style={{ color: isPositive ? '#28A745' : '#DC3545' }}
                      >
                        {formatPercentage(metric.change)}
                      </span>
                    </div>
                  </div>

                  {/* Metric label */}
                  <p className="text-sm font-semibold mb-2 tracking-wide uppercase" style={{ color: '#6C7B95', letterSpacing: '0.025em' }}>
                    {metric.metric}
                  </p>

                  {/* Value */}
                  <div className="text-3xl font-bold mb-1" style={{ color: '#1B2951' }}>
                    {typeof metric.value === 'number'
                      ? metric.isPercentage
                        ? `${metric.value}%`
                        : formatNumber(metric.value)
                      : metric.value
                    }
                  </div>

                  {/* Comparison text */}
                  <p className="text-xs font-medium" style={{ color: '#6C7B95' }}>
                    vs last month
                  </p>

                  {/* Progress bar */}
                  <div className="mt-5">
                    <ProgressBar
                      value={75}
                      showValue={false}
                      style={{ height: '5px', borderRadius: '10px' }}
                      color={metric.color}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Charts Section with refined spacing */}
        <div className="grid grid-cols-3 gap-8 mb-10">
          {/* Revenue Chart */}
          <Card
            className="col-span-2 border-0"
            style={{
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#1B295115' }}
                  >
                    <LineChart className="w-6 h-6" style={{ color: '#1B2951' }} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: '#1B2951' }}>
                      Revenue Performance
                    </h3>
                    <p className="text-sm" style={{ color: '#6C7B95' }}>
                      10-month trend analysis with targets
                    </p>
                  </div>
                </div>
                <Badge
                  value="YTD"
                  style={{
                    backgroundColor: '#28A745',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.75rem'
                  }}
                />
              </div>
            </div>
            <div style={{ height: '400px', padding: '1rem 0' }}>
              <Chart type="line" data={revenueChartData} options={chartOptions} />
            </div>
          </Card>

          {/* Distribution Chart */}
          <Card
            className="border-0"
            style={{
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#1B295115' }}
                >
                  <PieChart className="w-6 h-6" style={{ color: '#1B2951' }} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: '#1B2951' }}>
                    Customer Mix
                  </h3>
                  <p className="text-sm" style={{ color: '#6C7B95' }}>
                    By subscription tier
                  </p>
                </div>
              </div>
            </div>
            <div style={{ height: '400px', padding: '1rem 0' }}>
              <Chart type="doughnut" data={distributionChartData} options={pieOptions} />
            </div>
          </Card>
        </div>

        {/* Data Tables with refined styling */}
        <Card
          className="border-0"
          style={{
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
          }}
        >
          <TabView>
            <TabPanel
              header={
                <div className="flex items-center gap-3 px-2 py-1">
                  <BarChart3 className="w-4 h-4" style={{ color: '#1B2951' }} />
                  <span className="font-bold text-sm">Transaction History</span>
                  <Badge value={recentTransactions.length} severity="info" />
                </div>
              }
            >
              <DataTable
                value={recentTransactions}
                paginator
                rows={10}
                stripedRows
                showGridlines
                responsiveLayout="scroll"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} transactions"
                rowsPerPageOptions={[5,10,25,50]}
                style={{ fontSize: '0.9375rem' }}
              >
                <Column
                  field="id"
                  header="Transaction ID"
                  sortable
                  style={{ minWidth: '150px', fontWeight: 600, color: '#1B2951', padding: '1rem' }}
                />
                <Column
                  field="client"
                  header="Client Name"
                  sortable
                  style={{ minWidth: '200px', fontWeight: 500, padding: '1rem' }}
                />
                <Column
                  field="amount"
                  header="Amount"
                  body={amountBodyTemplate}
                  sortable
                  style={{ minWidth: '150px', padding: '1rem' }}
                />
                <Column
                  field="type"
                  header="Tier"
                  body={typeBodyTemplate}
                  sortable
                  style={{ minWidth: '140px', padding: '1rem' }}
                />
                <Column
                  field="priority"
                  header="Priority"
                  body={priorityBodyTemplate}
                  sortable
                  style={{ minWidth: '120px', padding: '1rem' }}
                />
                <Column
                  field="status"
                  header="Status"
                  body={statusBodyTemplate}
                  sortable
                  style={{ minWidth: '140px', padding: '1rem' }}
                />
                <Column
                  field="date"
                  header="Date"
                  sortable
                  style={{ minWidth: '120px', color: '#6C7B95', padding: '1rem' }}
                />
              </DataTable>
            </TabPanel>

            <TabPanel
              header={
                <div className="flex items-center gap-3 px-2 py-1">
                  <Globe className="w-4 h-4" style={{ color: '#1B2951' }} />
                  <span className="font-bold text-sm">Regional Analytics</span>
                </div>
              }
            >
              <div className="mb-8">
                <div style={{ height: '320px' }}>
                  <Chart type="bar" data={regionalChartData} options={barOptions} />
                </div>
              </div>
              <Divider />
              <DataTable
                value={regionData}
                stripedRows
                responsiveLayout="scroll"
              >
                <Column
                  field="region"
                  header="Region"
                  sortable
                  style={{ minWidth: '180px', fontWeight: 600, color: '#1B2951', padding: '1rem' }}
                />
                <Column
                  field="revenue"
                  header="Revenue"
                  sortable
                  body={(rowData) => (
                    <span className="font-bold text-base" style={{ color: '#1B2951' }}>
                      {formatCurrency(rowData.revenue)}
                    </span>
                  )}
                  style={{ minWidth: '150px', padding: '1rem' }}
                />
                <Column
                  field="growth"
                  header="Growth Rate"
                  sortable
                  body={(rowData) => (
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-4 h-4" style={{ color: '#28A745' }} strokeWidth={2.5} />
                      <span className="font-bold text-base" style={{ color: '#28A745' }}>
                        {formatPercentage(rowData.growth)}
                      </span>
                    </div>
                  )}
                  style={{ minWidth: '140px', padding: '1rem' }}
                />
                <Column
                  field="customers"
                  header="Active Customers"
                  sortable
                  body={(rowData) => (
                    <span className="font-semibold" style={{ color: '#2C3E50' }}>
                      {formatNumber(rowData.customers)}
                    </span>
                  )}
                  style={{ minWidth: '150px', padding: '1rem' }}
                />
                <Column
                  header="Market Performance"
                  body={(rowData) => (
                    <div className="flex flex-col gap-2.5">
                      <ProgressBar
                        value={(rowData.revenue / 1240000) * 100}
                        showValue={false}
                        style={{ height: '8px', borderRadius: '10px' }}
                        color="#1B2951"
                      />
                      <span className="text-xs font-semibold" style={{ color: '#6C7B95' }}>
                        {((rowData.revenue / 1240000) * 100).toFixed(1)}% of market leader
                      </span>
                    </div>
                  )}
                  style={{ minWidth: '220px', padding: '1rem' }}
                />
              </DataTable>
            </TabPanel>
          </TabView>
        </Card>

        {/* Footer with better spacing */}
        <div className="text-center py-10 mt-10">
          <Divider />
          <div className="flex items-center justify-center gap-4 mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#1B2951' }}
            >
              <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-bold text-base" style={{ color: '#1B2951' }}>
                AssetWorks Intelligence Platform
              </p>
              <p className="text-sm" style={{ color: '#6C7B95' }}>
                Enterprise Analytics • Powered by PrimeReact • Official Brand Guidelines
              </p>
            </div>
          </div>
          <p className="text-xs" style={{ color: '#6C7B95' }}>
            © 2025 AssetWorks. All data encrypted and secured. Compliance: SOC 2, ISO 27001
          </p>
        </div>
      </div>
    </div>
  );
}
