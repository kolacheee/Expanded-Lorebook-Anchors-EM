(function () {
    const extensionName = 'world-info-folders';
    const cssPath = `scripts/extensions/${extensionName}/style.css`;
    const jsPath = `scripts/extensions/${extensionName}/index.js`;

    // Function to load a CSS file
    function loadCSS(path) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = path;
        document.head.appendChild(link);
    }

    // Function to load a JS file
    function loadJS(path) {
        const script = document.createElement('script');
        script.src = path;
        document.body.appendChild(script);
    }

    // Load the extension's assets
    loadCSS(cssPath);
    loadJS(jsPath);

})();
