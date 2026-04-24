export interface QuizQuestion {
  question: string;
  options: string[];   // always 4 items
  correct: number;     // index 0-3
  explanation: string;
  category: string;
}

export interface QuizCategory {
  id: string;
  label: string;
  emoji: string;
  color: number;
}

export const CATEGORIES: QuizCategory[] = [
  { id: 'animals',   label: 'Động vật',        emoji: '🐾', color: 0x27ae60 },
  { id: 'math',      label: 'Toán học',         emoji: '🔢', color: 0x2980b9 },
  { id: 'nature',    label: 'Thiên nhiên',      emoji: '🌿', color: 0x16a085 },
  { id: 'science',   label: 'Khoa học',         emoji: '🔬', color: 0x8e44ad },
  { id: 'geography', label: 'Địa lý',           emoji: '🌍', color: 0xe67e22 },
  { id: 'colors',    label: 'Màu & Hình dạng',  emoji: '🎨', color: 0xe74c3c },
];

// Fallback questions used when no API key is configured or API fails
const FALLBACK: Record<string, QuizQuestion[]> = {
  animals: [
    { question: 'Con vật nào sống dưới nước?', options: ['Chó', 'Cá', 'Mèo', 'Gà'], correct: 1, explanation: 'Cá sống và bơi dưới nước.', category: 'animals' },
    { question: 'Con vật nào có cánh và biết bay?', options: ['Voi', 'Cá sấu', 'Chim', 'Rùa'], correct: 2, explanation: 'Chim có cánh và có thể bay trên trời.', category: 'animals' },
    { question: 'Con vật nào lớn nhất trên cạn?', options: ['Sư tử', 'Voi', 'Hà mã', 'Tê giác'], correct: 1, explanation: 'Voi là động vật trên cạn lớn nhất thế giới.', category: 'animals' },
    { question: 'Con vật nào kêu "gâu gâu"?', options: ['Mèo', 'Chó', 'Bò', 'Lợn'], correct: 1, explanation: 'Chó kêu gâu gâu.', category: 'animals' },
    { question: 'Con vật nào cho chúng ta sữa?', options: ['Gà', 'Vịt', 'Bò', 'Chó'], correct: 2, explanation: 'Bò cho chúng ta sữa để uống.', category: 'animals' },
    { question: 'Con vật nào ngủ đông vào mùa lạnh?', options: ['Gấu', 'Hươu', 'Ngựa', 'Bò'], correct: 0, explanation: 'Gấu ngủ đông để tiết kiệm năng lượng vào mùa đông.', category: 'animals' },
  ],
  math: [
    { question: '3 + 4 = ?', options: ['5', '6', '7', '8'], correct: 2, explanation: '3 + 4 = 7', category: 'math' },
    { question: '10 - 3 = ?', options: ['6', '7', '8', '9'], correct: 1, explanation: '10 - 3 = 7', category: 'math' },
    { question: '2 × 5 = ?', options: ['7', '8', '9', '10'], correct: 3, explanation: '2 × 5 = 10', category: 'math' },
    { question: 'Số nào lớn hơn: 15 hay 9?', options: ['9', '15', 'Bằng nhau', 'Không biết'], correct: 1, explanation: '15 lớn hơn 9.', category: 'math' },
    { question: '5 + 5 + 5 = ?', options: ['10', '15', '20', '25'], correct: 1, explanation: '5 + 5 + 5 = 15', category: 'math' },
    { question: 'Có 12 quả táo, ăn 4 quả. Còn lại bao nhiêu?', options: ['6', '7', '8', '9'], correct: 2, explanation: '12 - 4 = 8 quả táo.', category: 'math' },
  ],
  nature: [
    { question: 'Mặt trời mọc ở hướng nào?', options: ['Tây', 'Bắc', 'Đông', 'Nam'], correct: 2, explanation: 'Mặt trời mọc ở hướng Đông và lặn ở hướng Tây.', category: 'nature' },
    { question: 'Cây cần gì để sống?', options: ['Đá', 'Ánh sáng và nước', 'Cát', 'Muối'], correct: 1, explanation: 'Cây cần ánh sáng mặt trời, nước và đất để sống.', category: 'nature' },
    { question: 'Nước đóng băng ở nhiệt độ bao nhiêu?', options: ['10°C', '0°C', '5°C', '20°C'], correct: 1, explanation: 'Nước đóng băng ở 0°C.', category: 'nature' },
    { question: 'Cầu vồng có bao nhiêu màu?', options: ['5', '6', '7', '8'], correct: 2, explanation: 'Cầu vồng có 7 màu: đỏ, cam, vàng, lục, lam, chàm, tím.', category: 'nature' },
    { question: 'Mưa đến từ đâu?', options: ['Núi', 'Đám mây', 'Biển', 'Sông'], correct: 1, explanation: 'Mưa rơi xuống từ các đám mây trên bầu trời.', category: 'nature' },
    { question: 'Hành tinh chúng ta sống là gì?', options: ['Sao Hỏa', 'Sao Mộc', 'Trái Đất', 'Sao Thổ'], correct: 2, explanation: 'Chúng ta sống trên hành tinh Trái Đất.', category: 'nature' },
  ],
  science: [
    { question: 'Màu gì tạo ra khi trộn đỏ và vàng?', options: ['Xanh', 'Cam', 'Tím', 'Nâu'], correct: 1, explanation: 'Đỏ + Vàng = Cam.', category: 'science' },
    { question: 'Thứ gì kéo kim loại?', options: ['Gỗ', 'Nhựa', 'Nam châm', 'Giấy'], correct: 2, explanation: 'Nam châm có thể hút và kéo các vật bằng kim loại.', category: 'science' },
    { question: 'Ánh sáng di chuyển nhanh hơn hay chậm hơn âm thanh?', options: ['Chậm hơn', 'Bằng nhau', 'Nhanh hơn', 'Không biết'], correct: 2, explanation: 'Ánh sáng đi nhanh hơn âm thanh rất nhiều.', category: 'science' },
    { question: 'Con người cần gì để thở?', options: ['Nước', 'Oxy', 'Carbon', 'Hydro'], correct: 1, explanation: 'Chúng ta cần oxy trong không khí để thở và sống.', category: 'science' },
    { question: 'Đá sẽ chìm hay nổi trên nước?', options: ['Nổi', 'Chìm', 'Tùy loại đá', 'Không thay đổi'], correct: 1, explanation: 'Đá nặng hơn nước nên sẽ chìm xuống.', category: 'science' },
    { question: 'Cơ thể người có bao nhiêu giác quan chính?', options: ['3', '4', '5', '6'], correct: 2, explanation: '5 giác quan: thị giác, thính giác, khứu giác, vị giác, xúc giác.', category: 'science' },
  ],
  geography: [
    { question: 'Thủ đô của Việt Nam là gì?', options: ['TP. Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội', 'Huế'], correct: 2, explanation: 'Hà Nội là thủ đô của Việt Nam.', category: 'geography' },
    { question: 'Đại dương lớn nhất thế giới là gì?', options: ['Đại Tây Dương', 'Ấn Độ Dương', 'Thái Bình Dương', 'Bắc Băng Dương'], correct: 2, explanation: 'Thái Bình Dương là đại dương lớn nhất thế giới.', category: 'geography' },
    { question: 'Việt Nam nằm ở châu nào?', options: ['Châu Âu', 'Châu Phi', 'Châu Mỹ', 'Châu Á'], correct: 3, explanation: 'Việt Nam nằm ở Đông Nam Á, thuộc châu Á.', category: 'geography' },
    { question: 'Núi cao nhất thế giới là gì?', options: ['Núi Alps', 'Núi Everest', 'Núi Phú Sĩ', 'Núi Kilimanjaro'], correct: 1, explanation: 'Núi Everest cao nhất thế giới với 8,848m.', category: 'geography' },
    { question: 'Sông dài nhất thế giới là gì?', options: ['Sông Amazon', 'Sông Nile', 'Sông Mê Kông', 'Sông Hoàng Hà'], correct: 1, explanation: 'Sông Nile ở châu Phi là con sông dài nhất.', category: 'geography' },
    { question: 'Trái Đất quay quanh thứ gì?', options: ['Mặt Trăng', 'Sao Hỏa', 'Mặt Trời', 'Sao Mộc'], correct: 2, explanation: 'Trái Đất quay quanh Mặt Trời mất 365 ngày.', category: 'geography' },
  ],
  colors: [
    { question: 'Trộn màu xanh dương và màu vàng tạo ra màu gì?', options: ['Cam', 'Tím', 'Xanh lá', 'Đỏ'], correct: 2, explanation: 'Xanh dương + Vàng = Xanh lá cây.', category: 'colors' },
    { question: 'Hình dạng nào có 3 cạnh?', options: ['Hình vuông', 'Hình tròn', 'Hình tam giác', 'Hình chữ nhật'], correct: 2, explanation: 'Hình tam giác có 3 cạnh và 3 góc.', category: 'colors' },
    { question: 'Màu của bầu trời trong ngày nắng là gì?', options: ['Đỏ', 'Xanh lam', 'Vàng', 'Xanh lá'], correct: 1, explanation: 'Bầu trời trong sáng có màu xanh lam.', category: 'colors' },
    { question: 'Hình dạng nào có 4 cạnh bằng nhau?', options: ['Hình chữ nhật', 'Hình thoi', 'Hình vuông', 'Hình thang'], correct: 2, explanation: 'Hình vuông có 4 cạnh bằng nhau và 4 góc vuông.', category: 'colors' },
    { question: 'Màu gì khi trộn đỏ và trắng?', options: ['Hồng', 'Cam', 'Tím', 'Nâu'], correct: 0, explanation: 'Đỏ + Trắng = Hồng.', category: 'colors' },
    { question: 'Hình tròn có bao nhiêu góc?', options: ['1', '2', '3', '0'], correct: 3, explanation: 'Hình tròn không có góc, đường viền của nó cong đều.', category: 'colors' },
  ],
};

export class QuizAPI {
  private apiKey = '';
  // custom questions loaded from quiz-questions.json, keyed by category
  private customPool: Record<string, QuizQuestion[]> = {};
  private usedCustom: Record<string, number> = {};
  private usedFallback: Record<string, number> = {};

  async init(): Promise<void> {
    await Promise.all([
      this.loadConfig(),
      this.loadCustomQuestions(),
    ]);
  }

  private async loadConfig(): Promise<void> {
    try {
      const res = await fetch(import.meta.env.BASE_URL + 'config/quiz-config.json');
      const cfg = await res.json() as { geminiApiKey?: string };
      this.apiKey = cfg.geminiApiKey ?? '';
    } catch {
      // no config file — use fallbacks only
    }
  }

  private async loadCustomQuestions(): Promise<void> {
    try {
      const res = await fetch(import.meta.env.BASE_URL + 'config/quiz-questions.json');
      if (!res.ok) return;
      const list = await res.json() as QuizQuestion[];
      for (const q of list) {
        if (!this.customPool[q.category]) this.customPool[q.category] = [];
        this.customPool[q.category].push(q);
      }
    } catch {
      // file optional
    }
  }

  hasApiKey(): boolean {
    return this.apiKey.length > 0 && this.apiKey !== 'YOUR_GEMINI_API_KEY';
  }

  async getQuestion(categoryId: string): Promise<QuizQuestion> {
    // 1. Custom questions from quiz-questions.json (priority)
    const custom = this.customPool[categoryId];
    if (custom?.length) {
      const idx = (this.usedCustom[categoryId] ?? 0) % custom.length;
      this.usedCustom[categoryId] = idx + 1;
      return custom[idx];
    }

    // 2. Gemini AI (if API key configured)
    if (this.hasApiKey()) {
      try {
        return await this.fetchFromGemini(categoryId);
      } catch (err) {
        console.warn('[QuizAPI] Gemini failed, using fallback:', err);
      }
    }

    // 3. Built-in fallback questions
    return this.getFallback(categoryId);
  }

  private async fetchFromGemini(categoryId: string): Promise<QuizQuestion> {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    const catLabel = cat?.label ?? categoryId;

    const prompt = `Tạo 1 câu hỏi trắc nghiệm cho trẻ em Việt Nam 5-10 tuổi về chủ đề: ${catLabel}.
Yêu cầu:
- Câu hỏi và đáp án bằng tiếng Việt
- Phù hợp với trẻ em, ngắn gọn, dễ hiểu
- Có đúng 4 đáp án

Chỉ trả về JSON (không có markdown, không có text khác):
{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}

"correct" là index 0-3 của đáp án đúng.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    // Strip markdown code fences if present
    const clean = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean) as Omit<QuizQuestion, 'category'>;

    if (
      typeof parsed.question !== 'string' ||
      !Array.isArray(parsed.options) || parsed.options.length !== 4 ||
      typeof parsed.correct !== 'number'
    ) {
      throw new Error('Invalid response shape');
    }

    return { ...parsed, category: categoryId };
  }

  private getFallback(categoryId: string): QuizQuestion {
    const pool = FALLBACK[categoryId] ?? FALLBACK['animals'];
    const idx  = (this.usedFallback[categoryId] ?? 0) % pool.length;
    this.usedFallback[categoryId] = idx + 1;
    return pool[idx];
  }
}
