const API_BASE_URL = "http://192.168.5.22:58010";

const getApiUrl = () => {
  const configuredUrl = process.env.REACT_APP_API_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "::1") {
      return `http://${hostname}:58010`;
    }
  }

  return API_BASE_URL;
};

const API_URL = getApiUrl();

export default {
  API_URL,
  API_BASE_URL,
};