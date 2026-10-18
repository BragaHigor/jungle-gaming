import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
  timeout: 8_000,
  headers: { Accept: "application/json" },
});
