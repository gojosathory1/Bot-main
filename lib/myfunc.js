// lib/myfunc.js

const fetch = require("node-fetch");

/**
 * Fetch JSON data from a URL
 */
async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    return json;
  } catch (err) {
    return { error: true, message: err.message };
  }
}

module.exports = {
  fetchJson
};
