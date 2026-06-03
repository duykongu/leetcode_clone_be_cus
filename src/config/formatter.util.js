const formatTestcaseInput = (rawInput) => {
    if (!rawInput) return "";

    // 1. Xóa tiền tố "Input:" và các tên biến (vd: "nums = ", "target =")
    let cleaned = String(rawInput)
        .replace(/^input:\s*/i, '')
        .replace(/[a-zA-Z_]+\s*=\s*/g, '')
        .trim();

    // 2. Nếu LeetCode đã xuống dòng sẵn thì khỏe, trả về luôn
    if (cleaned.includes('\n')) {
        return cleaned.split('\n').map(line => line.trim()).filter(Boolean).join('\n');
    }

    // 3. THUẬT TOÁN DUYỆT CHUỖI: Cắt bằng dấu phẩy, BỎ QUA dấu phẩy trong mảng [], chuỗi ""
    let result = [];
    let current = '';
    let brackets = 0, braces = 0;
    let inString = false;

    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (char === '"') inString = !inString;

        if (!inString) {
            if (char === '[') brackets++;
            if (char === ']') brackets--;
            if (char === '{') braces++;
            if (char === '}') braces--;

            // Nếu gặp dấu phẩy và đang đứng ở ngoài (không bị bọc bởi ngoặc) -> Cắt!
            if (char === ',' && brackets === 0 && braces === 0) {
                result.push(current.trim());
                current = '';
                continue;
            }
        }
        current += char;
    }
    if (current.trim()) result.push(current.trim());

    return result.join('\n');
}

module.exports = { formatTestcaseInput };