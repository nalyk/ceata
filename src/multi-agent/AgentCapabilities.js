// Core interfaces for multi-agent capabilities and task management
export var SpecializationLevel;
(function (SpecializationLevel) {
    SpecializationLevel["GENERAL"] = "general";
    SpecializationLevel["SPECIALIZED"] = "specialized";
    SpecializationLevel["EXPERT"] = "expert"; // Deep domain knowledge + local context
})(SpecializationLevel || (SpecializationLevel = {}));
export var TaskComplexity;
(function (TaskComplexity) {
    TaskComplexity["SIMPLE"] = "simple";
    TaskComplexity["MEDIUM"] = "medium";
    TaskComplexity["COMPLEX"] = "complex"; // 3+ domains, requires orchestration
})(TaskComplexity || (TaskComplexity = {}));
