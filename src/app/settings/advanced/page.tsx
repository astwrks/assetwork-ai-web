'use client';

import React, { useState } from 'react';
import { Settings, Database, Globe, FileText, Users, Download, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useWebSocket } from '@/hooks/useWebSocket';
import { DomainCustomizer, DOMAIN_CONFIGS } from '@/lib/ai/DomainCustomizer';
import { ConnectorFactory } from '@/lib/connectors/FinancialDataConnectors';

export default function AdvancedSettingsPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [websocketEnabled, setWebsocketEnabled] = useState(false);
  const [realTimeData, setRealTimeData] = useState(false);
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [pdfExportEnabled, setPdfExportEnabled] = useState(true);
  const [advancedCharts, setAdvancedCharts] = useState(true);
  const [aiCustomization, setAiCustomization] = useState(true);

  const domainCustomizer = new DomainCustomizer(selectedDomain);
  const availableConnectors = ConnectorFactory.getAvailableConnectors();

  const { isConnected, connectionState } = useWebSocket({
    url: 'ws://localhost:8080/ws',
    autoConnect: websocketEnabled,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Advanced Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure advanced features and integrations for your Financial Report Builder
          </p>
        </div>

        <Tabs defaultValue="data-sources" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
            <TabsTrigger value="real-time">Real-time</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="ai-customization">AI Customization</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* Data Sources Tab */}
          <TabsContent value="data-sources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Data Source Connectors</span>
                </CardTitle>
                <CardDescription>
                  Configure connections to various financial data sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableConnectors.map((connector) => (
                    <Card key={connector.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{connector.name}</h3>
                        <Badge variant="outline">{connector.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {connector.description}
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Configure
                      </Button>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Real-time Data Tab */}
          <TabsContent value="real-time" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Real-time Data Streaming</span>
                </CardTitle>
                <CardDescription>
                  Configure WebSocket connections for live financial data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="websocket-enabled">Enable WebSocket Streaming</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect to real-time data feeds for live market updates
                    </p>
                  </div>
                  <Switch
                    id="websocket-enabled"
                    checked={websocketEnabled}
                    onCheckedChange={setWebsocketEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="real-time-data">Real-time Data Updates</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically update charts and reports with live data
                    </p>
                  </div>
                  <Switch
                    id="real-time-data"
                    checked={realTimeData}
                    onCheckedChange={setRealTimeData}
                  />
                </div>

                {websocketEnabled && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-medium">
                        Connection Status: {connectionState}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      WebSocket server: ws://localhost:8080/ws
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Team Collaboration</span>
                </CardTitle>
                <CardDescription>
                  Enable real-time collaboration features for team members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="collaboration-enabled">Enable Collaboration</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow multiple users to work on reports simultaneously
                    </p>
                  </div>
                  <Switch
                    id="collaboration-enabled"
                    checked={collaborationEnabled}
                    onCheckedChange={setCollaborationEnabled}
                  />
                </div>

                {collaborationEnabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="collaboration-server">Collaboration Server</Label>
                        <Input
                          id="collaboration-server"
                          placeholder="ws://localhost:8080/collaboration"
                          defaultValue="ws://localhost:8080/collaboration"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-collaborators">Max Collaborators</Label>
                        <Input
                          id="max-collaborators"
                          type="number"
                          placeholder="10"
                          defaultValue="10"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Collaboration Features
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Real-time cursor tracking</li>
                        <li>• Live text editing</li>
                        <li>• User presence indicators</li>
                        <li>• Comment and annotation system</li>
                        <li>• Version control and history</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Export Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure export formats and options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pdf-export">PDF Export</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable PDF generation with professional formatting
                    </p>
                  </div>
                  <Switch
                    id="pdf-export"
                    checked={pdfExportEnabled}
                    onCheckedChange={setPdfExportEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="advanced-charts">Advanced Charts</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable treemaps, heatmaps, radar charts, and sankey diagrams
                    </p>
                  </div>
                  <Switch
                    id="advanced-charts"
                    checked={advancedCharts}
                    onCheckedChange={setAdvancedCharts}
                  />
                </div>

                {pdfExportEnabled && (
                  <div className="space-y-4">
                    <Separator />
                    <h4 className="font-medium">PDF Export Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pdf-format">Page Format</Label>
                        <Select defaultValue="a4">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a4">A4</SelectItem>
                            <SelectItem value="letter">Letter</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="pdf-orientation">Orientation</Label>
                        <Select defaultValue="portrait">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Customization Tab */}
          <TabsContent value="ai-customization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>AI Domain Customization</span>
                </CardTitle>
                <CardDescription>
                  Customize AI prompts and workflows for your specific industry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-customization">Enable AI Customization</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tailor AI responses to your industry and use case
                    </p>
                  </div>
                  <Switch
                    id="ai-customization"
                    checked={aiCustomization}
                    onCheckedChange={setAiCustomization}
                  />
                </div>

                {aiCustomization && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="domain-selection">Industry Domain</Label>
                      <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry domain" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOMAIN_CONFIGS.map((domain) => (
                            <SelectItem key={domain.id} value={domain.id}>
                              {domain.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedDomain && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Selected Domain: {domainCustomizer.getCurrentDomain()?.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {domainCustomizer.getCurrentDomain()?.description}
                        </p>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Key Metrics: </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {domainCustomizer.getRelevantMetrics().slice(0, 3).join(', ')}...
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Regulations: </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {domainCustomizer.getRelevantRegulations().slice(0, 3).join(', ')}...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>External Integrations</span>
                </CardTitle>
                <CardDescription>
                  Connect with external services and APIs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">OpenAI API</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Configure OpenAI API for AI-powered report generation
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Configure
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">LangChain</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Multi-agent AI orchestration framework
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Configure
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Database Connections</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Connect to PostgreSQL, MySQL, or other databases
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Configure
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Cloud Storage</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Integrate with AWS S3, Google Cloud, or Azure
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Configure
                    </Button>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end space-x-4">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
