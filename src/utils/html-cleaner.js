const cheerio = require("cheerio");

/**
 * Loại bỏ hoàn toàn HTML và chuyển sang văn bản thuần túy
 * @param {string} html 
 * @returns {string}
 */
const cleanDescriptionHtml = (html) => {
    if (!html) return "";

    const $ = cheerio.load(html, null, false);

    // 1. Thay thế các thẻ xuống dòng phổ biến bằng ký tự xuống dòng thực tế
    $("br").replaceWith("\n");
    $("p, div, tr, li").each((i, el) => {
        $(el).append("\n");
    });

    // 2. Lấy toàn bộ văn bản thuần túy
    let plainText = $.text();

    // 3. Dọn dẹp các ký tự đặc biệt và khoảng trắng
    return plainText
        .replace(/&nbsp;/g, " ")
        .replace(/&minus;/g, "-")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        // Xử lý số mũ cho đẹp trong text thuần
        .replace(/<sup>(.*?)<\/sup>/g, "^$1") 
        // Loại bỏ các khoảng trắng thừa ở đầu/cuối mỗi dòng
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join("\n")
        .trim();
};

/**
 * Bóc tách HTML LeetCode thành cấu trúc JSON: des, example, condition
 * @param {string} html 
 * @returns {object}
 */
const structureDescription = (html) => {
    if (!html) return { des: "", example: [], condition: [] };

    const $ = cheerio.load(html, null, false);

    // 1. Bóc tách Examples (thường nằm trong thẻ pre)
    const examples = [];
    $("pre").each((i, el) => {
        const text = $(el).text();
        if (text.includes("Input:")) {
            const input = text.split("Input:")[1]?.split("Output:")[0]?.trim() || "";
            const output = text.split("Output:")[1]?.split("Explanation:")[0]?.trim() || "";
            const explanation = text.split("Explanation:")[1]?.trim() || "";
            examples.push({ input, output, explanation });
            // Xóa thẻ pre sau khi đã bóc tách để không lẫn vào description
            $(el).remove();
        }
    });

    // 2. Bóc tách Constraints (thường nằm sau tiêu đề Constraints hoặc trong danh sách ul)
    const conditions = [];
    $("ul li").each((i, el) => {
        conditions.push($(el).text().trim());
        $(el).remove(); // Xóa sau khi bóc
    });

    // 3. Phần còn lại là Description
    // Loại bỏ các tiêu đề lặp lại (Example 1, Example 2, Constraints...)
    $("p, strong, b, h1, h2, h3, h4").each((i, el) => {
        const text = $(el).text().trim();
        
        // Regex xóa "Example 1:", "Example 2:", "Examples:", "Constraints:"
        if (/^(Example\s*\d*[:\s]*|Examples[:\s]*|Constraints[:\s]*)$/i.test(text)) {
            $(el).remove();
        }
    });

    // 4. Dọn dẹp thẻ p trống hoặc chỉ có khoảng trắng dư thừa
    $("p").each((i, el) => {
        if (!$(el).text().trim() && $(el).children().length === 0) {
            $(el).remove();
        }
    });

    const description = $.html().trim();

    return {
        des: description,
        example: examples,
        condition: conditions
    };
};


module.exports = {
    cleanDescriptionHtml,
    structureDescription
};




