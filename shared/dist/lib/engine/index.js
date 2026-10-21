"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Export all visible rules, aliases, and helpers
__exportStar(require("./rules.js"), exports);
// Export comparison engine and compatibility wrappers
__exportStar(require("./compare.js"), exports);
// Readiness Score (0-100), What-if simulator, prioritised next steps, best-fit project
__exportStar(require("./score.js"), exports);
__exportStar(require("./whatif.js"), exports);
__exportStar(require("./nextSteps.js"), exports);
__exportStar(require("./projectFit.js"), exports);
// Rule-based scam / legitimacy checker (plain TypeScript, no AI)
__exportStar(require("./scam.js"), exports);
//# sourceMappingURL=index.js.map