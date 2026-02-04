import { GoogleGenAI } from "@google/genai";
import { DashboardStats, ChartDataPoint } from '../types';

// Initialize Gemini API
// Note: API Key must be provided via environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEcoInsights = async (
  stats: DashboardStats,
  deptData: ChartDataPoint[],
  currentFilter: { dept: string; year: string }
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    // Construct a context-aware prompt
    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูลสิ่งแวดล้อม (Environmental Data Analyst) สำหรับองค์กร
      
      กรุณาวิเคราะห์สถิติการใช้กระดาษต่อไปนี้ และสรุปผลในรูปแบบภาษาไทยที่เข้าใจง่าย:

      ข้อมูลบริบท:
      - ตัวกรองปัจจุบัน: แผนก ${currentFilter.dept}, ปี ${currentFilter.year}
      
      สถิติหลัก:
      - การใช้กระดาษรวม: ${stats.totalSheetsUsed.toLocaleString()} แผ่น
      - จำนวนคำขอพิมพ์: ${stats.totalRequests.toLocaleString()} ครั้ง
      - ค่าเฉลี่ยต่อครั้ง: ${stats.averageSheetsPerRequest} แผ่น
      - แผนกที่ใช้เยอะที่สุด: ${stats.mostActiveDepartment}
      - การประหยัด (Sheets Saved): ${stats.sheetsSaved.toLocaleString()} แผ่น
      
      ผลกระทบสิ่งแวดล้อม:
      - ต้นไม้ที่ถูกตัด: ${stats.treesConsumed.toFixed(2)} ต้น
      - CO2 ที่ปล่อย: ${stats.co2Emitted.toFixed(2)} kg
      
      ข้อมูลรายแผนก (Top 3):
      ${deptData.slice(0, 3).map(d => `- ${d.name}: ${d.value} แผ่น`).join('\n')}

      สิ่งที่ต้องการให้ตอบ (Output Requirements):
      1. **สรุปภาพรวม (Overview):** สั้นๆ เกี่ยวกับสถานการณ์ปัจจุบัน
      2. **จุดที่น่าสังเกต (Key Findings):** 2-3 ข้อ (เช่น แผนกไหนใช้เยอะผิดปกติ หรือแนวโน้มการประหยัดเป็นอย่างไร)
      3. **ข้อแนะนำ (Action Items):** 2 ข้อ เพื่อลดการใช้กระดาษหรือเพิ่มประสิทธิภาพ โดยอิงจากข้อมูล
      
      โทนการตอบ: เป็นทางการแต่เป็นมิตร, สนับสนุนให้รักษ์โลก (Eco-friendly tone)
      ไม่ต้องใช้ Markdown Heading ใหญ่ (h1) ให้ใช้แค่ Bold หรือ bullet points
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่อีกครั้ง";
  }
};