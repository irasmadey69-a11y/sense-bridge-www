const { getStore } = require('@netlify/blobs');

const START_VALUE = 499986;

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers, body: '' };
    }

    const store = getStore({ name: 'sensebridge-counter' });
    const raw = await store.get('app-visits');
    let count = Number.parseInt(raw || '', 10);

    if (!Number.isFinite(count) || count < START_VALUE) {
      count = START_VALUE;
    }

    count += 1;
    await store.set('app-visits', String(count));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ count })
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ count: START_VALUE, fallback: true })
    };
  }
};
