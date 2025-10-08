'use client';

import { useState, useEffect } from 'react';
import { DataSource } from '@/types/report.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Globe, 
  FileText, 
  Wifi, 
  Plus, 
  Settings, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';

interface DataSourceManagerProps {
  onDataSourceUpdate?: (sources: DataSource[]) => void;
}

const dataSourceTypes = [
  { id: 'database', name: 'Database', icon: Database, description: 'PostgreSQL, MySQL, SQLite' },
  { id: 'api', name: 'REST API', icon: Globe, description: 'HTTP/HTTPS endpoints' },
  { id: 'file', name: 'File Upload', icon: FileText, description: 'CSV, Excel, JSON files' },
  { id: 'websocket', name: 'WebSocket', icon: Wifi, description: 'Real-time data streams' },
];

export default function DataSourceManager({ onDataSourceUpdate }: DataSourceManagerProps) {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    connectionString: '',
    credentials: {} as Record<string, any>,
  });
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Mock initial data sources
  useEffect(() => {
    const mockSources: DataSource[] = [
      {
        id: 'db-1',
        name: 'Production Database',
        type: 'database',
        connectionString: 'postgresql://user:pass@localhost:5432/finance',
        status: 'connected',
        lastSync: new Date(),
      },
      {
        id: 'api-1',
        name: 'Market Data API',
        type: 'api',
        connectionString: 'https://api.marketdata.com/v1',
        status: 'connected',
        lastSync: new Date(Date.now() - 300000), // 5 minutes ago
      },
      {
        id: 'file-1',
        name: 'Quarterly Reports',
        type: 'file',
        status: 'disconnected',
      },
    ];
    setSources(mockSources);
  }, []);

  const handleAddSource = () => {
    setIsAdding(true);
    setSelectedType('');
    setFormData({ name: '', connectionString: '', credentials: {} });
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSource: DataSource = {
      id: `source-${Date.now()}`,
      name: formData.name,
      type: selectedType as DataSource['type'],
      connectionString: formData.connectionString,
      credentials: formData.credentials,
      status: 'disconnected',
    };

    setSources(prev => [...prev, newSource]);
    setIsAdding(false);
    setFormData({ name: '', connectionString: '', credentials: {} });
    
    if (onDataSourceUpdate) {
      onDataSourceUpdate([...sources, newSource]);
    }
  };

  const handleTestConnection = async (sourceId: string) => {
    setTestingConnection(sourceId);
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSources(prev => prev.map(source => 
      source.id === sourceId 
        ? { 
            ...source, 
            status: Math.random() > 0.3 ? 'connected' : 'error',
            lastSync: new Date()
          }
        : source
    ));
    
    setTestingConnection(null);
  };

  const handleDeleteSource = (sourceId: string) => {
    setSources(prev => prev.filter(source => source.id !== sourceId));
    
    if (onDataSourceUpdate) {
      onDataSourceUpdate(sources.filter(source => source.id !== sourceId));
    }
  };

  const getStatusIcon = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Data Sources</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your data connections for report generation
          </p>
        </div>
        <Button onClick={handleAddSource} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Source</span>
        </Button>
      </div>

      {/* Add New Source Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Data Source</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedType ? (
              <div className="grid grid-cols-2 gap-4">
                {dataSourceTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-6 w-6 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {type.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Source Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter source name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="connection">
                    {selectedType === 'database' && 'Connection String'}
                    {selectedType === 'api' && 'API Endpoint URL'}
                    {selectedType === 'file' && 'File Path (optional)'}
                    {selectedType === 'websocket' && 'WebSocket URL'}
                  </Label>
                  <Input
                    id="connection"
                    value={formData.connectionString}
                    onChange={(e) => setFormData(prev => ({ ...prev, connectionString: e.target.value }))}
                    placeholder={
                      selectedType === 'database' ? 'postgresql://user:pass@host:port/dbname' :
                      selectedType === 'api' ? 'https://api.example.com/v1' :
                      selectedType === 'websocket' ? 'wss://stream.example.com' :
                      '/path/to/file.csv'
                    }
                    required={selectedType !== 'file'}
                  />
                </div>

                {selectedType === 'database' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.credentials.username || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          credentials: { ...prev.credentials, username: e.target.value }
                        }))}
                        placeholder="Database username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.credentials.password || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          credentials: { ...prev.credentials, password: e.target.value }
                        }))}
                        placeholder="Database password"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button type="submit">Add Source</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Sources List */}
      <div className="grid grid-cols-1 gap-4">
        {sources.map((source) => {
          const typeConfig = dataSourceTypes.find(t => t.id === source.type);
          const Icon = typeConfig?.icon || Database;
          
          return (
            <Card key={source.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {source.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {typeConfig?.name} • {source.connectionString}
                      </p>
                      {source.lastSync && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Last sync: {source.lastSync.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(source.status)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(source.status)}`}>
                        {getStatusText(source.status)}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(source.id)}
                      disabled={testingConnection === source.id}
                      className="h-8 w-8 p-0"
                    >
                      {testingConnection === source.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSource(source.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sources.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No data sources connected
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Connect your data sources to start generating reports
          </p>
          <Button onClick={handleAddSource}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Source
          </Button>
        </div>
      )}
    </div>
  );
}
