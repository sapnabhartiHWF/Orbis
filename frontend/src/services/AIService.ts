// Comprehensive AI Service with rich dummy data for RPA platform
export class AIService {
  private static readonly platformData = {
    processes: [
      {
        id: "PROC-001",
        name: "Invoice Processing Automation",
        department: "Finance",
        status: "Active",
        roi: 1200000,
        efficiency: 94,
        monthlyVolume: 15000,
        errorRate: 0.2,
        avgProcessingTime: "2.3 minutes"
      },
      {
        id: "PROC-002", 
        name: "Employee Onboarding Workflow",
        department: "HR",
        status: "Active",
        roi: 850000,
        efficiency: 89,
        monthlyVolume: 340,
        errorRate: 0.1,
        avgProcessingTime: "45 minutes"
      },
      {
        id: "PROC-003",
        name: "Customer Data Migration",
        department: "IT",
        status: "In Development",
        roi: 2100000,
        efficiency: 91,
        monthlyVolume: 8500,
        errorRate: 0.3,
        avgProcessingTime: "8.2 minutes"
      },
      {
        id: "PROC-004",
        name: "Compliance Report Generation",
        department: "Legal",
        status: "Active",
        roi: 680000,
        efficiency: 96,
        monthlyVolume: 1200,
        errorRate: 0.05,
        avgProcessingTime: "12 minutes"
      }
    ],
    
    teams: [
      {
        name: "Emma Thompson",
        department: "Operations", 
        role: "RPA Lead",
        processesCreated: 12,
        totalSavings: 3200000,
        efficiency: 94,
        lastActive: "2 hours ago"
      },
      {
        name: "Marcus Chen",
        department: "IT",
        role: "Automation Developer", 
        processesCreated: 8,
        totalSavings: 2800000,
        efficiency: 91,
        lastActive: "30 minutes ago"
      },
      {
        name: "Sarah Rodriguez",
        department: "Finance",
        role: "Process Analyst",
        processesCreated: 6,
        totalSavings: 1850000,
        efficiency: 88,
        lastActive: "1 hour ago"
      }
    ],

    kpis: {
      totalROI: 8450000,
      processesAutomated: 47,
      totalTimesSaved: 12400,
      errorReduction: 87,
      employeeSatisfaction: 94,
      systemUptime: 99.94,
      avgImplementationTime: "3.2 weeks",
      costSavingsThisMonth: 750000
    },

    recentAlerts: [
      {
        type: "success",
        message: "Invoice Processing bot completed 2,340 invoices with 99.8% accuracy",
        time: "15 minutes ago"
      },
      {
        type: "warning", 
        message: "Customer Migration process experiencing higher than normal volume",
        time: "1 hour ago"
      },
      {
        type: "info",
        message: "New automation template available for Expense Report Processing",
        time: "3 hours ago"
      }
    ]
  }

  static getWelcomeMessage(currentPath: string): string {
    const pathMessages = {
      "/": "👋 Hi! I'm your RPA Assistant. I can see you're on the Operations dashboard. I can help you understand bot performance, process status, or any operational metrics. What would you like to know?",
      
      "/center-of-excellence": "🚀 Welcome to the Center of Excellence! I can help you with process submissions, ROI calculations, approval workflows, or innovation pipelines. What automation challenge are you working on?",
      
      "/collaboration-hub": "🤝 Great to see you collaborating! I can provide insights about team performance, project status, cross-department initiatives, or help coordinate automation efforts. How can I assist?",
      
      "/roi-assessment-engine": "💰 Perfect timing! I can help analyze ROI projections, cost-benefit calculations, payback periods, or compare automation opportunities. What financial analysis do you need?",
      
      "/sla": "🎯 I'm here to help with SLA monitoring! I can provide performance metrics, KPI analysis, compliance tracking, or help identify improvement opportunities. What metrics interest you?",
      
      "/analytics": "📊 Analytics mode activated! I can dive deep into process performance, trend analysis, predictive insights, or custom reporting. What data story shall we explore?",
      
      "/leaderboard": "🏆 Ready to celebrate achievements! I can show you contribution scores, team rankings, badge progress, or recognition opportunities. Who's leading the innovation charge?",
      
      "/agile": "⚡ Agile project insights at your service! I can help with sprint planning, velocity tracking, backlog prioritization, or development project coordination. What's your next milestone?",
      
      default: "🤖 Hello! I'm your intelligent RPA Assistant with deep knowledge of all platform features. I can help with processes, ROI analysis, team performance, technical questions, and strategic insights. What can I help you discover today?"
    }

    return pathMessages[currentPath as keyof typeof pathMessages] || pathMessages.default
  }

  static getContextualSuggestions(currentPath: string): string[] {
    const pathSuggestions = {
      "/": [
        "What's our current system uptime?", 
        "Show me today's process performance",
        "Any critical alerts I should know about?",
        "Which bots are running right now?"
      ],
      
      "/center-of-excellence": [
        "What's in our automation pipeline?",
        "Show me high-ROI opportunities",  
        "Which departments need automation most?",
        "What's our innovation success rate?"
      ],
      
      "/collaboration-hub": [
        "Who are our top automation contributors?",
        "Show me active team projects", 
        "What cross-department collaborations exist?",
        "Which teams need support?"
      ],
      
      "/roi-assessment-engine": [
        "Calculate ROI for invoice processing",
        "What's our best performing automation?",
        "Show me cost savings breakdown",
        "Which processes have highest payback?"
      ],
      
      "/sla": [
        "Are we meeting our SLA targets?",
        "Show me performance trends",
        "Which KPIs need attention?", 
        "What's our compliance score?"
      ],
      
      "/analytics": [
        "Show me this month's key insights",
        "What trends should I be aware of?",
        "Generate a performance report",
        "Which metrics are improving?"
      ],
      
      "/leaderboard": [
        "Who's leading in contributions?",
        "Show me department rankings",
        "What badges can I earn?",
        "Highlight this month's achievements"
      ],
      
      "/agile": [
        "What's our sprint velocity?",
        "Show me project roadmap",
        "Which features are in development?",
        "What's our deployment pipeline status?"
      ],

      default: [
        "What's our overall ROI performance?",
        "Show me system health status", 
        "Which processes need optimization?",
        "What automation opportunities exist?"
      ]
    }

    return pathSuggestions[currentPath as keyof typeof pathSuggestions] || pathSuggestions.default
  }

  static async getResponse(query: string, currentPath: string): Promise<{ content: string, suggestions?: string[] }> {
    const lowerQuery = query.toLowerCase()

    // ROI and Financial Queries
    if (lowerQuery.includes('roi') || lowerQuery.includes('savings') || lowerQuery.includes('cost') || lowerQuery.includes('financial')) {
      return {
        content: `💰 **Financial Performance Overview:**

**Total ROI Generated:** $${this.platformData.kpis.totalROI.toLocaleString()}
**This Month's Savings:** $${this.platformData.kpis.costSavingsThisMonth.toLocaleString()}

**Top ROI Performers:**
🥇 Customer Data Migration: $${this.platformData.processes[2].roi.toLocaleString()} (${this.platformData.processes[2].efficiency}% efficiency)
🥈 Invoice Processing: $${this.platformData.processes[0].roi.toLocaleString()} (${this.platformData.processes[0].efficiency}% efficiency)  
🥉 Employee Onboarding: $${this.platformData.processes[1].roi.toLocaleString()} (${this.platformData.processes[1].efficiency}% efficiency)

**Key Insights:** 
✨ Average payback period: 4.2 months
✨ ROI improvement rate: +23% vs last quarter
✨ Cost per transaction reduced by 67%

The Invoice Processing automation alone saves us $100K monthly in labor costs!`,
        suggestions: [
          "Show me detailed ROI breakdown by department",
          "What's our projected ROI for next quarter?", 
          "Which new processes should we prioritize for ROI?",
          "Compare our ROI against industry benchmarks"
        ]
      }
    }

    // Process Status and Performance
    if (lowerQuery.includes('process') || lowerQuery.includes('running') || lowerQuery.includes('status') || lowerQuery.includes('performance')) {
      const activeProcesses = this.platformData.processes.filter(p => p.status === 'Active')
      return {
        content: `🔄 **Live Process Dashboard:**

**Currently Active:** ${activeProcesses.length} processes running smoothly

**Real-time Performance:**
📊 Invoice Processing: Processing ${this.platformData.processes[0].monthlyVolume.toLocaleString()} invoices/month
⚡ Error Rate: ${this.platformData.processes[0].errorRate}% (Industry avg: 2.1%)
⏱️ Avg Processing: ${this.platformData.processes[0].avgProcessingTime}

🏢 Employee Onboarding: ${this.platformData.processes[1].monthlyVolume} new hires automated
📈 Compliance Reports: ${this.platformData.processes[3].monthlyVolume} reports generated monthly

**System Health:** 🟢 ${this.platformData.kpis.systemUptime}% uptime
**Overall Efficiency:** ${Math.round(activeProcesses.reduce((acc, p) => acc + p.efficiency, 0) / activeProcesses.length)}% average

**Recent Activity:**
${this.platformData.recentAlerts.map(alert => `• ${alert.message} (${alert.time})`).join('\n')}`,
        suggestions: [
          "Show me detailed metrics for Invoice Processing",
          "What processes need optimization?",
          "Alert me about any performance issues",
          "Show me process comparison analytics"
        ]
      }
    }

    // Team and Collaboration
    if (lowerQuery.includes('team') || lowerQuery.includes('people') || lowerQuery.includes('contributor') || lowerQuery.includes('collaboration')) {
      return {
        content: `👥 **Team Excellence Dashboard:**

**Top Automation Champions:**

🏆 **${this.platformData.teams[0].name}** - ${this.platformData.teams[0].department}
   • ${this.platformData.teams[0].processesCreated} processes created
   • $${this.platformData.teams[0].totalSavings.toLocaleString()} in savings generated
   • ${this.platformData.teams[0].efficiency}% success rate
   • Last active: ${this.platformData.teams[0].lastActive}

🥈 **${this.platformData.teams[1].name}** - ${this.platformData.teams[1].department} 
   • ${this.platformData.teams[1].processesCreated} processes created
   • $${this.platformData.teams[1].totalSavings.toLocaleString()} in savings
   • Currently developing next-gen AI integration

🥉 **${this.platformData.teams[2].name}** - ${this.platformData.teams[2].department}
   • Specialized in financial automation
   • ${this.platformData.teams[2].efficiency}% process accuracy rate

**Cross-Department Collaboration:**
🤝 IT + Finance: Working on advanced analytics integration
🔄 HR + Operations: Streamlining employee lifecycle automation  
📊 All departments: Contributing to Center of Excellence initiatives

**Team Satisfaction:** ${this.platformData.kpis.employeeSatisfaction}% (Company record high!)`,
        suggestions: [
          "Show me individual team member contributions",
          "What training opportunities are available?",
          "How can teams collaborate better?",
          "Show me department-specific performance"
        ]
      }
    }

    // Analytics and Insights
    if (lowerQuery.includes('analytic') || lowerQuery.includes('insight') || lowerQuery.includes('trend') || lowerQuery.includes('report')) {
      return {
        content: `📈 **Advanced Analytics & Insights:**

**Key Performance Trends:**
📊 Process automation adoption: +34% quarter-over-quarter
🚀 Implementation speed: 23% faster than industry average  
💡 Innovation pipeline: 12 new automations in development
🎯 Success rate: 94% of processes meet or exceed targets

**Predictive Insights:**
🔮 **Next Month Forecast:**
   • Expected savings: $890K (+18% vs this month)
   • Completion rate projection: 96.2%  
   • New process deployments: 3 major releases

**Department Analytics:**
🏆 **Finance:** Leading in ROI generation (38% of total)
⚡ **IT:** Fastest implementation times (avg 2.1 weeks)
🎯 **Operations:** Highest process volume (65% of transactions)
🤝 **HR:** Best collaboration scores (4.8/5 rating)

**Anomaly Detection:** 
✅ All systems operating within normal parameters
💡 Opportunity identified: Customer service automation could yield additional $420K annually

**Trending Questions:**
• "How to scale automation across departments?"
• "ROI optimization strategies"
• "Best practices for change management"`,
        suggestions: [
          "Generate executive summary report",
          "Show me predictive automation opportunities", 
          "What anomalies need investigation?",
          "Create custom analytics dashboard"
        ]
      }
    }

    // System Health and Monitoring
    if (lowerQuery.includes('health') || lowerQuery.includes('uptime') || lowerQuery.includes('alert') || lowerQuery.includes('monitoring')) {
      return {
        content: `🛡️ **System Health & Monitoring:**

**Real-Time Status:** 🟢 ALL SYSTEMS OPERATIONAL

**Performance Metrics:**
⚡ System Uptime: ${this.platformData.kpis.systemUptime}% (Last 30 days)
🔄 Active Bots: 23/24 running smoothly  
📊 Transaction Success Rate: 99.2%
💾 Database Performance: Optimal (avg 1.2ms response)
🌐 Network Latency: <50ms globally

**Recent System Events:**
🔄 Scheduled maintenance completed successfully (2 hours ago)
✅ Security audit passed with 100% compliance (yesterday)  
📈 Performance optimization deployed (3 hours ago)

**Proactive Monitoring:**
🤖 AI monitoring detected and auto-resolved 12 minor issues
🔔 Zero critical alerts in the past 48 hours
📱 All stakeholders notified of system updates via preferred channels

**Capacity Planning:**
📊 Current utilization: 67% of total capacity
🚀 Growth projection: System can handle 3x current load
💡 Recommended: Scale additional servers by Q2 2024

**Security Status:** 
🔒 All security protocols active
🛡️ Zero breach attempts detected
✅ Compliance: SOC2, GDPR, HIPAA certified`,
        suggestions: [
          "Show me detailed performance metrics",
          "Set up custom monitoring alerts", 
          "What maintenance is scheduled?",
          "Review security audit results"
        ]
      }
    }

    // Agile and Development
    if (lowerQuery.includes('agile') || lowerQuery.includes('sprint') || lowerQuery.includes('development') || lowerQuery.includes('roadmap')) {
      return {
        content: `⚡ **Agile Development & Project Insights:**

**Current Sprint (Sprint 23):**
🎯 **Progress:** 78% complete (3 days remaining)
✅ **Completed:** 12/15 user stories  
🔄 **In Progress:** 2 features, 1 bug fix
📊 **Team Velocity:** 42 story points (above target of 38)

**Active Development Projects:**
🚀 **AI-Enhanced Process Discovery** (Due: Nov 15)
   • Status: 65% complete  
   • Team: 4 developers + 1 data scientist
   • Impact: Reduce process analysis time by 70%

💡 **Advanced Analytics Dashboard** (Due: Dec 1)  
   • Status: 45% complete
   • Features: Real-time insights, predictive modeling
   • Expected ROI: $680K annually

🔧 **Mobile RPA Management App** (Due: Dec 20)
   • Status: 30% complete  
   • Platform: iOS/Android native apps
   • User base: 200+ business users

**Upcoming Releases:**
📅 **v2.4.0** - Enhanced collaboration tools (Next week)
📅 **v2.5.0** - Advanced security features (3 weeks)  
📅 **v3.0.0** - AI-powered automation (Q1 2024)

**Development Metrics:**
🐛 Bug Rate: 0.3 per 1000 lines of code (Industry leading)
⚡ Deployment Frequency: 2.3x per week
🔄 Lead Time: 4.2 days (Target: 5 days)
✅ Change Success Rate: 96.7%`,
        suggestions: [
          "Show me detailed sprint backlog",
          "What features are in the next release?", 
          "How's our development velocity trending?",
          "Show me project roadmap timeline"
        ]
      }
    }

    // Leaderboard and Gamification
    if (lowerQuery.includes('leaderboard') || lowerQuery.includes('ranking') || lowerQuery.includes('badge') || lowerQuery.includes('achievement')) {
      return {
        content: `🏆 **Leaderboard & Achievement Highlights:**

**🥇 Monthly Champions:**
1️⃣ Emma Thompson (Operations) - 2,850 points
   • ROI Champion badge earned 
   • 12 successful implementations this month
   • $1.2M in generated savings

2️⃣ Marcus Chen (IT) - 2,680 points  
   • Innovation Leader badge
   • Led 3 cross-department projects
   • 91% efficiency rating

3️⃣ Sarah Rodriguez (Finance) - 2,420 points
   • Quality Assurance badge
   • Zero defects in last 10 implementations
   • Process Pioneer recognition

**🏢 Department Rankings:**
🥇 Operations (8,450 total points)
🥈 IT (7,820 total points)  
🥉 Finance (6,950 total points)

**🎖️ Recently Earned Badges:**
• Process Pioneer: 12 employees (10 automation processes submitted)
• ROI Champion: 8 employees ($1M+ in savings)  
• Collaboration Master: 23 employees (20+ team assists)
• Speed Demon: 45 employees (<24h implementation)

**🎁 This Month's Rewards:**
🏆 Top Contributor: Premium training + $500 bonus
💡 Innovation Award: Conference ticket + recognition
🤝 Team Player: Group lunch + development budget
⭐ Rising Star: Mentorship program access

**Next Level Targets:**
📈 You're 180 points away from "Automation Expert" badge!
🎯 Complete 2 more cross-team projects for "Collaboration Master"`,
        suggestions: [
          "How do I earn more points?",
          "Show me available badge challenges",
          "What rewards can I unlock?", 
          "Compare my performance with peers"
        ]
      }
    }

    // Center of Excellence
    if (lowerQuery.includes('excellence') || lowerQuery.includes('innovation') || lowerQuery.includes('pipeline') || lowerQuery.includes('submission')) {
      return {
        content: `🚀 **Center of Excellence - Innovation Pipeline:**

**📋 Process Submission Pipeline:**
🔄 **In Review:** 8 submissions (avg review time: 2.1 days)
✅ **Approved:** 15 processes this month (+25% vs last month)  
🚀 **In Development:** 6 high-priority automations
📊 **Deployed:** 12 new processes went live

**💡 Top Innovation Opportunities:**
1. **Customer Service Chatbot Integration**  
   • Potential ROI: $420K annually
   • Implementation complexity: Medium
   • Estimated timeline: 6-8 weeks

2. **Advanced Document Processing with AI**
   • Potential ROI: $680K annually  
   • Utilizes latest OCR + NLP technology
   • Cross-department impact: Finance, Legal, HR

3. **Predictive Maintenance Automation**
   • Potential ROI: $290K annually
   • Reduces downtime by 45%
   • Integration with existing systems

**🎯 Excellence Metrics:**
📈 Innovation Score: 94/100 (Company best)
⚡ Time-to-Market: 3.2 weeks (Industry avg: 8 weeks)  
✅ Success Rate: 89% of submissions approved
🔄 Process Reusability: 67% (templates created)

**🏆 Innovation Champions:**
• Most Creative Solution: "AI-Powered Expense Recognition"
• Biggest Impact: "Supply Chain Optimization Bot"  
• Best Collaboration: "Cross-Department Onboarding Flow"

**📚 Knowledge Repository:**
• 47 process templates available
• 156 best practices documented
• 89 reusable components in library
• 234 automation patterns catalogued`,
        suggestions: [
          "How do I submit a new process idea?",
          "Show me available automation templates",
          "What's the approval criteria?",
          "Connect me with innovation mentors"
        ]
      }
    }

    // SLA and KPI specific
    if (lowerQuery.includes('sla') || lowerQuery.includes('kpi') || lowerQuery.includes('target') || lowerQuery.includes('compliance')) {
      return {
        content: `🎯 **SLA & KPI Performance Dashboard:**

**📊 Key Performance Indicators:**
✅ **Process Uptime:** 99.94% (Target: 99.5% ✓)
⚡ **Response Time:** 1.8s avg (Target: <3s ✓)  
🎯 **Accuracy Rate:** 99.2% (Target: 98% ✓)
🔄 **Throughput:** 15,340 transactions/day (Target: 12,000 ✓)

**📈 SLA Compliance Status:**
🟢 **Critical Processes:** 100% within SLA (47/47)
🟡 **Standard Processes:** 96% within SLA (143/149)  
🔴 **Non-Critical:** 94% within SLA (attention needed)

**⏱️ Response Time Breakdown:**
• P1 (Critical): 15 minutes avg (SLA: 30 min) ✅
• P2 (High): 2.5 hours avg (SLA: 4 hours) ✅  
• P3 (Medium): 18 hours avg (SLA: 24 hours) ✅
• P4 (Low): 3.2 days avg (SLA: 5 days) ✅

**🎖️ Performance Achievements:**
🏆 Zero SLA breaches for critical processes (90 days)
📈 +12% improvement in average response time  
🎯 Customer satisfaction: 96.4% (Target: 90%)
⚡ Error resolution time reduced by 34%

**📋 Compliance Audit Results:**
✅ SOC2 Type II: Passed (Annual)
✅ ISO 27001: Certified  
✅ GDPR: 100% compliant
✅ Industry Standards: All requirements met

**🔔 Active Monitoring:**
• Real-time SLA tracking across all processes
• Automated alerts for threshold breaches  
• Predictive analysis for potential issues
• Escalation procedures fully automated`,
        suggestions: [
          "Show me processes near SLA limits",
          "What caused the last SLA breach?",
          "Set up custom KPI monitoring",
          "Generate compliance report"
        ]
      }
    }

    // Default comprehensive response
    return {
      content: `🤖 **Comprehensive Platform Overview:**

I understand you're looking for information about our RPA platform. Here's what I can help you with:

**📊 Current System Status:**
• ${this.platformData.processes.length} active automation processes
• $${this.platformData.kpis.totalROI.toLocaleString()} total ROI generated
• ${this.platformData.kpis.systemUptime}% system uptime
• ${this.platformData.teams.length} automation champions actively contributing

**🔍 I can provide detailed insights on:**
💰 Financial performance, ROI analysis, and cost savings
🔄 Process status, performance metrics, and optimization  
👥 Team contributions, collaboration, and performance
📈 Analytics, trends, and predictive insights
🎯 SLA compliance, KPIs, and quality metrics
🚀 Innovation pipeline and automation opportunities
🏆 Leaderboards, achievements, and recognition programs
⚡ Development progress and project roadmaps

**💡 Popular Questions:**
• "What's our biggest ROI opportunity?"
• "Which processes need attention?"  
• "How are teams performing?"
• "Show me this month's key metrics"

Just ask me anything specific - I have comprehensive data on all aspects of our automation platform!`,
      suggestions: [
        "Show me our top ROI processes",
        "What's our current system health?",
        "Who are our automation leaders?", 
        "What insights should I know about?"
      ]
    }
  }
}