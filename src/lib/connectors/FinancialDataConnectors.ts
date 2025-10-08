export interface DataConnector {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'database' | 'file' | 'websocket';
  config: Record<string, any>;
  testConnection: () => Promise<boolean>;
  query: (query: string, params?: any) => Promise<any>;
}

export class AlphaVantageConnector implements DataConnector {
  id = 'alpha-vantage';
  name = 'Alpha Vantage';
  description = 'Real-time and historical stock data, forex, and cryptocurrency';
  type = 'api' as const;
  config: { apiKey: string; baseUrl: string };

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://www.alphavantage.co/query',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=${this.config.apiKey}`
      );
      const data = await response.json();
      return !data['Error Message'] && !data['Note'];
    } catch {
      return false;
    }
  }

  async query(query: string, params?: any): Promise<any> {
    const { symbol, function: func, interval, outputsize } = params || {};
    
    const url = new URL(this.config.baseUrl);
    url.searchParams.set('function', func || 'TIME_SERIES_DAILY');
    url.searchParams.set('symbol', symbol || 'IBM');
    url.searchParams.set('apikey', this.config.apiKey);
    
    if (interval) url.searchParams.set('interval', interval);
    if (outputsize) url.searchParams.set('outputsize', outputsize);

    const response = await fetch(url.toString());
    return response.json();
  }
}

export class YahooFinanceConnector implements DataConnector {
  id = 'yahoo-finance';
  name = 'Yahoo Finance';
  description = 'Free stock quotes, news, and financial data';
  type = 'api' as const;
  config: { baseUrl: string };

  constructor() {
    this.config = {
      baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/AAPL`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async query(query: string, params?: any): Promise<any> {
    const { symbol, range, interval } = params || {};
    
    const url = new URL(`${this.config.baseUrl}/${symbol || 'AAPL'}`);
    if (range) url.searchParams.set('range', range);
    if (interval) url.searchParams.set('interval', interval);

    const response = await fetch(url.toString());
    return response.json();
  }
}

export class PolygonConnector implements DataConnector {
  id = 'polygon';
  name = 'Polygon.io';
  description = 'Real-time and historical market data for stocks, forex, and crypto';
  type = 'api' as const;
  config: { apiKey: string; baseUrl: string };

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.polygon.io',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/aggs/ticker/AAPL/prev?apikey=${this.config.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async query(query: string, params?: any): Promise<any> {
    const { symbol, from, to, timespan, multiplier } = params || {};
    
    const url = new URL(`${this.config.baseUrl}/v2/aggs/ticker/${symbol || 'AAPL'}/range/1/day/${from || '2024-01-01'}/${to || '2024-01-31'}`);
    url.searchParams.set('apikey', this.config.apiKey);
    
    if (timespan) url.searchParams.set('timespan', timespan);
    if (multiplier) url.searchParams.set('multiplier', multiplier);

    const response = await fetch(url.toString());
    return response.json();
  }
}

export class FREDConnector implements DataConnector {
  id = 'fred';
  name = 'Federal Reserve Economic Data (FRED)';
  description = 'Economic data from the Federal Reserve Bank of St. Louis';
  type = 'api' as const;
  config: { apiKey: string; baseUrl: string };

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.stlouisfed.org/fred',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/series/observations?series_id=GDP&api_key=${this.config.apiKey}&file_type=json`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async query(query: string, params?: any): Promise<any> {
    const { series_id, observation_start, observation_end } = params || {};
    
    const url = new URL(`${this.config.baseUrl}/series/observations`);
    url.searchParams.set('series_id', series_id || 'GDP');
    url.searchParams.set('api_key', this.config.apiKey);
    url.searchParams.set('file_type', 'json');
    
    if (observation_start) url.searchParams.set('observation_start', observation_start);
    if (observation_end) url.searchParams.set('observation_end', observation_end);

    const response = await fetch(url.toString());
    return response.json();
  }
}

export class QuandlConnector implements DataConnector {
  id = 'quandl';
  name = 'Quandl';
  description = 'Financial and economic data from various sources';
  type = 'api' as const;
  config: { apiKey: string; baseUrl: string };

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://www.quandl.com/api/v3',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/datasets/WIKI/AAPL.json?api_key=${this.config.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async query(query: string, params?: any): Promise<any> {
    const { dataset, start_date, end_date } = params || {};
    
    const url = new URL(`${this.config.baseUrl}/datasets/${dataset || 'WIKI/AAPL'}.json`);
    url.searchParams.set('api_key', this.config.apiKey);
    
    if (start_date) url.searchParams.set('start_date', start_date);
    if (end_date) url.searchParams.set('end_date', end_date);

    const response = await fetch(url.toString());
    return response.json();
  }
}

export class DatabaseConnector implements DataConnector {
  id = 'database';
  name = 'Database Connection';
  description = 'Connect to PostgreSQL, MySQL, or other databases';
  type = 'database' as const;
  config: { 
    host: string; 
    port: number; 
    database: string; 
    username: string; 
    password: string; 
    ssl: boolean;
  };

  constructor(config: DatabaseConnector['config']) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    try {
      // This would typically use a database driver like pg, mysql2, etc.
      // For now, we'll simulate a connection test
      return true;
    } catch {
      return false;
    }
  }

  async query(query: string, params?: any): Promise<any> {
    // This would execute the SQL query against the database
    // For now, we'll return a mock response
    return {
      rows: [],
      rowCount: 0,
      fields: [],
    };
  }
}

export class FileConnector implements DataConnector {
  id = 'file';
  name = 'File Upload';
  description = 'Upload CSV, Excel, or JSON files';
  type = 'file' as const;
  config: { file: File; type: 'csv' | 'excel' | 'json' };

  constructor(file: File, type: 'csv' | 'excel' | 'json') {
    this.config = { file, type };
  }

  async testConnection(): Promise<boolean> {
    return this.config.file instanceof File;
  }

  async query(query: string, params?: any): Promise<any> {
    const { file, type } = this.config;
    
    if (type === 'csv') {
      return this.parseCSV(file);
    } else if (type === 'json') {
      return this.parseJSON(file);
    } else if (type === 'excel') {
      return this.parseExcel(file);
    }
    
    throw new Error('Unsupported file type');
  }

  private async parseCSV(file: File): Promise<any> {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim();
      });
      return row;
    });
    return { headers, data };
  }

  private async parseJSON(file: File): Promise<any> {
    const text = await file.text();
    return JSON.parse(text);
  }

  private async parseExcel(file: File): Promise<any> {
    // This would use a library like xlsx to parse Excel files
    // For now, we'll return a mock response
    return {
      sheets: [],
      data: [],
    };
  }
}

// Connector factory
export class ConnectorFactory {
  static createConnector(type: string, config: any): DataConnector {
    switch (type) {
      case 'alpha-vantage':
        return new AlphaVantageConnector(config.apiKey);
      case 'yahoo-finance':
        return new YahooFinanceConnector();
      case 'polygon':
        return new PolygonConnector(config.apiKey);
      case 'fred':
        return new FREDConnector(config.apiKey);
      case 'quandl':
        return new QuandlConnector(config.apiKey);
      case 'database':
        return new DatabaseConnector(config);
      case 'file':
        return new FileConnector(config.file, config.type);
      default:
        throw new Error(`Unknown connector type: ${type}`);
    }
  }

  static getAvailableConnectors(): Array<{ id: string; name: string; description: string; type: string }> {
    return [
      { id: 'alpha-vantage', name: 'Alpha Vantage', description: 'Real-time and historical stock data', type: 'api' },
      { id: 'yahoo-finance', name: 'Yahoo Finance', description: 'Free stock quotes and financial data', type: 'api' },
      { id: 'polygon', name: 'Polygon.io', description: 'Real-time market data for stocks and crypto', type: 'api' },
      { id: 'fred', name: 'FRED', description: 'Federal Reserve Economic Data', type: 'api' },
      { id: 'quandl', name: 'Quandl', description: 'Financial and economic data', type: 'api' },
      { id: 'database', name: 'Database', description: 'Connect to databases', type: 'database' },
      { id: 'file', name: 'File Upload', description: 'Upload CSV, Excel, or JSON files', type: 'file' },
    ];
  }
}
