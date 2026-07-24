require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const OPENROUTER_API_URL = `${(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '')}/chat/completions`;

async function callOpenRouter(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file.',
      result: null
    };
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Factory Floor Safety Monitor'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
        result: null
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated';

    return {
      success: true,
      error: null,
      result: content,
      model: data.model,
      usage: data.usage
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to connect to OpenRouter: ${err.message}`,
      result: null
    };
  }
}

// AI Feature: PPE Compliance Analysis
async function analyzePPECompliance(detectionData) {
  const systemPrompt = `You are an AI safety expert specializing in PPE (Personal Protective Equipment) compliance analysis for factory environments. Analyze the PPE detection data and provide:
1. Overall compliance assessment
2. Specific violations identified
3. Risk level (Low/Medium/High/Critical)
4. Recommended actions
5. OSHA regulation references
Format your response with clear sections and bullet points.`;

  const userMessage = `Analyze this PPE detection record:
- Employee: ${detectionData.employeeName}
- Zone: ${detectionData.zone}
- Helmet: ${detectionData.helmet ? 'Detected' : 'NOT Detected'}
- Safety Vest: ${detectionData.safetyVest ? 'Detected' : 'NOT Detected'}
- Safety Glasses: ${detectionData.safetyGlasses ? 'Detected' : 'NOT Detected'}
- Gloves: ${detectionData.gloves ? 'Detected' : 'NOT Detected'}
- Safety Boots: ${detectionData.safetyBoots ? 'Detected' : 'NOT Detected'}
- Ear Protection: ${detectionData.earProtection ? 'Detected' : 'NOT Detected'}
- Compliance Score: ${detectionData.complianceScore}%`;

  return callOpenRouter(systemPrompt, userMessage);
}

// AI Feature: Incident Analysis
async function analyzeIncident(incidentData) {
  const systemPrompt = `You are an AI safety investigator specializing in factory floor incident analysis. Analyze the incident and provide:
1. Incident severity assessment
2. Probable root causes
3. Contributing factors
4. Recommended corrective actions
5. Preventive measures
6. OSHA compliance implications
7. Similar incident patterns to watch for
Format your response with clear sections and professional language.`;

  const userMessage = `Analyze this factory incident:
- Incident #: ${incidentData.incidentNumber}
- Title: ${incidentData.title}
- Type: ${incidentData.type}
- Severity: ${incidentData.severity}
- Location: ${incidentData.location}
- Description: ${incidentData.description}
- Reported By: ${incidentData.reportedBy}
${incidentData.rootCause ? `- Root Cause: ${incidentData.rootCause}` : ''}`;

  return callOpenRouter(systemPrompt, userMessage);
}

// AI Feature: Risk Assessment Analysis
async function analyzeRisk(riskData) {
  const systemPrompt = `You are an AI risk assessment specialist for manufacturing environments. Analyze the risk data and provide:
1. Comprehensive risk evaluation
2. Risk matrix placement (likelihood x consequence)
3. Existing control effectiveness
4. Additional control recommendations
5. Residual risk after controls
6. Monitoring requirements
7. Emergency response considerations
Format your response professionally with clear sections.`;

  const userMessage = `Analyze this workplace risk assessment:
- Title: ${riskData.title}
- Area: ${riskData.area}
- Hazard Description: ${riskData.hazardDescription}
- Likelihood: ${riskData.likelihood}
- Consequence: ${riskData.consequence}
- Current Risk Level: ${riskData.riskLevel}
- Existing Controls: ${riskData.controls || 'None specified'}`;

  return callOpenRouter(systemPrompt, userMessage);
}

// AI Feature: Safety Audit Analysis
async function analyzeAudit(auditData) {
  const systemPrompt = `You are an AI safety audit analyst for industrial facilities. Analyze the audit data and provide:
1. Audit score interpretation
2. Key findings analysis
3. Priority areas for improvement
4. Compliance gap assessment
5. Recommended action plan with timelines
6. Benchmarking insights
7. Follow-up audit recommendations
Format your response with clear sections and actionable insights.`;

  const userMessage = `Analyze this safety audit:
- Audit #: ${auditData.auditNumber}
- Title: ${auditData.title}
- Department: ${auditData.department}
- Score: ${auditData.score}/${auditData.maxScore}
- Findings: ${auditData.findings || 'Not yet documented'}
- Recommendations: ${auditData.recommendations || 'Not yet documented'}`;

  return callOpenRouter(systemPrompt, userMessage);
}

// AI Feature: Compliance Report Generation
async function generateComplianceAnalysis(reportData) {
  const systemPrompt = `You are an AI OSHA compliance specialist. Analyze the compliance data and generate:
1. Executive summary
2. Compliance rate analysis and trends
3. Key metrics breakdown
4. Areas of concern
5. Regulatory compliance status (OSHA 29 CFR 1910/1926)
6. Improvement recommendations
7. Next steps and timeline
Format your response as a professional compliance analysis report.`;

  const userMessage = `Generate compliance analysis for this report:
- Report #: ${reportData.reportNumber}
- Type: ${reportData.type}
- Period: ${reportData.period}
- Total Incidents: ${reportData.totalIncidents}
- Total Trainings: ${reportData.totalTrainings}
- Compliance Rate: ${reportData.complianceRate}%
- Summary: ${reportData.summary || 'Please generate based on available data'}`;

  return callOpenRouter(systemPrompt, userMessage);
}

// AI Feature: Hazard Zone Analysis
async function analyzeHazardZone(zoneData) {
  const systemPrompt = `You are an AI hazard zone safety analyst. Analyze the zone data and provide:
1. Zone risk assessment
2. Occupancy safety analysis
3. PPE adequacy evaluation
4. Emergency egress considerations
5. Monitoring recommendations
6. OSHA regulatory compliance
7. Zone improvement suggestions
Format your response with clear sections.`;

  const userMessage = `Analyze this hazard zone:
- Zone Name: ${zoneData.name}
- Type: ${zoneData.type}
- Location: ${zoneData.location}
- Risk Level: ${zoneData.riskLevel}
- Max Occupancy: ${zoneData.maxOccupancy}
- Current Occupancy: ${zoneData.currentOccupancy}
- Required PPE: ${zoneData.requiredPPE || 'Not specified'}
- Description: ${zoneData.description || 'No description'}`;

  return callOpenRouter(systemPrompt, userMessage);
}

module.exports = {
  callOpenRouter,
  analyzePPECompliance,
  analyzeIncident,
  analyzeRisk,
  analyzeAudit,
  generateComplianceAnalysis,
  analyzeHazardZone
};
