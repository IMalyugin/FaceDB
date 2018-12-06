const fs = require('fs');
const path = require('path');

/** if we find bundle.css file in build folder, we assume it is production */
const productionBundlePath = path.resolve(__dirname, '../build/bundle.css');

/**
 * incase we attempted to parse server.js and found some syntax error or window reference, we save the error
 * to throw it again without attempting the eval again. Otherwise, we just get babel-reference error instead
 */
let parseError = null;

/**
 * Composite function, returns request handler
 * React Html renderer, outputs html template with react render call
 * and server render result if server bundle is available
 * @param Component - name of the root component
 * @param model - page data model
 */
module.exports = (Component, model) => (
  (req, res) => {
    console.assert(typeof Component === 'string', 'Undefined component in call to render');
    console.assert(typeof model === 'object', 'Undefined model in call to render');
    const getServerRenderedHtml = () => {
      const serverBundlePath = '../build/server.js';

      /** check if we have parseError in current server.js build */
      if (parseError) {
        throw parseError;
      } else if (fs.existsSync(path.resolve(__dirname, serverBundlePath))) {
        /** dynamically require server bundle in order to avoid server restart */
        try {
          eval(`require('${serverBundlePath}')`); // eslint-disable-line
        } catch (e) {
          /** if an error occured we save it to throw again after we restart the page */
          parseError = e;
          throw e;
        }
      }

      if (global.ReactDOMServer) {
        return global.ReactDOMServer.renderToString(global.React.createElement(global.beeline.pages[Component], model));
      }
      return '';
    };

    let html;
    let error;

    try {
      html = getServerRenderedHtml();
    } catch (e) {
      error = e.stack;
    }

    res.render('index', {
      Component: `beeline.pages.${Component}`,
      html,
      error,
      isProduction: fs.existsSync(productionBundlePath),
      model,
    });
  }
);
