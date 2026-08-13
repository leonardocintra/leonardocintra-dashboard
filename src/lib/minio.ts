import { Client as MinioClient } from "minio";

type MinioConfig = {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
};

const REQUIRED_ENV_VARS = [
  "MINIO_ENDPOINT",
  "MINIO_PORT",
  "MINIO_USE_SSL",
  "MINIO_ACCESS_KEY",
  "MINIO_SECRET_KEY",
  "MINIO_BUCKET",
] as const;

function readConfig(): MinioConfig {
  const values = {
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
  } as const;

  const missing = REQUIRED_ENV_VARS.filter((key) => !values[key]);
  if (missing.length > 0) {
    throw new Error(
      `MinIO environment is not configured. Missing variable(s): ${missing.join(", ")}. Configure them in .env.local`,
    );
  }

  const port = Number.parseInt(values.MINIO_PORT ?? "", 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(
      `MinIO environment is not configured. MINIO_PORT must be a positive number (got "${values.MINIO_PORT}").`,
    );
  }

  return {
    endPoint: values.MINIO_ENDPOINT ?? "",
    port,
    useSSL: (values.MINIO_USE_SSL ?? "false").toLowerCase() === "true",
    accessKey: values.MINIO_ACCESS_KEY ?? "",
    secretKey: values.MINIO_SECRET_KEY ?? "",
    bucket: values.MINIO_BUCKET ?? "",
  };
}

let cachedClient: MinioClient | null = null;
let cachedConfig: MinioConfig | null = null;

export function getMinioClient(): MinioClient {
  if (cachedClient) {
    return cachedClient;
  }

  const config = readConfig();
  cachedConfig = config;
  cachedClient = new MinioClient({
    endPoint: config.endPoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  });

  return cachedClient;
}

export function getMinioConfig(): MinioConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  getMinioClient();
  // getMinioClient() either returns the cached client or throws;
  // on success it always populates cachedConfig.
  if (!cachedConfig) {
    throw new Error(
      "MinIO environment is not configured. Set MINIO_* variables in .env.local",
    );
  }
  return cachedConfig;
}
