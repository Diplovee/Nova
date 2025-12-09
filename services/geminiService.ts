import { GoogleGenAI, Type } from "@google/genai";
import { Attachment } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateSubtasks = async (taskContext: string, attachments: Attachment[] = []): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini");
    return ["Add your API Key to .env", "Define project scope", "Allocate resources"];
  }

  try {
    const parts: any[] = [];

    // Add Attachments
    attachments.forEach(att => {
        // Remove data URL prefix to get raw base64
        const base64Data = att.url.split(',')[1];
        if (base64Data) {
            parts.push({
                inlineData: {
                    mimeType: att.mimeType,
                    data: base64Data
                }
            });
        }
    });

    // Add Text Prompt
    const promptText = `Given the project task or idea: "${taskContext}", provide a list of 3-5 concrete, actionable subtasks or next steps. 
    If images or audio are provided, analyze them to infer context and relevant tasks.`;
    
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{"subtasks": []}');
    return result.subtasks;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return ["Error generating tasks", "Check console for details"];
  }
};

export const refineText = async (currentText: string, instruction: string): Promise<string> => {
    if (!apiKey) return currentText;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Rewrite the following text based on this instruction: "${instruction}". 
            
            Original Text: "${currentText}"
            
            Return ONLY the rewriten text. Keep it concise but formatted (markdown allowed).`
        });
        return response.text || currentText;
    } catch (error) {
        console.error("Gemini Refine Error:", error);
        return currentText;
    }
}

export const expandIdea = async (idea: string): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot expand idea.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Expand on this concept briefly (max 50 words) for a project planning card: "${idea}"`
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not expand idea.";
  }
};

export const generateNoteContent = async (topic: string, currentContent: string): Promise<string> => {
    if (!apiKey) return currentContent + "\n\n[API Key Missing]";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an intelligent note-taking assistant.
            Topic/Context: ${topic}
            Current Content: ${currentContent}
            
            Generate a detailed, well-structured markdown note continuation or expansion based on the topic. 
            Include headers, bullet points, and actionable insights.
            Do not repeat the current content, just append new useful information.`
        });
        return response.text || "";
    } catch (error) {
        console.error("Gemini Note Error:", error);
        return "\nError generating content.";
    }
};

export const generateProjectNote = async (context: string): Promise<string> => {
    if (!apiKey) return "# Error\nAPI Key Missing";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a comprehensive project document or meeting note based on this context: "${context}".
            
            Structure it with:
            1. Title (H1)
            2. Executive Summary
            3. Key Objectives (Bullet points)
            4. Detailed Analysis or Strategy
            5. Next Steps
            
            Use Markdown formatting.`
        });
        return response.text || "";
    } catch (error) {
        console.error("Gemini Project Note Error:", error);
        return "# Error\nCould not generate note.";
    }
};

export const generateSheetData = async (prompt: string): Promise<any> => {
    if (!apiKey) return {};

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a spreadsheet structure based on this request: "${prompt}".
            Return a JSON object where keys are cell IDs (e.g., "A1", "B2") and values are the cell content.
            Use row 1 for headers.
            Example format: { "A1": "Name", "B1": "Role", "A2": "Alice", "B2": "Dev" }
            Limit to 5 columns and 10 rows.`,
            config: {
                responseMimeType: "application/json"
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Gemini Sheet Error:", error);
        return {};
    }
};