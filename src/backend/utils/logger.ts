import * as winston from "winston";
import * as path from "path";
import * as fs from "fs";
import { app } from "electron";
import DailyRotateFile from "winston-daily-rotate-file";

const userDataPath = app.getPath("userData");
const logsDir = path.join(userDataPath, "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.printf((info) => {
  const { timestamp, level, message, stack, ...meta } =
    info as winston.Logform.TransformableInfo;
  const metaKeys = Object.keys(meta);
  const metaString = metaKeys.length > 0 ? ` ${JSON.stringify(meta)}` : "";
  const baseMessage = stack ? `${message}\n${stack}` : message;
  return `${timestamp} [${String(level).toUpperCase()}] ${baseMessage}${metaString}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat,
  ),
  defaultMeta: { service: "notegit" },
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "5m",
      maxFiles: "14d",
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, "error-%DATE%.log"),
      level: "error",
      datePattern: "YYYY-MM-DD",
      maxSize: "5m",
      maxFiles: "14d",
    }),
  ],
});

if (process.env.NODE_ENV === "development") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

export default logger;
