"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_URL = void 0;
const { env } = process;
exports.DB_URL = env.MONGODB_URL;
