// Auto-response handler for automatic confirmations
export class AutoResponseHandler {
  private isAutoMode: boolean = false;
  private pendingDataCollection: string[] = [];
  
  enableAutoMode() {
    this.isAutoMode = true;
  }
  
  disableAutoMode() {
    this.isAutoMode = false;
  }
  
  shouldAutoRespond(assistantMessage: string): boolean {
    if (!this.isAutoMode) return false;
    
    // Patterns that indicate Claude is asking for confirmation or explaining what it will do
    const confirmationPatterns = [
      /should i search/i,
      /may i search/i,
      /can i search/i,
      /let me search/i,
      /i'll search/i,
      /i will search/i,
      /i need to gather/i,
      /i'll need to collect/i,
      /i need to collect/i,
      /i'll gather/i,
      /i will gather/i,
      /let me gather/i,
      /would you like me to/i,
      /shall i proceed/i,
      /allow me to/i,
      /i'll proceed/i,
      /i will proceed/i,
      /to ensure accuracy/i,
      /to gather.*data/i,
      /i need.*real.*time.*data/i,
      /comprehensive.*data/i,
      /i'll create.*report/i,
      /i will create.*report/i,
      /let me create/i,
      /i'll generate/i,
      /i will generate/i,
      /to provide.*accurate/i,
      /i'll analyze/i,
      /i will analyze/i,
      /let me analyze/i,
      /i'll compile/i,
      /i will compile/i,
      /i'll look up/i,
      /i will look up/i,
      /let me look/i,
      /i'll fetch/i,
      /i will fetch/i,
      /to get.*latest/i,
      /to retrieve/i,
      /i'll retrieve/i,
      /i will retrieve/i
    ];
    
    return confirmationPatterns.some(pattern => pattern.test(assistantMessage));
  }
  
  getAutoResponse(): string {
    // Automatically approve any data gathering request
    return "Yes, proceed immediately with all data collection and generate the complete report. Search for everything needed and output the final HTML report.";
  }
  
  detectDataCollectionIntent(message: string): string[] {
    const dataPoints = [];
    
    if (/price|stock|quote/i.test(message)) dataPoints.push('stock_price');
    if (/financial|revenue|profit/i.test(message)) dataPoints.push('financials');
    if (/analyst|rating|target/i.test(message)) dataPoints.push('analyst_ratings');
    if (/news|recent|latest/i.test(message)) dataPoints.push('news');
    if (/technical|rsi|macd/i.test(message)) dataPoints.push('technical');
    if (/peer|competitor/i.test(message)) dataPoints.push('peers');
    
    return dataPoints;
  }
  
  generateInstantApproval(): string {
    return `Yes, automatically approved. Proceed with all searches and data collection immediately. Generate the complete HTML report with all real data. Do not ask for any more confirmations.`;
  }
}