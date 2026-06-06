const formatTestcaseInput = (rawInput) => {
    if (!rawInput) return "";

    // 1. Dọn dẹp tên biến, giữ nguyên hiện trạng của các dấu xuống dòng
    let cleaned = String(rawInput)
        .replace(/^input:\s*/i, '')
        .replace(/[a-zA-Z_]+\s*=\s*/g, '')
        .trim();

    // 2. THUẬT TOÁN ĐẾM NGOẶC (Balanced Parentheses)
    let result = [];
    let current = '';
    let brackets = 0, braces = 0;
    let inString = false;
    let isEscaped = false;

    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (isEscaped) {
            current += char;
            isEscaped = false;
            continue;
        }

        if (char === '\\') {
            current += char;
            isEscaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
        } else if (!inString) {
            if (char === '[') brackets++;
            if (char === ']') brackets--;
            if (char === '{') braces++;
            if (char === '}') braces--;

            // CẮT NẾU: Gặp dấu phẩy/xuống dòng VÀ đang ở lớp ngoài cùng
            if ((char === ',' || char === '\n' || char === '\r') && brackets === 0 && braces === 0) {
                if (current.trim()) result.push(current.trim());
                current = '';
                continue; 
            }
        }
        
        // CỨU CÁNH: Nếu ký tự xuống dòng nằm BÊN TRONG ngoặc (như bài Sudoku)
        // -> Biến nó thành dấu cách để JSON vẫn nằm trọn trên 1 dòng
        if (char === '\n' || char === '\r') {
            current += ' ';
            continue;
        }

        current += char;
    }

    if (current.trim()) result.push(current.trim());
    
    // Trả về các biến phân tách bằng \n để Wrapper chia dòng dễ dàng
    return result.join('\n');
}

module.exports = { formatTestcaseInput };