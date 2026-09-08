const { disableTypes } = require("image-size");
// This linter processes the package's PNG icons. Disable vulnerable unused parsers.
disableTypes(["icns", "jxl", "jxl-stream", "heif", "heic", "avif"]);
