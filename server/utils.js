const path = require('path');

/**
 * throw messages and errors in console
 * with req, res passed, loggers output errors to browser as 500 as well
 */
const composeLoggers = (req, res) => ({
  showMessage: (message, heading) => console.log(`\x1b[32m${heading || 'OK'}\x1b[0m - ${message}`),
  showError: (message, { browser = true } = {}) => {
    console.log(`\x1b[31mERR\x1b[0m - ${message}\n`);
    if (res && browser) {
      res.status(500).send(`
        <p style="color: red; font-size: 16px;">
          <span style="font-size: 30px;">500 Uncaught exception</span>
          <pre style="color: red; font-size: 16px;">${message}</pre>
        </p>
      `);
    }
  },
});


/**
 * encode by removing ending slash and replacing slashes in text with %2f
 * decode by doing the opposite
 */
const encodeUrl = url => url.replace(/\/$/, '').replace(/\//g, '%2f');
// const decodeUrl = url => `${url.replace(/%2f/, '/')}/`;

/**
 * model -> json
 * json -> json
 * htm -> htm
 */
const typeToExtension = type => (type === 'htm' ? 'htm' : 'json');

/**
 * Returns transformers for route
 * @param url - the url used for route
 * @param slug - slug, passed incase request doesn't exist
 * @param getSlug - a function to return resource slug, given req, res
 * @param getUrl - gets URL by slug
 * @param getQuery - gets query object by slug
 * @param getBody - gets Body data object by slug
 * @param getHeaders - gets Headers data object by slug
 * @param dirName - dirname of router, by default all the stubs will be kept in ./stubs/ folder
 * @param type - extension
 */
const composeRequestDecoder = ({ url, slug, getSlug, getUrl, getQuery, getBody, getHeaders, dirName, type = 'json' }) =>
  (req, res) => {
    const { showError } = composeLoggers(req, res);

    if (type === 'proxy') {
      return {
        filePath: path.resolve(dirName, './stubs/null'),
        url: getUrl && getUrl(req) || typeof url === 'string' ? url : url[0],
        query: getQuery ? getQuery(req) : req.query,
        body: getBody ? getBody(req) : req.body,
        headers: getHeaders ? getHeaders(req) : req.headers,
      };
    }
    /**
     * slug is unique identifier rather than a fileName,
     * it still contains slashes and must still be encoded
     * slug may either be passed straight, or fetched from request via getSlug
     * resulting slug must be a string
     */
    slug = `${slug || getSlug && getSlug(req, res) || ''}`;
    if (!slug && type !== 'proxy') {
      showError(`
        getFilename of a router returned incorrect slug,\
        string expected, found (${typeof slug}) ${slug}
      `);
      return false;
    }
    const fileName = encodeUrl(slug);

    return {
      slug,
      filePath: path.resolve(
        dirName,
        `./stubs/${fileName}.${typeToExtension(type)}`,
      ),
      url: getUrl && getUrl(slug) || (typeof url === 'string' ? url : url[0]),
      query: getQuery ? getQuery(slug) : null,
      body: getBody ? getBody(slug) : null,
      headers: getHeaders ? getHeaders(slug) : null,
    };
  };

module.exports = {
  composeLoggers,
  composeRequestDecoder,
};
