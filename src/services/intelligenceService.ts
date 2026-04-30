import { GoogleGenAI } from "@google/genai";

export interface GraphNode {
  data: {
    id: string;
    label: string;
    type: "Core_Issue" | "Key_Player" | "Victim" | "Beneficiary" | string;
  };
}

export interface GraphEdge {
  data: {
    source: string;
    target: string;
    label: string;
  };
}

export interface IntelligenceReport {
  topic?: string;
  summary: string;
  actionableInsights?: string;
  evidenceLinks?: string[];
  graphData: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}

const MODEL_NAME_DISCOVERY = "gemini-3-flash-preview";
const MODEL_NAME_ANALYSIS = "gemini-3.1-pro-preview";

export interface TrendingTopic {
  topic: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impactScore: number;
  isFabricated: boolean; // True if it seems driven by bots/astroturfing
  country: string;
  corruptionRisk: number; // 1-100 score of potential corruption or fraud
}

export async function getTrendingTopics(
  language: 'ar' | 'en' = 'ar',
  userGeminiKey?: string,
  userOpenRouterKey?: string
): Promise<TrendingTopic[]> {
  const isEn = language === 'en';
  const langParam = isEn ? 'en' : 'ar';
  
  let externalNewsContext = "";
  try {
    const res = await fetch(`/api/news?lang=${langParam}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.articles) {
        externalNewsContext = "RECENT REAL-WORLD NEWS HEADLINES (Use these to ground your analysis):\n" + 
          data.articles.slice(0, 10).map((a: any) => `- ${a.title}: ${a.snippet}`).join('\n');
      }
    }
  } catch (e) {
    console.warn("Could not fetch external news", e);
  }

  const prompt = `
    ${externalNewsContext}
    
    Identify 5 current high-impact global or regional trending topics in news, technology, geopolitics, or society based on the real-world news provided above (if available) or your recent knowledge.
    Crucially, analyze if the trend is organic ("Natural") or "Fabricated" (driven by bots, state-actors, or paid campaigns).
    Assess if there is a risk of underlying corruption, fraud, or illicit activity (Corruption Risk 1-100).
    Provide the output in a strict JSON format:
    {
      "trends": [
        {
          "topic": "Topic Name (${isEn ? 'in English' : 'in Arabic'})",
          "category": "Technology/Geopolitics/Environment/Society (${isEn ? 'in English' : 'in Arabic'})",
          "sentiment": "positive/negative/neutral",
          "impactScore": 1-100,
          "isFabricated": boolean,
          "country": "Related Country/Region (${isEn ? 'in English' : 'in Arabic'})",
          "corruptionRisk": 1-100
        }
      ]
    }
  `;

  if (userOpenRouterKey && !userGeminiKey) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userOpenRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!resp.ok) {
        throw new Error(`OpenRouter Error: ${await resp.text()}`);
      }
      
      const json = await resp.json();
      const text = json.choices[0]?.message?.content || "";
      const cleanText = text.replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim();
      return JSON.parse(cleanText).trends;
    } catch (e) {
      console.error("OpenRouter Discovery Error:", e);
      return [];
    }
  }

  const apiKey = userGeminiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key available");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME_DISCOVERY,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text;
    if (!text) return [];
    
    const cleanText = text.replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim();
    const data = JSON.parse(cleanText);
    return data.trends;
  } catch (error) {
    console.error("Gemini Discovery Error:", error);
    return [];
  }
}

export async function analyzeTrend(
  topic: string,
  language: 'ar' | 'en' = 'ar',
  userGeminiKey?: string,
  userOpenRouterKey?: string
): Promise<IntelligenceReport> {
  const isEn = language === 'en';
  const langParam = isEn ? 'en' : 'ar';
  
  let searchContext = "";
  try {
    const res = await fetch(`/api/news?q=${encodeURIComponent(topic)}&lang=${langParam}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.articles) {
        searchContext = "RECENT SEARCH RESULTS & NEWS (Use this as factual grounding):\n" + 
          data.articles.slice(0, 5).map((a: any) => `- ${a.title}: ${a.snippet}`).join('\n');
      }
    }
  } catch (e) {
    console.warn("Could not fetch topic news", e);
  }
  
  const prompt = isEn ? `
    Perform a comprehensive Open Source Intelligence (OSINT) and Cyber Threat Intelligence (CTI) analysis on the following topic or trend: "${topic}".
    
    ${searchContext}

    Examine if this is an organic trend or an astroturfed/fabricated campaign. Look for signs of corruption, fraud, or hidden agendas.
    
    Search real news, social media discussions, and technical reports if possible. Provide your analysis based on the following requirements:

    1. The analysis MUST be in professional English.
    2. Provide a 'summary' of the core issue.
    3. Provide 'actionableInsights', a formal report suitable for state authorities or anti-corruption agencies outlining recommended actions.
    4. Provide 'evidenceLinks' as an array of URLs or search queries from real news provided above that back up the claims.
    5. Connect the relationships in a Knowledge Graph identifying the Core Issue, Key Players (Real or Fake), Beneficiaries, and Victims.

    The response MUST be strictly in JSON format, and closely follow this structure:
    {
      "summary": "Objective summary of the issue and whether it is organic or fabricated...",
      "actionableInsights": "Recommendations for authorities to investigate or mitigate...",
      "evidenceLinks": ["https://example.com/report"],
      "graphData": {
        "nodes": [
          {"data": {"id": "trend", "label": "Trend Name", "type": "Core_Issue"}},
          {"data": {"id": "player1", "label": "Player/Person Name", "type": "Key_Player"}},
          {"data": {"id": "victim1", "label": "Affected Name", "type": "Victim"}},
          {"data": {"id": "beneficiary1", "label": "Beneficiary Name", "type": "Beneficiary"}}
        ],
        "edges": [
          {"data": {"source": "player1", "target": "trend", "label": "launched/supports"}},
          {"data": {"source": "trend", "target": "victim1", "label": "targets/harms"}},
          {"data": {"source": "trend", "target": "beneficiary1", "label": "benefits from"}}
        ]
      }
    }
  ` : `
    أجرِ تحليلاً شاملاً للاستخبارات (OSINT و CTI) حول هذا الموضوع أو الاتجاه: "${topic}".
    
    ${searchContext}

    افحص ما إذا كان هذا الترند طبيعياً أم مفتعلاً (لجان إلكترونية، حملات مدفوعة). ابحث عن أي علامات على الفساد، الاحتيال، أو الأجندات الخفية.
    باستخدام أدوات البحث والأخبار المرفقة أعلاه، ابحث في الأخبار الحقيقية، مناقشات وسائل التواصل الاجتماعي، والتقارير التقنية. قدم تحليلك بناءً على المتطلبات التالية:

    1. يجب أن يكون التحليل باللغة العربية الفصحى وبأسلوب مهني وأمني.
    2. قدم 'summary': ملخص موضوعي للقضية وهل هي طبيعية أم مفتعلة.
    3. قدم 'actionableInsights': تقرير رسمي موجه للجهات المختصة أو مكافحة الفساد يوضح الإجراءات الموصى بها.
    4. قدم 'evidenceLinks': مصفوفة بروابط أو مصطلحات بحث كأدلة (من الأخبار المرفقة).
    5. ارسم شبكة العلاقات (Graph) توضح القضية الجوهرية، اللاعبين (حقيقيين أو وهميين)، المستفيدين، والضحايا.

    يجب أن تكون الاستجابة بصيغة JSON فقط، وتتبع الهيكل التالي بدقة:
    {
      "summary": "ملخص كامل للقضية باللغة العربية...",
      "actionableInsights": "تقرير للجهات المعنية يوضح الخطوات المقترحة للتعامل مع القضية/الفساد...",
      "evidenceLinks": ["https://...", "بحث: 'فضيحة'"],
      "graphData": {
        "nodes": [
          {"data": {"id": "trend", "label": "اسم التريند", "type": "Core_Issue"}},
          {"data": {"id": "player1", "label": "اسم الطرف/الشخص", "type": "Key_Player"}},
          {"data": {"id": "victim1", "label": "اسم المتضرر", "type": "Victim"}},
          {"data": {"id": "beneficiary1", "label": "اسم المستفيد", "type": "Beneficiary"}}
        ],
        "edges": [
          {"data": {"source": "player1", "target": "trend", "label": "أطلق/يدعم/يفتعل"}},
          {"data": {"source": "trend", "target": "victim1", "label": "يستهدف/يضر"}},
          {"data": {"source": "trend", "target": "beneficiary1", "label": "يستفيد من"}}
        ]
      }
    }
  `;

  if (userOpenRouterKey && !userGeminiKey) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userOpenRouterKey}`,
          "Content-Type": "application/json",
          // OpenRouter specific header to request plugins/tools routing if the model supports it 
          // OpenRouter provides web search if the selected model supports it, like perplexity models
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!resp.ok) {
        throw new Error(`OpenRouter Error: ${await resp.text()}`);
      }

      const json = await resp.json();
      const text = json.choices[0]?.message?.content || "";
      const cleanText = text.replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim();
      const parsed = JSON.parse(cleanText) as IntelligenceReport;
      return { ...parsed, topic };
    } catch (e: any) {
      console.error("OpenRouter Analysis Error:", e);
      throw e;
    }
  }

  const apiKey = userGeminiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No API key available. Please add it in settings or environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const result = await ai.models.generateContent({
      model: MODEL_NAME_ANALYSIS,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    const text = result.text;
    if (!text) {
      throw new Error("No analysis available.");
    }

    const parsed = JSON.parse(text) as IntelligenceReport;
    return {
      ...parsed,
      topic
    };
  } catch (error: any) {
    console.error("Gemini OSINT Analysis Error:", error);
    throw error;
  }
}

export async function invokeRoomAI(
  messages: any[],
  evidence: any[],
  language: 'ar' | 'en' = 'ar',
  userGeminiKey?: string,
  userOpenRouterKey?: string
): Promise<string> {
  const isEn = language === 'en';
  
  // Format history
  const historyText = messages.map(m => `[${m.sender_name}]: ${m.content}`).join('\n');
  const evidenceText = evidence.map(e => `[EVIDENCE - ${e.provider_name} added ${e.evidence_type}]: ${e.content}\nDesc: ${e.description}`).join('\n\n');
  
  const prompt = isEn ? `
    You are an elite OSINT/CTI AI Agent in a collaborative investigation room.
    The team is discussing a case. You have access to the chat history and collected evidence.
    
    == CHAT HISTORY ==
    ${historyText}
    
    == EVIDENCE COLLECTED ==
    ${evidenceText || "None yet."}
    
    Based on the context, provide a helpful, analytical, and professional response to the latest message.
    Do not output JSON, just markdown text. Act as a team member.
  ` : `
    أنت وكيل ذكاء اصطناعي متخصص في الاستخبارات (OSINT) في غرفة تحقيق مشتركة.
    الفريق يناقش قضية. لديك حق الوصول إلى سجل الدردشة والأدلة المجمعة.
    
    == سجل الدردشة ==
    ${historyText}
    
    == الأدلة المجمعة ==
    ${evidenceText || "لا يوجد بعد."}
    
    بناءً على السياق، قدم رداً مفيداً وتحليلياً واحترافياً على الرسالة الأخيرة.
    لا تستخدم صيغة JSON، فقط نص Markdown. تصرف كعضو في الفريق.
  `;

  if (userOpenRouterKey && !userGeminiKey) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userOpenRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (!resp.ok) throw new Error();
      const json = await resp.json();
      return json.choices[0]?.message?.content || "";
    } catch (e: any) {
      console.error("OpenRouter Room AI Error:", e);
      return isEn ? "Error invoking AI." : "حدث خطأ في الاتصال بالذكاء الاصطناعي.";
    }
  }

  const apiKey = userGeminiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return isEn ? "No API Key." : "لا يوجد مفتاح API.";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const result = await ai.models.generateContent({
      model: MODEL_NAME_ANALYSIS,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { tools: [{ googleSearch: {} }] }
    });
    return result.text || "";
  } catch (error: any) {
    console.error("Gemini Room AI Error:", error);
    return isEn ? "Error invoking AI." : "حدث خطأ في الاتصال بالذكاء الاصطناعي.";
  }
}
