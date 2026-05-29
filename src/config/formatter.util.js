
const formatTestcaseInput = (rawInput) => {
   if (!rawInput) return "";
    // Đảm bảo rawInput luôn là chuỗi trước khi replace
    let multiLineInput = String(rawInput).replace(/,\s*(?=[a-zA-Z_]+\s*=)/g, '\n'); 
    let cleaned = multiLineInput.replace(/[a-zA-Z_]+\s*=\s*/g, '');
    return cleaned.split('\n').map(line => line.trim()).filter(Boolean).join('\n');
}
module.exports = { formatTestcaseInput };

