# Trend Engine

An advanced, open-source intelligence dashboard designed for field operatives, OSINT investigators, and anti-corruption agencies. Trend Engine monitors global trends, identifies fabrication (bot attacks/astroturfing), evaluates corruption risk, and provides actionable insights.

![Trend Engine Dashboard Concept]

## Key Features
-   **Trend Categorization:** Filter live streams of data by sectors such as Technology, Geopolitics, Environment, and Security.
-   **Fabrication Detection:** Utilizes sophisticated prompts via Gemini to detect organic vs. artificially driven trends.
-   **Corruption Risk Analysis:** Generates a real-time Risk Index (1-100) on active global concerns indicating the likelihood of embedded malfeasance.
-   **Actionable Intelligence:** Issues structured reports for authorities with specific interventions and evidence tracking.
-   **Collaborative Investigation Rooms:** Host and join real-time multiplayer rooms using WebSockets. Share evidence types (images, crypto hashes, text logs) which are persistently saved via **SQLite**.
-   **Room AI Agent:** Mention `@ai` inside a collaborative room to invoke a specialized OSINT Assistant that remembers the entire chat history and all submitted evidence.
-   **Bento-Grid Dashboard:** Highly responsive, dark-mode terminal aesthetic interface optimized for high-density information arrays.
-   **Bilingual Interface:** Supports full RTL (Arabic) and LTR (English) bridging global operations.

## Technology Stack
-   **Frontend:** React 19, TypeScript, Tailwind CSS, Framer Motion
-   **Visualization:** React Cytoscapejs (Network Graph Mapping)
-   **Intelligence Layer:** Google Gemini API (via `@google/genai` sdk) + OpenRouter API integration.

## Getting Started / طريقة الاستخدام

### Prerequisites / المتطلبات
- Node.js >= 18
- Valid Gemini API Key (or OpenRouter Key) / مفتاح جيمني أو أوبن راوتر للتفعيل.

### Installation / التثبيت
1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/trend-engine.git
   cd trend-engine
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (which includes the Express server for RSS fetching):
   ```bash
   npm run dev
   ```

### How to Use / كيفية الاستخدام
**English:**
1. Open the application.
2. Click the Settings (Gear) icon in the top right to open the Control Panel.
3. Select your preferred language (English or Arabic).
4. Enter your Gemini API Key or OpenRouter API key and click "Save & Close".
5. The Live Feed (RSS) will automatically fetch the latest global news headlines from reliable search engines to ground the analysis.
6. Enter a query, hashtag, or topic into the Command Interface and click "ANALYZE".
7. The system will consult the live news feed, process the query, and map the key players, victims, and beneficiaries on the Knowledge Graph.

**العربية:**
1. افتح التطبيق.
2. انقر على أيقونة الإعدادات (الترس) في الزاوية العلوية لفتح لوحة التحكم.
3. اختر لغتك المفضلة (العربية أو الإنجليزية).
4. أدخل مفتاح واجهة برمجة التطبيقات (API Key) الخاص بـ Gemini أو OpenRouter وانقر على "حفظ وإغلاق".
5. ستقوم ميزة "أخبار حية (RSS)" بجلب أحدث الأخبار العالمية من محركات البحث تلقائياً لتعزيز دقة التحليل.
6. أدخل موضوعاً، أو وسماً (Hashtag)، أو استفساراً في نظام الأوامر وانقر على "تحليل".
7. سيقوم النظام بمراجعة موجز الأخبار الحي، معالجة استفسارك، ورسم خريطة بيانية توضح الفاعلين الرئيسيين، الضحايا، والمستفيدين على الشبكة.

## Architecture
The application runs as a full-stack container:
-   **Frontend:** React (Vite) client offering a highly interactive dashboard.
-   **Backend:** Express + Node.js server handling RSS fetching, WebSocket connections for multiplayer rooms, and local AI routing tasks.
-   **Database:** `better-sqlite3` is used persistently on the server to store Collaborative Investigator Rooms, Chats, and Evidence.
-   **AI Integration:** Real-time inference utilizes `@google/genai` on the client side, seamlessly connecting user-provided keys for OSINT reporting.

## License
MIT License.

---
*Built for absolute transparency.*
