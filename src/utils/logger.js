const originalConsoleLog = console.log;

// פונקציה שמתקנת טקסט בעברית ומדפיסה נכון
console.log = function (...args) {
    const fixedArgs = args.map(arg => (typeof arg === "string" ? fixHebrew(arg) : arg));
    originalConsoleLog(...fixedArgs);
};

// פונקציה להפיכת טקסט בעברית
function fixHebrew(text) {
    return text.split("").reverse().join("");
}

module.exports = console.log;
