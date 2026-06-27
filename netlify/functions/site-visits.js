const { getStore, connectLambda } = require("@netlify/blobs");

exports.handler = async function (event) {
  const START_COUNT = 50000;

  try {
    connectLambda(event);

    const store = getStore("sense-bridge-counter");
    const key = "site-visits-v4";

    const currentRaw = await store.get(key);
    let count = currentRaw ? parseInt(currentRaw, 10) : START_COUNT;

    if (!Number.isFinite(count) || count < START_COUNT) {
      count = START_COUNT;
    }

    const shouldIncrement = event.queryStringParameters?.inc === "1";

    if (shouldIncrement) {
      count += 1;
      await store.set(key, String(count));
    }

    const savedRaw = await store.get(key);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        count,
        saved: savedRaw || null,
        fallback: false
      })
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        count: START_COUNT,
        fallback: true,
        error: error.message
      })
    };
  }
};
