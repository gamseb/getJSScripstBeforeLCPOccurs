### The task: 
write a JS script that generates a list of JS files that are being loaded on the search results page of omio.com before the LCP event occurs.

### Details:
- tools: Node.js, Puppeteer
- LCP = Largest Contentful Paint (example how to listen catch LCP event https://gist.github.com/addyosmani/c053f68aead473d7585b45c9e8dce31e)
- in order to parse search results page the script has to navigate (i.e perform a search, choose any city you want) to that page from the main page, omio.com
- the results script should export a function `getJSScripstBeforeLCPOccurs` that can be called from other JS programs