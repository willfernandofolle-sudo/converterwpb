export const ZIP_MODULES = [
    {
        id: "ewlog",
        name: "ew-log-viewer.js",
        label: "Datalogger",
        description: "",
        defaultChecked: false,
        urls: [
            "/modules/ew-log-viewer.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/ew-log-viewer.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/ew-log-viewer.js",
        ],
    },
    {
        id: "envelopeVisualization",
        name: "envelopeVisualization.js",
        label: "Envelope Visualization",
        description: "",
        defaultChecked: false,
        urls: [
            "/modules/envelopeVisualization.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/envelopeVisualization.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/envelopeVisualization.js",
        ],
    },
    {
        id: "progressbar",
        name: "progressbar.js",
        label: "Progress Bar",
        description: "",
        defaultChecked: false,
        urls: [
            "/modules/progressbar.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/progressbar.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/progressbar.js",
        ],
    },
    {
        id: "alarms",
        name: "alarms.js",
        label: "Alarms Visualization",
        description: "",
        defaultChecked: false,
        urls: [
            "/modules/alarms.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/alarms.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/alarms.js",
        ],
    },
    {
        id: "dynamicVisibility",
        name: "dynamicVisibility.js",
        label: "Dynamic Visibility",
        description: "",
        defaultChecked: false,
        urls: [
            "/modules/dynamicVisibility.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/dynamicVisibility.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/dynamicVisibility.js",
        ],
    },
    {
        id: "dynamicColor",
        name: "dynamicColor.js",
        label: "Dynamic Color",
        description: "",
        defaultChecked: false,
        urls: [
            "/modules/dynamicColor.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/dynamicColor.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/dynamicColor.js",
        ],
    },
];

export const AUTO_INCLUDE_MODULES = [
    {
        name: "LLWebServerExtended.js",
        urls: [
            "/modules/LLWebServerExtended.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/LLWebServerExtended.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/LLWebServerExtended.js",
        ],
    },
    {
        name: "scriptcustom.js",
        urls: [
            "/modules/scriptcustom.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/scriptcustom.js",
            "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/scriptcustom.js",
        ],
    },
];

export function buildDefaultModuleSelection(modules = ZIP_MODULES) {
    return modules.reduce((acc, module) => {
        acc[module.id] = module.defaultChecked;
        return acc;
    }, {});
}
