exports.handler = async function (event) {
  const START_COUNT = 499986;

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("sense-bridge-counter");

    const key = "app-visits";
    const currentRaw = await store.get(key);
    let count = currentRaw ? parseInt(currentRaw, 10) : START_COUNT;

    const shouldIncrement = event.queryStringParameters?.inc === "1";

    if (shouldIncrement) {
      count += 1;
      await store.set(key, String(count));
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        count,
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
