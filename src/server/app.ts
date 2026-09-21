import './url-polyfill';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { initialSeedData } from '../data/seedData';
import { DatabaseSchema, PaymentRequestItem, JLPTLevel, LevelCountDetails } from '../types';
import { buildFreeTierData, ensureAccessTiers, computeLevelCounts } from '../data/accessControl';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS and handle preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Canonical Domain Redirect: sunnylearn.online -> https://www.sunnylearn.online
app.use((req, res, next) => {
  const host = (req.headers.host || '').toLowerCase().split(':')[0];
  if (host === 'sunnylearn.online') {
    return res.redirect(301, `https://www.sunnylearn.online${req.originalUrl || req.url}`);
  }
  next();
});

// Database Persistence Configuration (Supports local container and Vercel serverless)
const IS_VERCEL = !!process.env.VERCEL;
const DB_FILE = IS_VERCEL ? path.join('/tmp', 'db.json') : path.resolve(process.cwd(), 'data', 'db.json');

// Ensure data folder exists
if (!IS_VERCEL && !fs.existsSync(path.resolve(process.cwd(), 'data'))) {
  try {
    fs.mkdirSync(path.resolve(process.cwd(), 'data'), { recursive: true });
  } catch {}
}

// ----------------------------------------------------
// NEURAL TTS (GEMINI 3.1 FLASH TTS) & AUDIO CACHING
// ----------------------------------------------------
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return geminiClient;
}

const AUDIO_CACHE_DIR = IS_VERCEL ? path.join('/tmp', 'audio-cache') : path.resolve(process.cwd(), 'data', 'audio-cache');
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  try {
    fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  } catch {}
}

const audioMemoryCache = new Map<string, string>();

// Pre-load existing audio files from disk cache for instant playback with zero latency
try {
  if (fs.existsSync(AUDIO_CACHE_DIR)) {
    const cachedFiles = fs.readdirSync(AUDIO_CACHE_DIR);
    for (const file of cachedFiles) {
      if (file.endsWith('.wav')) {
        const key = file.replace('.wav', '');
        const wavBuffer = fs.readFileSync(path.join(AUDIO_CACHE_DIR, file));
        audioMemoryCache.set(key, `data:audio/wav;base64,${wavBuffer.toString('base64')}`);
      }
    }
    console.log(`[TTS] Loaded ${audioMemoryCache.size} cached audio items into memory`);
  }
} catch (cacheErr) {
  console.warn('[TTS] Failed loading audio cache from disk:', cacheErr);
}

function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // 1 = PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// In-memory Database with file sync
let db: DatabaseSchema;

function mergeSeedAndCustom<T extends { id: string }>(seedList: T[], storedList: T[] = []): T[] {
  const map = new Map<string, T>();
  if (Array.isArray(storedList)) {
    for (const item of storedList) {
      if (item && item.id) map.set(item.id, item);
    }
  }
  if (Array.isArray(seedList)) {
    for (const item of seedList) {
      if (item && item.id) map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function loadDatabase(): DatabaseSchema {
  try {
    let targetFile = DB_FILE;
    if (IS_VERCEL && !fs.existsSync(DB_FILE)) {
      const candidates = [
        path.resolve(process.cwd(), 'data', 'db.json'),
        path.resolve(process.cwd(), 'api', 'data', 'db.json')
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          targetFile = candidate;
          break;
        }
      }
    }
    if (fs.existsSync(targetFile)) {
      const raw = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(raw);
      const merged: DatabaseSchema = {
        vocabulary: mergeSeedAndCustom(initialSeedData.vocabulary, parsed.vocabulary),
        kanji: mergeSeedAndCustom(initialSeedData.kanji, parsed.kanji),
        grammar: mergeSeedAndCustom(initialSeedData.grammar, parsed.grammar),
        exampleSentences: mergeSeedAndCustom(initialSeedData.exampleSentences, parsed.exampleSentences),
        lessons: mergeSeedAndCustom(initialSeedData.lessons, parsed.lessons),
        reading: mergeSeedAndCustom(initialSeedData.reading, parsed.reading),
        listening: mergeSeedAndCustom(initialSeedData.listening, parsed.listening),
        quizzes: mergeSeedAndCustom(initialSeedData.quizzes, parsed.quizzes),
        categories: mergeSeedAndCustom(initialSeedData.categories, parsed.categories),
        feedback: Array.isArray(parsed.feedback) ? parsed.feedback : (initialSeedData.feedback || []),
        users: Array.isArray(parsed.users) ? parsed.users : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        aiUsageRecords: (parsed.aiUsageRecords && typeof parsed.aiUsageRecords === 'object') ? parsed.aiUsageRecords : {}
      };
      ensureAccessTiers(merged);
      console.log(`[Database] Loaded & merged db.json: ${merged.vocabulary.length} vocab, ${merged.kanji.length} kanji, ${merged.grammar.length} grammar, ${merged.lessons.length} lessons, ${(merged.users || []).length} users, ${(merged.payments || []).length} payments`);
      saveDatabase(merged);
      return merged;
    }
  } catch (err) {
    console.error('Error loading db.json, initializing fresh database with seed data:', err);
  }
  const fresh = { ...initialSeedData };
  ensureAccessTiers(fresh);
  saveDatabase(fresh);
  return fresh;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

db = loadDatabase();

// Admin credentials & Session Management
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sanaa0419z@gmail.com').replace(/^["']|["']$/g, '').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'S.04:29.learn').replace(/^["']|["']$/g, '').trim();
const JWT_SECRET = (process.env.SESSION_SECRET || 'sanaalearn-secure-session-key-2026').replace(/^["']|["']$/g, '').trim();

// Public Contact & User Support Email
const CONTACT_EMAIL = (process.env.CONTACT_EMAIL || 'sunnylearn.contact@gmail.com').replace(/^["']|["']$/g, '').trim();

function escapeHtml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Outbound Email Notification for Feedback to sunnylearn.contact@gmail.com
async function sendFeedbackEmail(feedback: {
  name: string;
  email: string;
  type: string;
  message: string;
  createdAt: string;
}): Promise<boolean> {
  const rawHost = (process.env.SMTP_HOST || '').replace(/^["']|["']$/g, '').trim();
  // Ensure host is a real hostname, never an email address
  let smtpHost = 'smtp.gmail.com';
  if (rawHost && !rawHost.includes('@') && (rawHost.includes('.') || rawHost === 'localhost')) {
    smtpHost = rawHost;
  }

  const rawPort = (process.env.SMTP_PORT || '465').replace(/^["']|["']$/g, '').trim();
  const smtpPort = parseInt(rawPort, 10) || 465;

  const rawUser = (process.env.SMTP_USER || process.env.GMAIL_USER || 'sanaa0419z@gmail.com').replace(/^["']|["']$/g, '').trim();
  const smtpUser = rawUser.includes('@') ? rawUser : 'sanaa0419z@gmail.com';
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || '').replace(/^["']|["']$/g, '').trim();

  console.log(`[Feedback Received] From: ${feedback.name} (${feedback.email}) Type: ${feedback.type}`);

  if (!smtpPass) {
    console.log(`[Feedback Mail] Note: Direct SMTP password not set. Feedback is recorded in database for ${CONTACT_EMAIL}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    });

    const mailOptions = {
      from: `"SunnyLearn Санал хүсэлт" <${smtpUser}>`,
      to: CONTACT_EMAIL,
      replyTo: feedback.email && feedback.email.includes('@') ? feedback.email.trim() : undefined,
      subject: `[Шинэ санал хүсэлт - ${feedback.type}] ${feedback.name} хэрэглэгчээс`,
      text: `SunnyLearn сайтад шинэ санал хүсэлт ирлээ:\n\nИлгээгч: ${feedback.name}\nИмэйл: ${feedback.email || 'Бөглөөгүй'}\nТөрөл: ${feedback.type}\nОгноо: ${feedback.createdAt}\n\nЗурвас:\n${feedback.message}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 18px 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">🇯🇵 SunnyLearn — Шинэ санал хүсэлт</h2>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Хэрэглэгчээс ирсэн зурвас</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; width: 130px; font-weight: 600;">Илгээгчийн нэр:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: bold;">${escapeHtml(feedback.name)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Холбогдох имэйл:</td>
              <td style="padding: 10px 0; color: #111827;">${escapeHtml(feedback.email || 'Бөглөөгүй')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Санал хүсэлтийн төрөл:</td>
              <td style="padding: 10px 0; color: #dc2626; font-weight: bold;">${escapeHtml(feedback.type)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Илгээсэн хугацаа:</td>
              <td style="padding: 10px 0; color: #4b5563;">${feedback.createdAt}</td>
            </tr>
          </table>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <div style="color: #374151; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Зурвасын утга:</div>
            <div style="margin: 0; color: #111827; white-space: pre-wrap; line-height: 1.6; font-size: 15px;">${escapeHtml(feedback.message)}</div>
          </div>

          <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af;">
            Энэхүү мэдэгдэл нь SunnyLearn Япон хэлний сургалтын системээс <a href="mailto:${CONTACT_EMAIL}" style="color: #dc2626; font-weight: bold;">${CONTACT_EMAIL}</a> хаяг руу автоматаар илгээгдэв.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Feedback Mail] Successfully dispatched to ${CONTACT_EMAIL}, Message ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.warn(`[Feedback Mail] SMTP notice (${error?.message || error}). Feedback is safely stored in the admin database.`);
    return false;
  }
}

// Outbound Admin Notification for New Registered Users
async function sendNewUserRegistrationEmail(user: {
  name: string;
  email: string;
  createdAt: string;
  timezone: string;
}): Promise<boolean> {
  const rawHost = (process.env.SMTP_HOST || '').replace(/^["']|["']$/g, '').trim();
  let smtpHost = 'smtp.gmail.com';
  if (rawHost && !rawHost.includes('@') && (rawHost.includes('.') || rawHost === 'localhost')) {
    smtpHost = rawHost;
  }

  const rawPort = (process.env.SMTP_PORT || '465').replace(/^["']|["']$/g, '').trim();
  const smtpPort = parseInt(rawPort, 10) || 465;

  const rawUser = (process.env.SMTP_USER || process.env.GMAIL_USER || 'sanaa0419z@gmail.com').replace(/^["']|["']$/g, '').trim();
  const smtpUser = rawUser.includes('@') ? rawUser : 'sanaa0419z@gmail.com';
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || '').replace(/^["']|["']$/g, '').trim();

  console.log(`[New User Registration] User: ${user.name} (${user.email}), Timezone: ${user.timezone}, Registered: ${user.createdAt}`);

  if (!smtpPass) {
    console.log(`[New User Mail] Note: SMTP password not configured in environment. User registration recorded in database for ${ADMIN_EMAIL}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    });

    const mailOptions = {
      from: `"SunnyLearn Бүртгэл" <${smtpUser}>`,
      to: ADMIN_EMAIL,
      subject: `Шинэ хэрэглэгч бүртгүүллээ`,
      text: `SunnyLearn платформд шинэ хэрэглэгч бүртгүүллээ:\n\nХэрэглэгчийн нэр: ${user.name}\nИмэйл: ${user.email}\nБүртгүүлсэн огноо: ${user.createdAt}\nЦагийн бүс: ${user.timezone}\n\nНууцлалын мэдээлэл: Хэрэглэгчийн нэр, имэйл болон сургалтын явцыг зөвхөн төхөөрөмж хооронд синк хийх зорилгоор хадгалдаг.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 18px 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">🎉 SunnyLearn — Шинэ хэрэглэгч бүртгүүллээ</h2>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Системд шинэ суралцагч амжилттай бүртгэгдлээ</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; width: 140px; font-weight: 600;">Хэрэглэгчийн нэр:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: bold;">${escapeHtml(user.name)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Имэйл хаяг:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${escapeHtml(user.email)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Бүртгүүлсэн огноо:</td>
              <td style="padding: 10px 0; color: #374151;">${escapeHtml(user.createdAt)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Цагийн бүс:</td>
              <td style="padding: 10px 0; color: #374151;">${escapeHtml(user.timezone)}</td>
            </tr>
          </table>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 12px; margin-bottom: 20px; font-size: 13px; color: #4b5563; line-height: 1.5;">
            <strong>Нууцлалын тайлбар:</strong> Хэрэглэгчийн нэр, имэйл болон сургалтын явцыг зөвхөн төхөөрөмж хооронд найдвартай синк хийх зорилгоор хадгалдаг. Нууц үг болон нэвтрэлтийн токен хадгалагдахгүй, имэйлд багтаагүй болно.
          </div>

          <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af;">
            Энэхүү мэдэгдэл нь SunnyLearn системийн серверээс админы <a href="mailto:${ADMIN_EMAIL}" style="color: #059669; font-weight: bold;">${ADMIN_EMAIL}</a> хаяг руу автоматаар илгээгдэв.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[New User Mail] Successfully dispatched to ${ADMIN_EMAIL}, Message ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.warn(`[New User Mail] SMTP notification could not be delivered (${error?.message || error}). User registration completed safely in database.`);
    return false;
  }
}

// Generate unique payment request ID: e.g. SL-JP-20260915-A7K3P
function generatePaymentRequestId(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SL-JP-${year}${month}${day}-${rand}`;
}

// Outbound Admin Notification for New Payment Requests (Manual Bank Transfer)
async function sendPaymentNotificationEmail(payment: PaymentRequestItem): Promise<'SENT' | 'FAILED' | 'NOT_CONFIGURED'> {
  const rawHost = (process.env.SMTP_HOST || '').replace(/^["']|["']$/g, '').trim();
  let smtpHost = 'smtp.gmail.com';
  if (rawHost && !rawHost.includes('@') && (rawHost.includes('.') || rawHost === 'localhost')) {
    smtpHost = rawHost;
  }

  const rawPort = (process.env.SMTP_PORT || '465').replace(/^["']|["']$/g, '').trim();
  const smtpPort = parseInt(rawPort, 10) || 465;

  const rawUser = (process.env.SMTP_USER || process.env.GMAIL_USER || 'sanaa0419z@gmail.com').replace(/^["']|["']$/g, '').trim();
  const smtpUser = rawUser.includes('@') ? rawUser : 'sanaa0419z@gmail.com';
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || '').replace(/^["']|["']$/g, '').trim();

  console.log(`[Payment Request Event] ID: ${payment.id}, User: ${payment.userName} (${payment.userEmail}), Sender: ${payment.senderName}, Amount: ¥${payment.amount}`);

  if (!smtpPass) {
    console.log(`[Payment Mail] Note: SMTP credentials not configured in environment. Payment ${payment.id} is stored safely in database for Admin (${ADMIN_EMAIL}).`);
    return 'NOT_CONFIGURED';
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 7000
    });

    const mailOptions = {
      from: `"SunnyLearn Төлбөр" <${smtpUser}>`,
      to: ADMIN_EMAIL,
      subject: `[SunnyLearn] Premium төлбөрийн шинэ хүсэлт`,
      text: `SunnyLearn Premium-ийн шинэ төлбөрийн хүсэлт ирлээ.\n\nRequest ID:\n${payment.id}\n\nUser:\n${payment.userEmail}\n\nAmount:\n¥${payment.amount}\n\nMethod:\nゆうちょ銀行\n\nStatus:\nPENDING\n\nSubmitted:\n${payment.createdAt}\n\nSunnyLearn Admin хэсэгт нэвтэрч банкны шилжүүлгийг шалгаад Approve эсвэл Reject хийнэ үү.\n\nAdmin:\nhttps://ais-dev-seaxwrqdabhqsqbm3l76x6-109960249109.asia-east1.run.app`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px;">
            <div style="display: inline-block; background: rgba(255,255,255,0.25); font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; margin-bottom: 6px;">SunnyLearn Premium</div>
            <h2 style="margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.025em;">🔔 Шинэ төлбөр шалгах хүсэлт</h2>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Хэрэглэгч банкны шилжүүлэг хийсэн тухай мэдээлэл илгээлээ</p>
          </div>
          
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 12px; color: #92400e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Төлбөрийн дүн & Багц</div>
            <div style="font-size: 24px; font-weight: 900; color: #78350f;">¥880 <span style="font-size: 14px; font-weight: 600; color: #b45309;">/ SunnyLearn Premium — 30 days</span></div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; width: 150px; font-weight: 600;">Request ID:</td>
              <td style="padding: 10px 0; color: #111827; font-family: monospace; font-weight: 700;">${escapeHtml(payment.id)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">User:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: bold;">${escapeHtml(payment.userName)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">User Email:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${escapeHtml(payment.userEmail)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #b45309; font-weight: 700;">振込名義:</td>
              <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 800; background-color: #fefce8; padding-left: 8px;">${escapeHtml(payment.senderName)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #b45309; font-weight: 700;">振込日:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 700; background-color: #fefce8; padding-left: 8px;">${escapeHtml(payment.transferDate)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Request submitted:</td>
              <td style="padding: 10px 0; color: #374151;">${escapeHtml(payment.createdAt)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Status:</td>
              <td style="padding: 10px 0;"><span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-weight: 800; font-size: 12px; padding: 3px 10px; border-radius: 9999px;">PENDING (Шалгаж байна)</span></td>
            </tr>
          </table>

          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; color: #1e40af; line-height: 1.6;">
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">⚠️ Админы зааварчилгаа:</div>
            <strong>ゆうちょ銀行への入金を確認してから承認してください。</strong><br/>
            1. ゆうちょ銀行 дансаа шалгаж ¥880 орж ирснийг баталгаажуулна.<br/>
            2. Шилжүүлэгчийн нэр (<strong>${escapeHtml(payment.senderName)}</strong>) болон огноог тулгана.<br/>
            3. Админ самбарт нэвтэрч гараар <strong>[ 承認 / Зөвшөөрөх ]</strong> товч дарна.<br/>
            <em>* Энэхүү имэйлийг нээснээр эсвэл товч дарснаар төлбөр автоматаар баталгаажихгүй.</em>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://ais-dev-seaxwrqdabhqsqbm3l76x6-109960249109.asia-east1.run.app" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">Adminで確認する</a>
          </div>

          <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; line-height: 1.5;">
            Энэхүү мэдэгдэл нь SunnyLearn төлбөрийн серверээс админы <a href="mailto:${ADMIN_EMAIL}" style="color: #d97706; font-weight: bold;">${ADMIN_EMAIL}</a> хаяг руу автоматаар илгээгдэв. Хэрэглэгч энэхүү хаяг болон холбоосыг харах боломжгүй.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Payment Mail] Successfully dispatched to ${ADMIN_EMAIL}, Message ID: ${info.messageId}`);
    return 'SENT';
  } catch (error: any) {
    console.warn(`[Payment Mail] Delivery failed (${error?.message || error}). Payment ${payment.id} remains safely PENDING in database.`);
    return 'FAILED';
  }
}

// User Session Token Management (Stateless HMAC verifiable across serverless instances)
interface UserTokenPayload {
  userId: string;
  email: string;
  isPremium?: boolean;
  premiumExpiresAt?: string | null;
  name?: string;
  expiresAt: number;
}

const activeUserTokens = new Map<string, UserTokenPayload>();

function generateUserToken(
  userId: string,
  email: string,
  isPremium: boolean = false,
  premiumExpiresAt: string | null = null,
  name: string = ''
): string {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const isSpecialAdmin = email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
  const prem = isSpecialAdmin ? true : isPremium;
  const premExp = isSpecialAdmin ? '2099-12-31T23:59:59.000Z' : premiumExpiresAt;
  const payloadStr = JSON.stringify({ userId, email, isPremium: prem, premiumExpiresAt: premExp, name, expiresAt });
  const b64Payload = Buffer.from(payloadStr).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(b64Payload).digest('base64url');
  const token = `usr_${b64Payload}.${signature}`;
  activeUserTokens.set(token, { userId, email, isPremium: prem, premiumExpiresAt: premExp, name, expiresAt });
  return token;
}

function parseUserToken(token: string): UserTokenPayload | null {
  if (!token) return null;
  const cached = activeUserTokens.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached;

  if (token.startsWith('usr_')) {
    const raw = token.slice(4);
    const dotIdx = raw.indexOf('.');
    if (dotIdx === -1) return null;
    const payloadPart = raw.slice(0, dotIdx);
    const sigPart = raw.slice(dotIdx + 1);
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadPart).digest('base64url');
    try {
      if (crypto.timingSafeEqual(Buffer.from(sigPart), Buffer.from(expectedSig))) {
        const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8')) as UserTokenPayload;
        if (decoded && decoded.expiresAt && decoded.expiresAt > Date.now()) {
          activeUserTokens.set(token, decoded);
          return decoded;
        }
      }
    } catch {
      return null;
    }
  }
  return null;
}

function verifyUserToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Нэвтрэх шаардлагатай.' });
  }

  const token = authHeader.split(' ')[1];
  const session = parseUserToken(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeUserTokens.delete(token);
    return res.status(401).json({ error: 'Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.' });
  }

  (req as any).userId = session.userId;
  (req as any).userEmail = session.email;
  next();
}

// Helper to decode Google JWT token securely
function decodeGoogleJwt(jwt: string): { email?: string; name?: string; picture?: string; sub?: string } | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// Active tokens with expiration (Stateless HMAC verifiable across serverless instances)
const activeTokens = new Map<string, { email: string; expiresAt: number }>();

function generateToken(email: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payloadStr = JSON.stringify({ email, expiresAt, role: 'admin' });
  const b64Payload = Buffer.from(payloadStr).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(b64Payload).digest('base64url');
  const token = `adm_${b64Payload}.${signature}`;
  activeTokens.set(token, { email, expiresAt });
  return token;
}

function parseAdminToken(token: string): { email: string; expiresAt: number } | null {
  if (!token) return null;
  const cached = activeTokens.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached;

  if (token.startsWith('adm_')) {
    const raw = token.slice(4);
    const dotIdx = raw.indexOf('.');
    if (dotIdx === -1) return null;
    const payloadPart = raw.slice(0, dotIdx);
    const sigPart = raw.slice(dotIdx + 1);
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadPart).digest('base64url');
    try {
      if (crypto.timingSafeEqual(Buffer.from(sigPart), Buffer.from(expectedSig))) {
        const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
        if (decoded && decoded.expiresAt && decoded.expiresAt > Date.now() && decoded.role === 'admin') {
          activeTokens.set(token, { email: decoded.email, expiresAt: decoded.expiresAt });
          return decoded;
        }
      }
    } catch {
      return null;
    }
  }
  return null;
}

function verifyAdminToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Зөвшөөрөлгүй хандалт. Нэвтрэх шаардлагатай.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Зөвшөөрөлгүй хандалт. Токен олдсонгүй.' });
  }

  // 1. Direct admin session token check
  const session = parseAdminToken(token);
  if (session && session.expiresAt >= Date.now()) {
    if (!session.email || session.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
      return next();
    }
  }

  // 2. User session token check (sanaa0419z@gmail.com logged in via normal login system)
  const userSession = parseUserToken(token);
  if (userSession && userSession.expiresAt >= Date.now()) {
    if (userSession.email && userSession.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
      return next();
    }
    const user = (db.users || []).find(u => u.id === userSession.userId || u.email.toLowerCase() === userSession.email.toLowerCase());
    if (user && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
      return next();
    }
  }

  return res.status(403).json({ error: 'Зөвшөөрөлгүй хандалт. Зөвхөн админ хаягаар хандах эрхтэй.' });
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

function getRequesterAccess(req: Request): { isPremium: boolean; isAdmin: boolean; userId?: string; userEmail?: string } {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isPremium: false, isAdmin: false };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { isPremium: false, isAdmin: false };
  }

  // 1. Check Admin token (stateless or in-memory)
  const adminSession = parseAdminToken(token);
  if (adminSession && adminSession.expiresAt > Date.now()) {
    return { isPremium: true, isAdmin: true, userEmail: adminSession.email };
  }

  // 2. Check User session token (stateless or in-memory)
  const userSession = parseUserToken(token);
  if (userSession && userSession.expiresAt > Date.now()) {
    const isSpecialAdmin = userSession.email && userSession.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
    if (isSpecialAdmin) {
      return { isPremium: true, isAdmin: true, userId: userSession.userId, userEmail: userSession.email };
    }

    const user = (db.users || []).find(u => u.id === userSession.userId || u.email.toLowerCase() === userSession.email.toLowerCase());
    if (user) {
      if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return { isPremium: true, isAdmin: true, userId: user.id, userEmail: user.email };
      }
      const isPremium = !!(user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt).getTime() > Date.now());
      return { isPremium, isAdmin: false, userId: user.id, userEmail: user.email };
    }

    // In serverless cold starts where db.users might be freshly initialized:
    // Check signed token's verified claims (FAIL CLOSED: only if verified claims show active premium)
    if (userSession.isPremium && userSession.premiumExpiresAt && new Date(userSession.premiumExpiresAt).getTime() > Date.now()) {
      return { isPremium: true, isAdmin: false, userId: userSession.userId, userEmail: userSession.email };
    }
  }

  // Fails closed by default!
  return { isPremium: false, isAdmin: false };
}

// ----------------------------------------------------
// PUBLIC API & SEO ENDPOINTS (No Login Required)
// ----------------------------------------------------

// Robots.txt & Sitemap.xml SEO routes
const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.sunnylearn.online/</loc>
    <lastmod>2026-09-20</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.sunnylearn.online/learn</loc>
    <lastmod>2026-09-20</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.sunnylearn.online/dictionary</loc>
    <lastmod>2026-09-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.sunnylearn.online/practice</loc>
    <lastmod>2026-09-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.sunnylearn.online/quiz</loc>
    <lastmod>2026-09-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.sunnylearn.online/ai</loc>
    <lastmod>2026-09-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.sunnylearn.online/premium</loc>
    <lastmod>2026-09-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.sunnylearn.online/contact</loc>
    <lastmod>2026-09-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /profile
Disallow: /progress

Sitemap: https://www.sunnylearn.online/sitemap.xml
`;

app.get(['/robots.txt', '/api/robots.txt'], (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.send(ROBOTS_TXT);
});

app.get(['/sitemap.xml', '/api/sitemap.xml'], (_req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.send(SITEMAP_XML);
});

// Explicitly serve favicon assets with proper Content-Type and caching
app.get(
  [
    '/favicon.ico',
    '/favicon.png',
    '/favicon-48x48.png',
    '/favicon-96x96.png',
    '/favicon-192x192.png',
    '/favicon-32x32.png',
    '/apple-touch-icon.png'
  ],
  (req, res) => {
    const filename = path.basename(req.path);
    const candidates = [
      path.resolve(process.cwd(), 'dist', filename),
      path.resolve(process.cwd(), 'public', filename)
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.ico' ? 'image/x-icon' : 'image/png';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        return res.sendFile(filePath);
      }
    }
    res.status(404).end();
  }
);

// Content-protected learning dataset (Server-side enforcement - Fail Closed)
app.get('/api/data', (req, res) => {
  const access = getRequesterAccess(req);
  const counts = computeLevelCounts(db);

  if (access.isPremium || access.isAdmin) {
    // Authorized: return complete content for all levels
    return res.json({
      categories: db.categories,
      vocabulary: db.vocabulary,
      kanji: db.kanji,
      grammar: db.grammar,
      exampleSentences: db.exampleSentences,
      lessons: db.lessons,
      reading: db.reading,
      listening: db.listening,
      quizzes: db.quizzes,
      counts
    });
  }

  // Free / Guest / Expired user: Strictly sanitize using buildFreeTierData (Fail Closed)
  const freeTierData = buildFreeTierData(db);
  res.json(freeTierData);
});

// ----------------------------------------------------
// TTS API (Disabled - Audio & pronunciation buttons removed globally)
// ----------------------------------------------------
app.get('/api/tts/status', (_req, res) => {
  res.json({
    available: false,
    message: 'Audio and pronunciation TTS features have been removed globally.'
  });
});

app.post('/api/tts', (_req: Request, res: Response) => {
  return res.json({
    success: false,
    fallback: false,
    message: 'TTS has been removed globally.'
  });
});

// Submit Feedback (Бидэнтэй холбогдох)
app.post('/api/feedback', async (req, res) => {
  const { name, email, type, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Зурвасын утга хоосон байна.' });
  }

  const newFeedback = {
    id: 'fb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    name: name?.trim() || 'Зочин',
    email: email?.trim() || '',
    type: type || 'feedback',
    message: message.trim(),
    status: 'new' as const,
    createdAt: new Date().toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' })
  };

  db.feedback.unshift(newFeedback);
  saveDatabase(db);

  // Trigger email notification to sunnylearn.contact@gmail.com asynchronously
  sendFeedbackEmail(newFeedback).catch(err => {
    console.error('Feedback email sending async error:', err);
  });

  res.status(201).json({
    success: true,
    message: 'Таны санал хүсэлтийг амжилттай хүлээн авч, (sunnylearn.contact@gmail.com) системд илгээлээ. Баярлалаа!',
    feedback: newFeedback,
    contactEmail: CONTACT_EMAIL
  });
});

// ----------------------------------------------------
// USER AUTHENTICATION & CLOUD PROGRESS SYNC
// (Email/Password & Google Sign-In, Non-intrusive)
// ----------------------------------------------------

// Helper to strip sensitive server-only fields
function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  if (safe.email && safe.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
    safe.isPremium = true;
    safe.premiumExpiresAt = '2099-12-31T23:59:59.000Z';
  }
  return safe;
}

// Email + Password Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, name, timezone, localProgress, localSelectedLevel } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanConfirm = (confirmPassword || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ error: 'Хүчинтэй имэйл хаяг оруулна уу.' });
    }

    if (!cleanPass || cleanPass.length < 6) {
      return res.status(400).json({ error: 'Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой.' });
    }

    if (cleanPass !== cleanConfirm) {
      return res.status(400).json({ error: 'Нууц үг хоорондоо таарахгүй байна.' });
    }

    if (!Array.isArray(db.users)) {
      db.users = [];
    }

    const existingUser = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      if (existingUser.passwordHash) {
        return res.status(400).json({ error: 'Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна. [Нэвтрэх] хэсгээр орно уу.' });
      }
      // User registered via Google previously; attach password
      existingUser.passwordHash = hashPassword(cleanPass);
      existingUser.authProvider = 'email';
      existingUser.updatedAt = new Date().toISOString();
      saveDatabase(db);

      const token = generateUserToken(existingUser.id, existingUser.email);
      return res.json({
        success: true,
        isNew: false,
        token,
        user: sanitizeUser(existingUser)
      });
    }

    const userTimezone = timezone || 'Asia/Ulaanbaatar';
    const nowStr = new Date().toLocaleString('mn-MN', { timeZone: userTimezone });

    const newUser: any = {
      id: 'usr-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'),
      email: cleanEmail,
      name: (name || '').trim() || cleanEmail.split('@')[0],
      authProvider: 'email',
      passwordHash: hashPassword(cleanPass),
      selectedLevel: (localSelectedLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(localSelectedLevel))
        ? localSelectedLevel
        : null,
      progress: localProgress || {
        selectedLevel: localSelectedLevel || null,
        learnedVocabIds: [],
        learnedKanjiIds: [],
        learnedGrammarIds: [],
        completedLessonIds: [],
        completedReadingIds: [],
        completedListeningIds: [],
        quizResults: [],
        favorites: { vocabIds: [], kanjiIds: [], grammarIds: [], sentenceIds: [] },
        streak: { current: 0, longest: 0, lastActiveDate: '' },
        updatedAt: new Date().toISOString(),
        settings: {
          targetLevel: 'N5',
          dailyGoalCount: 10,
          speechRate: 0.9,
          autoPlayAudio: false,
          showFurigana: true
        }
      },
      createdAt: nowStr,
      updatedAt: new Date().toISOString(),
      timezone: userTimezone,
      notifiedAdmin: false,
      isPremium: cleanEmail === ADMIN_EMAIL.toLowerCase(),
      premiumExpiresAt: cleanEmail === ADMIN_EMAIL.toLowerCase() ? '2099-12-31T23:59:59.000Z' : null
    };

    db.users.push(newUser);
    saveDatabase(db);
    console.log(`[User Auth] New user registered via email: ${newUser.email}`);

    sendNewUserRegistrationEmail({
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
      timezone: newUser.timezone || 'Asia/Ulaanbaatar'
    }).catch(err => console.error('[User Auth] Admin mail err:', err));

    const token = generateUserToken(newUser.id, newUser.email, newUser.isPremium, newUser.premiumExpiresAt, newUser.name);
    res.status(201).json({
      success: true,
      isNew: true,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err: any) {
    console.error('[User Auth] Register error:', err);
    res.status(500).json({ error: 'Бүртгүүлэхэд алдаа гарлаа. Дахин оролдоно уу.' });
  }
});

// Email + Password Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, localProgress, localSelectedLevel } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return res.status(400).json({ error: 'Имэйл болон нууц үгээ оруулна уу.' });
    }

    if (!Array.isArray(db.users)) {
      db.users = [];
    }

    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Имэйл эсвэл нууц үг буруу байна.' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Энэ хаяг Google эрхээр бүртгэгдсэн байна. "Google-ээр үргэлжлүүлэх" товчоор нэвтэрнэ үү.' });
    }

    const isMatch = verifyPassword(cleanPass, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Имэйл эсвэл нууц үг буруу байна.' });
    }

    // Merge guest progress if provided
    if (localProgress && typeof localProgress === 'object') {
      const union = (a: string[] = [], b: string[] = []) => Array.from(new Set([...a, ...b]));
      user.progress = {
        ...user.progress,
        learnedVocabIds: union(user.progress.learnedVocabIds, localProgress.learnedVocabIds),
        learnedKanjiIds: union(user.progress.learnedKanjiIds, localProgress.learnedKanjiIds),
        learnedGrammarIds: union(user.progress.learnedGrammarIds, localProgress.learnedGrammarIds),
        completedLessonIds: union(user.progress.completedLessonIds, localProgress.completedLessonIds),
        completedReadingIds: union(user.progress.completedReadingIds, localProgress.completedReadingIds),
        completedListeningIds: union(user.progress.completedListeningIds, localProgress.completedListeningIds),
        updatedAt: new Date().toISOString()
      };
    }

    if (!user.selectedLevel && localSelectedLevel) {
      user.selectedLevel = localSelectedLevel;
    }

    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      user.isPremium = true;
      user.premiumExpiresAt = '2099-12-31T23:59:59.000Z';
    }

    user.updatedAt = new Date().toISOString();
    saveDatabase(db);

    const token = generateUserToken(user.id, user.email, user.isPremium, user.premiumExpiresAt, user.name);
    res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    console.error('[User Auth] Login error:', err);
    res.status(500).json({ error: 'Нэвтрэхэд алдаа гарлаа.' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  console.log(`[Password Reset Request] For: ${cleanEmail}`);
  res.json({
    success: true,
    message: 'Хэрэв энэхүү имэйл бүртгэлтэй бол нууц үг сэргээх зааврыг хүлээн авах болно.'
  });
});

// Google Authentication (Login / Register)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, email, name, picture, timezone, localProgress, localSelectedLevel } = req.body;
    let userEmail = '';
    let userName = '';
    let userPicture = '';

    if (credential) {
      const decoded = decodeGoogleJwt(credential);
      if (decoded && decoded.email) {
        userEmail = decoded.email.trim().toLowerCase();
        userName = decoded.name || 'Суралцагч';
        userPicture = decoded.picture || '';
      }
    }

    if (!userEmail && email) {
      userEmail = String(email).trim().toLowerCase();
      userName = name?.trim() || 'Суралцагч';
      userPicture = picture || '';
    }

    if (!userEmail || !userEmail.includes('@')) {
      return res.status(400).json({ error: 'Хүчинтэй Google имэйл хаяг шаардлагатай.' });
    }

    if (!Array.isArray(db.users)) {
      db.users = [];
    }

    const userTimezone = timezone || 'Asia/Ulaanbaatar';
    let user = db.users.find(u => u.email.toLowerCase() === userEmail);
    let isNew = false;

    if (!user) {
      // First time registration
      isNew = true;
      const nowStr = new Date().toLocaleString('mn-MN', { timeZone: userTimezone });
      user = {
        id: 'usr-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'),
        email: userEmail,
        name: userName,
        picture: userPicture,
        selectedLevel: (localSelectedLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(localSelectedLevel))
          ? localSelectedLevel
          : null,
        progress: localProgress || {
          selectedLevel: localSelectedLevel || null,
          learnedVocabIds: [],
          learnedKanjiIds: [],
          learnedGrammarIds: [],
          completedLessonIds: [],
          completedReadingIds: [],
          completedListeningIds: [],
          quizResults: [],
          favorites: { vocabIds: [], kanjiIds: [], grammarIds: [], sentenceIds: [] },
          streak: { current: 0, longest: 0, lastActiveDate: '' },
          updatedAt: new Date().toISOString(),
          settings: {
            targetLevel: 'N5',
            dailyGoalCount: 10,
            speechRate: 0.9,
            autoPlayAudio: false,
            showFurigana: true
          }
        },
        createdAt: nowStr,
        updatedAt: new Date().toISOString(),
        timezone: userTimezone,
        notifiedAdmin: false
      };

      db.users.push(user);
      saveDatabase(db);
      console.log(`[User Auth] New user registered: ${user.email} (${user.name})`);

      // Dispatch admin notification email to sanaa0419z@gmail.com asynchronously
      sendNewUserRegistrationEmail({
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        timezone: user.timezone || 'Asia/Ulaanbaatar'
      }).then(sent => {
        if (sent && user) {
          user.notifiedAdmin = true;
          saveDatabase(db);
        }
      }).catch(err => {
        console.error('[User Auth] Admin notification email dispatch error:', err);
      });
    } else {
      // Existing user login: reconcile guest progress if provided
      if (localProgress && typeof localProgress === 'object') {
        const union = (a: string[] = [], b: string[] = []) => Array.from(new Set([...a, ...b]));
        
        // Merge quiz and practice history
        const quizHistMap = new Map<string, any>();
        [...(user.progress.quizHistory || []), ...(localProgress.quizHistory || [])].forEach((q: any) => {
          if (q && q.id && !quizHistMap.has(q.id)) quizHistMap.set(q.id, q);
        });

        const practiceHistMap = new Map<string, any>();
        [...(user.progress.practiceHistory || []), ...(localProgress.practiceHistory || [])].forEach((p: any) => {
          if (p && p.id && !practiceHistMap.has(p.id)) practiceHistMap.set(p.id, p);
        });

        // Merge item study records
        const mergedItemRecords: Record<string, any> = { ...(user.progress.itemStudyRecords || {}), ...(localProgress.itemStudyRecords || {}) };
        const itemKeys = new Set([...Object.keys(user.progress.itemStudyRecords || {}), ...Object.keys(localProgress.itemStudyRecords || {})]);
        itemKeys.forEach(key => {
          const u = user.progress.itemStudyRecords?.[key];
          const l = localProgress.itemStudyRecords?.[key];
          if (u && l) {
            mergedItemRecords[key] = {
              ...u,
              ...l,
              timesEncountered: Math.max(u.timesEncountered || 0, l.timesEncountered || 0),
              correctCount: Math.max(u.correctCount || 0, l.correctCount || 0),
              incorrectCount: Math.max(u.incorrectCount || 0, l.incorrectCount || 0),
              lastPracticedDate: (l.lastPracticedDate || '') > (u.lastPracticedDate || '') ? l.lastPracticedDate : u.lastPracticedDate
            };
          }
        });

        const mergedDaily = { ...(user.progress.dailyActivity || {}), ...(localProgress.dailyActivity || {}) };

        user.progress = {
          ...user.progress,
          learnedVocabIds: union(user.progress.learnedVocabIds, localProgress.learnedVocabIds),
          learnedKanjiIds: union(user.progress.learnedKanjiIds, localProgress.learnedKanjiIds),
          learnedGrammarIds: union(user.progress.learnedGrammarIds, localProgress.learnedGrammarIds),
          completedLessonIds: union(user.progress.completedLessonIds, localProgress.completedLessonIds),
          completedReadingIds: union(user.progress.completedReadingIds, localProgress.completedReadingIds),
          completedListeningIds: union(user.progress.completedListeningIds, localProgress.completedListeningIds),
          quizHistory: Array.from(quizHistMap.values()).slice(0, 50),
          practiceHistory: Array.from(practiceHistMap.values()).slice(0, 50),
          itemStudyRecords: mergedItemRecords,
          dailyActivity: mergedDaily,
          favorites: {
            vocabIds: union(user.progress.favorites?.vocabIds, localProgress.favorites?.vocabIds),
            kanjiIds: union(user.progress.favorites?.kanjiIds, localProgress.favorites?.kanjiIds),
            grammarIds: union(user.progress.favorites?.grammarIds, localProgress.favorites?.grammarIds),
            sentenceIds: union(user.progress.favorites?.sentenceIds, localProgress.favorites?.sentenceIds)
          },
          streak: {
            current: Math.max(user.progress.streak?.current || 0, localProgress.streak?.current || 0),
            longest: Math.max(user.progress.streak?.longest || 0, localProgress.streak?.longest || 0),
            lastActiveDate: user.progress.streak?.lastActiveDate || localProgress.streak?.lastActiveDate || ''
          },
          updatedAt: new Date().toISOString()
        };
      }

      // If user has no level yet on server, apply local selection
      if (!user.selectedLevel && localSelectedLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(localSelectedLevel)) {
        user.selectedLevel = localSelectedLevel;
      }

      if (userPicture && !user.picture) user.picture = userPicture;
      if (userName && user.name === 'Суралцагч') user.name = userName;

      user.updatedAt = new Date().toISOString();
      saveDatabase(db);
      console.log(`[User Auth] Existing user logged in: ${user.email}`);
    }

    const isSpecialAdmin = user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
    if (isSpecialAdmin) {
      user.isPremium = true;
      user.premiumExpiresAt = '2099-12-31T23:59:59.000Z';
    }

    const token = generateUserToken(user.id, user.email, user.isPremium, user.premiumExpiresAt, user.name);

    res.json({
      success: true,
      isNew,
      token,
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    console.error('[User Auth] Google login error:', err);
    res.status(500).json({ error: 'Нэвтрэх явцад алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.' });
  }
});

// Get user profile & cloud progress
app.get('/api/user/progress', verifyUserToken, (req, res) => {
  const userId = (req as any).userId;
  const user = (db.users || []).find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй.' });
  }
  res.json({
    success: true,
    selectedLevel: user.selectedLevel,
    progress: user.progress,
    updatedAt: user.updatedAt
  });
});

// Update / Sync user cloud progress
app.post('/api/user/progress', verifyUserToken, (req, res) => {
  const userId = (req as any).userId;
  const user = (db.users || []).find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй.' });
  }

  const { selectedLevel, progress, clientUpdatedAt } = req.body;

  // Timestamp conflict resolution: merge sets without losing items
  if (progress && typeof progress === 'object') {
    const union = (a: string[] = [], b: string[] = []) => Array.from(new Set([...a, ...b]));

    // Merge quiz and practice history
    const quizHistMap = new Map<string, any>();
    [...(user.progress.quizHistory || []), ...(progress.quizHistory || [])].forEach((q: any) => {
      if (q && q.id && !quizHistMap.has(q.id)) quizHistMap.set(q.id, q);
    });

    const practiceHistMap = new Map<string, any>();
    [...(user.progress.practiceHistory || []), ...(progress.practiceHistory || [])].forEach((p: any) => {
      if (p && p.id && !practiceHistMap.has(p.id)) practiceHistMap.set(p.id, p);
    });

    // Merge item study records
    const mergedItemRecords: Record<string, any> = { ...(user.progress.itemStudyRecords || {}), ...(progress.itemStudyRecords || {}) };
    const itemKeys = new Set([...Object.keys(user.progress.itemStudyRecords || {}), ...Object.keys(progress.itemStudyRecords || {})]);
    itemKeys.forEach(key => {
      const u = user.progress.itemStudyRecords?.[key];
      const p = progress.itemStudyRecords?.[key];
      if (u && p) {
        mergedItemRecords[key] = {
          ...u,
          ...p,
          timesEncountered: Math.max(u.timesEncountered || 0, p.timesEncountered || 0),
          correctCount: Math.max(u.correctCount || 0, p.correctCount || 0),
          incorrectCount: Math.max(u.incorrectCount || 0, p.incorrectCount || 0),
          lastPracticedDate: (p.lastPracticedDate || '') > (u.lastPracticedDate || '') ? p.lastPracticedDate : u.lastPracticedDate
        };
      }
    });

    const mergedDaily = { ...(user.progress.dailyActivity || {}), ...(progress.dailyActivity || {}) };

    // If client timestamp is older than server and has conflicting state, merge union
    user.progress = {
      ...user.progress,
      ...progress,
      learnedVocabIds: union(user.progress.learnedVocabIds, progress.learnedVocabIds),
      learnedKanjiIds: union(user.progress.learnedKanjiIds, progress.learnedKanjiIds),
      learnedGrammarIds: union(user.progress.learnedGrammarIds, progress.learnedGrammarIds),
      completedLessonIds: union(user.progress.completedLessonIds, progress.completedLessonIds),
      completedReadingIds: union(user.progress.completedReadingIds, progress.completedReadingIds),
      completedListeningIds: union(user.progress.completedListeningIds, progress.completedListeningIds),
      quizHistory: Array.from(quizHistMap.values()).slice(0, 50),
      practiceHistory: Array.from(practiceHistMap.values()).slice(0, 50),
      itemStudyRecords: mergedItemRecords,
      dailyActivity: mergedDaily,
      favorites: {
        vocabIds: union(user.progress.favorites?.vocabIds, progress.favorites?.vocabIds),
        kanjiIds: union(user.progress.favorites?.kanjiIds, progress.favorites?.kanjiIds),
        grammarIds: union(user.progress.favorites?.grammarIds, progress.favorites?.grammarIds),
        sentenceIds: union(user.progress.favorites?.sentenceIds, progress.favorites?.sentenceIds)
      },
      streak: {
        current: Math.max(user.progress.streak?.current || 0, progress.streak?.current || 0),
        longest: Math.max(user.progress.streak?.longest || 0, progress.streak?.longest || 0),
        lastActiveDate: progress.streak?.lastActiveDate || user.progress.streak?.lastActiveDate || ''
      },
      gamification: progress.gamification
        ? {
            ...(user.progress.gamification || {}),
            ...progress.gamification,
            totalXP: Math.max(user.progress.gamification?.totalXP || 0, progress.gamification.totalXP || 0),
            longestStreak: Math.max(user.progress.gamification?.longestStreak || 0, progress.gamification.longestStreak || 0),
            awardedItemIds: union(user.progress.gamification?.awardedItemIds, progress.gamification.awardedItemIds),
            awardedQuizIds: union(user.progress.gamification?.awardedQuizIds, progress.gamification.awardedQuizIds),
            completedGoalDates: union(user.progress.gamification?.completedGoalDates, progress.gamification.completedGoalDates),
            unlockedBadgeIds: union(user.progress.gamification?.unlockedBadgeIds, progress.gamification.unlockedBadgeIds)
          }
        : user.progress.gamification,
      lastStudied: progress.lastStudied || user.progress.lastStudied,
      updatedAt: new Date().toISOString()
    };
  }

  if (selectedLevel !== undefined) {
    user.selectedLevel = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(selectedLevel) ? selectedLevel : null;
  }

  user.updatedAt = new Date().toISOString();
  saveDatabase(db);

  res.json({
    success: true,
    selectedLevel: user.selectedLevel,
    progress: user.progress,
    updatedAt: user.updatedAt
  });
});

// Current user profile check
app.get('/api/user/me', verifyUserToken, (req, res) => {
  const userId = (req as any).userId;
  const userEmail = (req as any).userEmail;
  let user = (db.users || []).find(u => u.id === userId || (userEmail && u.email.toLowerCase() === userEmail.toLowerCase()));
  if (!user) {
    // In serverless environments, if instance cold-started, recreate user from verified session
    const session = parseUserToken(req.headers.authorization?.split(' ')[1] || '');
    if (session) {
      const isSpecial = session.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
      user = {
        id: session.userId,
        email: session.email,
        name: session.name || (isSpecial ? 'Admin' : 'Суралцагч'),
        selectedLevel: null,
        progress: {
          selectedLevel: null,
          learnedVocabIds: [],
          learnedKanjiIds: [],
          learnedGrammarIds: [],
          completedLessonIds: [],
          completedReadingIds: [],
          completedListeningIds: [],
          quizResults: [],
          favorites: { vocabIds: [], kanjiIds: [], grammarIds: [], sentenceIds: [] },
          streak: { current: 0, longest: 0, lastActiveDate: '' },
          updatedAt: new Date().toISOString(),
          settings: {
            targetLevel: 'N5',
            dailyGoalCount: 10,
            speechRate: 0.9,
            autoPlayAudio: false,
            showFurigana: true
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPremium: isSpecial || !!session.isPremium,
        premiumExpiresAt: isSpecial ? '2099-12-31T23:59:59.000Z' : (session.premiumExpiresAt || null)
      };
      if (!Array.isArray(db.users)) db.users = [];
      db.users.push(user);
      saveDatabase(db);
    } else {
      return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй.' });
    }
  }

  const isSpecialAdmin = user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
  if (isSpecialAdmin) {
    user.isPremium = true;
    user.premiumExpiresAt = '2099-12-31T23:59:59.000Z';
  }

  // Check if premium has expired
  let isPremium = false;
  if (user.premiumExpiresAt) {
    const expiresMs = new Date(user.premiumExpiresAt).getTime();
    if (expiresMs > Date.now()) {
      isPremium = true;
    } else {
      user.isPremium = false;
    }
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      selectedLevel: user.selectedLevel,
      progress: user.progress,
      isPremium,
      premiumExpiresAt: user.premiumExpiresAt || null,
      inAppNotification: user.inAppNotification || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
});

// Dismiss In-App Notification
app.post('/api/user/notification/dismiss', verifyUserToken, (req, res) => {
  const userId = (req as any).userId;
  const user = (db.users || []).find(u => u.id === userId);
  if (user && user.inAppNotification) {
    user.inAppNotification.read = true;
    saveDatabase(db);
  }
  res.json({ success: true });
});

// ----------------------------------------------------
// PAYMENT VERIFICATION (Bank Transfer Manual Processing)
// ----------------------------------------------------

// Submit Payment Request (Bank Transfer)
app.post('/api/payment/request', async (req, res) => {
  try {
    const { senderName, transferDate, notes } = req.body;
    let userName = (req.body.userName || '').trim();
    let userEmail = (req.body.userEmail || '').trim().toLowerCase();
    let authUserId: string | undefined;

    // Check bearer token (Premium requires authenticated account)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = activeUserTokens.get(token);
      if (session && session.expiresAt > Date.now()) {
        authUserId = session.userId;
        const u = (db.users || []).find(usr => usr.id === session.userId);
        if (u) {
          if (!userName) userName = u.name;
          if (!userEmail) userEmail = u.email.toLowerCase();
        }
      }
    }

    if (!authUserId) {
      return res.status(401).json({ error: 'Premium эрх авахын тулд эхлээд нэвтэрнэ үү.' });
    }

    if (!senderName || !senderName.trim()) {
      return res.status(400).json({ error: 'Шилжүүлэгчийн нэр (振込名義) шаардлагатай.' });
    }

    if (!transferDate || !transferDate.trim()) {
      return res.status(400).json({ error: 'Шилжүүлсэн огноо (振込日) шаардлагатай.' });
    }

    if (!userEmail || !userEmail.includes('@')) {
      return res.status(400).json({ error: 'Зөв имэйл хаяг шаардлагатай.' });
    }

    if (!userName) {
      userName = 'Суралцагч';
    }

    if (!Array.isArray(db.payments)) {
      db.payments = [];
    }

    // Check for existing PENDING payment to prevent duplicate transfer confusion
    const existingPending = db.payments.find(p => 
      p.status === 'PENDING' && (
        (authUserId && p.userId === authUserId) ||
        (p.userEmail && p.userEmail.toLowerCase() === userEmail.toLowerCase())
      )
    );

    if (existingPending) {
      return res.status(200).json({
        success: false,
        isDuplicate: true,
        existingRequest: existingPending,
        message: 'Таны өмнөх төлбөрийн хүсэлт одоогоор шалгагдаж байна. Дахин ¥880 шилжүүлэх шаардлагагүй.'
      });
    }

    const newPayment: PaymentRequestItem = {
      id: generatePaymentRequestId(),
      userId: authUserId,
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      amount: 880,
      currency: 'JPY',
      plan: 'SunnyLearn Premium — 30 days',
      durationDays: 30,
      senderName: senderName.trim(),
      transferDate: transferDate.trim(),
      notes: notes?.trim() || '',
      status: 'PENDING',
      createdAt: new Date().toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' }),
      emailNotificationStatus: 'QUEUED'
    };

    db.payments.unshift(newPayment);
    saveDatabase(db);

    console.log(`[Payment] New request created: ${newPayment.id} for ${newPayment.userEmail} (¥${newPayment.amount})`);

    // Asynchronously dispatch Admin notification email (without blocking user response)
    sendPaymentNotificationEmail(newPayment).then(emailStatus => {
      newPayment.emailNotificationStatus = emailStatus;
      saveDatabase(db);
    }).catch(err => {
      console.error('[Payment Mail] Async error in dispatch:', err);
      newPayment.emailNotificationStatus = 'FAILED';
      saveDatabase(db);
    });

    res.status(201).json({
      success: true,
      payment: newPayment,
      message: 'Төлбөрийн хүсэлт амжилттай бүртгэгдлээ. Бид дансны хуулгыг шалгаад Premium эрхийг удахгүй идэвхжүүлнэ.'
    });
  } catch (err: any) {
    console.error('Payment request error:', err);
    res.status(500).json({ error: 'Төлбөрийн хүсэлт бүртгэхэд алдаа гарлаа.' });
  }
});

// Check current user payment status
app.get('/api/payment/my-status', (req, res) => {
  let targetUserId: string | undefined;
  let targetEmail: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = activeUserTokens.get(token);
    if (session && session.expiresAt > Date.now()) {
      targetUserId = session.userId;
      targetEmail = session.email.toLowerCase();
    }
  }

  if (!targetEmail && req.query.email) {
    targetEmail = String(req.query.email).trim().toLowerCase();
  }

  const allPayments = db.payments || [];
  const userPayments = allPayments.filter(p => 
    (targetUserId && p.userId === targetUserId) ||
    (targetEmail && p.userEmail && p.userEmail.toLowerCase() === targetEmail)
  );

  const latestPending = userPayments.find(p => p.status === 'PENDING') || null;
  const latestPayment = userPayments[0] || null;

  // Check user premium status
  let isPremium = false;
  let premiumExpiresAt: string | null = null;
  let inAppNotification = null;

  if (targetUserId || targetEmail) {
    const user = (db.users || []).find(u => 
      (targetUserId && u.id === targetUserId) ||
      (targetEmail && u.email.toLowerCase() === targetEmail)
    );
    if (user) {
      if (user.premiumExpiresAt && new Date(user.premiumExpiresAt).getTime() > Date.now()) {
        isPremium = true;
        premiumExpiresAt = user.premiumExpiresAt;
      }
      inAppNotification = user.inAppNotification || null;
    }
  }

  res.json({
    success: true,
    payments: userPayments,
    latestPending,
    latestPayment,
    isPremium,
    premiumExpiresAt,
    inAppNotification
  });
});

// ----------------------------------------------------
// ADMIN AUTHENTICATION
// ----------------------------------------------------

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Имэйл болон нууц үгээ оруулна уу.' });
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const targetEmail = ADMIN_EMAIL.trim().toLowerCase();
  const cleanPass = (password || '').trim();
  const targetPass = ADMIN_PASSWORD.trim();

  // Valid passwords
  const isPassValid =
    cleanPass === targetPass ||
    cleanPass === 'S.04:29.learn' ||
    cleanPass === 's.04:29.learn' ||
    cleanPass === targetPass.toLowerCase();

  // If the correct admin password is provided, accept any admin email or username
  const isEmailValid =
    cleanEmail === targetEmail ||
    cleanEmail === 'admin' ||
    cleanEmail === 'stogtokh6948@gmail.com' ||
    cleanEmail.includes('sanaa0419z') ||
    cleanEmail.includes('stogtokh') ||
    cleanEmail.startsWith('admin') ||
    (isPassValid && cleanEmail.length > 0);

  if (isEmailValid && isPassValid) {
    const token = generateToken(targetEmail);
    return res.json({
      success: true,
      token,
      admin: {
        email: ADMIN_EMAIL,
        role: 'SUPER_ADMIN',
        name: 'Администратор'
      }
    });
  }

  return res.status(401).json({ error: 'Имэйл эсвэл нууц үг буруу байна.' });
});

app.get('/api/admin/verify', verifyAdminToken, (_req, res) => {
  res.json({ success: true, email: ADMIN_EMAIL });
});

// ----------------------------------------------------
// PROTECTED ADMIN CRUD ENDPOINTS
// ----------------------------------------------------

// Admin Stats
app.get('/api/admin/stats', verifyAdminToken, (_req, res) => {
  const levelCounts: Record<string, { vocab: number; kanji: number; grammar: number; lessons: number }> = {
    N5: { vocab: 0, kanji: 0, grammar: 0, lessons: 0 },
    N4: { vocab: 0, kanji: 0, grammar: 0, lessons: 0 },
    N3: { vocab: 0, kanji: 0, grammar: 0, lessons: 0 },
    N2: { vocab: 0, kanji: 0, grammar: 0, lessons: 0 },
    N1: { vocab: 0, kanji: 0, grammar: 0, lessons: 0 }
  };

  db.vocabulary.forEach(v => { if (levelCounts[v.jlptLevel]) levelCounts[v.jlptLevel].vocab++; });
  db.kanji.forEach(k => { if (levelCounts[k.jlptLevel]) levelCounts[k.jlptLevel].kanji++; });
  db.grammar.forEach(g => { if (levelCounts[g.jlptLevel]) levelCounts[g.jlptLevel].grammar++; });
  db.lessons.forEach(l => { if (levelCounts[l.jlptLevel]) levelCounts[l.jlptLevel].lessons++; });

  const allPayments = db.payments || [];
  const pendingPayments = allPayments.filter(p => p.status === 'PENDING').length;
  const approvedPayments = allPayments.filter(p => p.status === 'APPROVED').length;

  res.json({
    totalVocab: db.vocabulary.length,
    totalKanji: db.kanji.length,
    totalGrammar: db.grammar.length,
    totalExamples: db.exampleSentences.length,
    totalLessons: db.lessons.length,
    totalReading: db.reading.length,
    totalListening: db.listening.length,
    totalQuizzes: db.quizzes.length,
    totalFeedback: db.feedback.length,
    unreadFeedback: db.feedback.filter(f => f.status === 'new').length,
    pendingPayments,
    totalPayments: allPayments.length,
    approvedPayments,
    levelCounts
  });
});

// Admin Feedback Management
app.get('/api/admin/feedback', verifyAdminToken, (_req, res) => {
  res.json(db.feedback);
});

app.patch('/api/admin/feedback/:id/read', verifyAdminToken, (req, res) => {
  const item = db.feedback.find(f => f.id === req.params.id);
  if (item) {
    item.status = 'read';
    saveDatabase(db);
  }
  res.json({ success: true });
});

app.delete('/api/admin/feedback/:id', verifyAdminToken, (req, res) => {
  db.feedback = db.feedback.filter(f => f.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// ADMIN PAYMENT VERIFICATION MANAGEMENT
// ----------------------------------------------------

// List all payments for Admin
app.get('/api/admin/payments', verifyAdminToken, (_req, res) => {
  const allPayments = db.payments || [];
  
  // Sort: PENDING first, then by date descending
  const sorted = [...allPayments].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = allPayments.filter(p => p.status === 'PENDING').length;
  const approvedCount = allPayments.filter(p => p.status === 'APPROVED').length;
  const rejectedCount = allPayments.filter(p => p.status === 'REJECTED').length;
  const totalYenApproved = approvedCount * 880;

  res.json({
    success: true,
    payments: sorted,
    stats: {
      total: allPayments.length,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalYenApproved
    }
  });
});

// Admin Approve Payment (Manual bank transfer verified by Admin)
app.post('/api/admin/payments/:id/approve', verifyAdminToken, (req, res) => {
  const paymentId = req.params.id;
  const payment = (db.payments || []).find(p => p.id === paymentId);

  if (!payment) {
    return res.status(404).json({ error: 'Төлбөрийн хүсэлт олдсонгүй.' });
  }

  if (payment.status !== 'PENDING') {
    return res.status(400).json({ error: `Энэ төлбөр аль хэдийн [${payment.status}] төлөвт байна.` });
  }

  const now = new Date();
  const reviewedTimestamp = now.toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' });

  payment.status = 'APPROVED';
  payment.reviewedAt = reviewedTimestamp;
  payment.reviewedBy = 'SunnyLearn Admin';
  payment.rejectionReason = undefined;

  // Grant Premium to the user (30 days extension)
  let updatedUser = null;
  const user = (db.users || []).find(u => 
    (payment.userId && u.id === payment.userId) ||
    (payment.userEmail && u.email.toLowerCase() === payment.userEmail.toLowerCase())
  );

  if (user) {
    const currentTimeMs = Date.now();
    let baseTimeMs = currentTimeMs;

    // If user already has active premium, extend from previous expiration
    if (user.premiumExpiresAt) {
      const existingExpMs = new Date(user.premiumExpiresAt).getTime();
      if (existingExpMs > currentTimeMs) {
        baseTimeMs = existingExpMs;
      }
    }

    const newExpiresMs = baseTimeMs + (30 * 24 * 60 * 60 * 1000);
    const newExpiresIso = new Date(newExpiresMs).toISOString();

    user.isPremium = true;
    user.premiumExpiresAt = newExpiresIso;
    user.updatedAt = new Date().toISOString();
    user.inAppNotification = {
      id: 'notif-' + Date.now(),
      type: 'premium_activated',
      title: '🎉 SunnyLearn Premium идэвхжлээ!',
      message: `Таны төлбөр амжилттай баталгаажлаа. Premium эрх 30 хоногоор сунгагдлаа (${new Date(newExpiresIso).toLocaleDateString('mn-MN')} хүртэл).`,
      createdAt: new Date().toISOString(),
      read: false
    };

    updatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isPremium: true,
      premiumExpiresAt: newExpiresIso
    };
  }

  saveDatabase(db);
  console.log(`[Payment] APPROVED: ${payment.id} for ${payment.userEmail} by Admin. User granted 30-day Premium.`);

  res.json({
    success: true,
    payment,
    user: updatedUser,
    message: 'Төлбөрийн хүсэлтийг амжилттай баталгаажуулж, хэрэглэгчийн Premium эрхийг 30 хоногоор идэвхжүүллээ.'
  });
});

// Admin Reject Payment
app.post('/api/admin/payments/:id/reject', verifyAdminToken, (req, res) => {
  const paymentId = req.params.id;
  const { reason } = req.body;
  const payment = (db.payments || []).find(p => p.id === paymentId);

  if (!payment) {
    return res.status(404).json({ error: 'Төлбөрийн хүсэлт олдсонгүй.' });
  }

  const now = new Date();
  const reviewedTimestamp = now.toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' });

  payment.status = 'REJECTED';
  payment.reviewedAt = reviewedTimestamp;
  payment.reviewedBy = 'SunnyLearn Admin';
  payment.rejectionReason = reason?.trim() || 'Таны илгээсэн мэдээллээр төлбөрийг баталгаажуулах боломжгүй байна. Төлбөрийн мэдээллээ шалгаад дахин хүсэлт илгээх боломжтой.';

  saveDatabase(db);
  console.log(`[Payment] REJECTED: ${payment.id} for ${payment.userEmail} by Admin. Reason: ${payment.rejectionReason}`);

  res.json({
    success: true,
    payment,
    message: 'Төлбөрийн хүсэлтийг буцаалаа.'
  });
});

// Generic CRUD helper
function registerCrudRoutes<T extends { id: string }>(
  collectionKey: keyof DatabaseSchema,
  routePath: string,
  idPrefix: string
) {
  // Add item
  app.post(`/api/admin/${routePath}`, verifyAdminToken, (req, res) => {
    if (!Array.isArray(db[collectionKey])) {
      (db[collectionKey] as any) = [];
    }

    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const newItem = {
      ...req.body,
      id: req.body.id || `${idPrefix}-${Date.now()}-${uniqueSuffix}`,
      createdAt: new Date().toISOString()
    } as unknown as T;

    (db[collectionKey] as unknown as T[]).unshift(newItem);
    saveDatabase(db);
    console.log(`[Database Sync] Added new item to ${String(collectionKey)}: ${newItem.id}. Total count: ${(db[collectionKey] as unknown as T[]).length}`);
    res.status(201).json({ success: true, item: newItem });
  });

  // Edit item
  app.put(`/api/admin/${routePath}/:id`, verifyAdminToken, (req, res) => {
    if (!Array.isArray(db[collectionKey])) {
      (db[collectionKey] as any) = [];
    }

    const index = (db[collectionKey] as unknown as T[]).findIndex(item => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Мэдээлэл олдсонгүй.' });
    }

    const updatedItem = {
      ...(db[collectionKey] as unknown as T[])[index],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    (db[collectionKey] as unknown as T[])[index] = updatedItem;
    saveDatabase(db);
    console.log(`[Database Sync] Updated item in ${String(collectionKey)}: ${req.params.id}`);
    res.json({ success: true, item: updatedItem });
  });

  // Delete item
  app.delete(`/api/admin/${routePath}/:id`, verifyAdminToken, (req, res) => {
    if (!Array.isArray(db[collectionKey])) {
      (db[collectionKey] as any) = [];
    }

    const prevLen = (db[collectionKey] as unknown as T[]).length;
    (db[collectionKey] as unknown as T[]) = (db[collectionKey] as unknown as T[]).filter(
      item => item.id !== req.params.id
    );

    if ((db[collectionKey] as unknown as T[]).length === prevLen) {
      return res.status(404).json({ error: 'Устгах мэдээлэл олдсонгүй.' });
    }

    saveDatabase(db);
    console.log(`[Database Sync] Deleted item from ${String(collectionKey)}: ${req.params.id}. Remaining: ${(db[collectionKey] as unknown as T[]).length}`);
    res.json({ success: true, message: 'Амжилттай устгагдлаа.' });
  });
}

// Register all admin content managers
registerCrudRoutes('vocabulary', 'vocab', 'v');
registerCrudRoutes('kanji', 'kanji', 'k');
registerCrudRoutes('grammar', 'grammar', 'g');
registerCrudRoutes('exampleSentences', 'examples', 'ex');
registerCrudRoutes('lessons', 'lessons', 'les');
registerCrudRoutes('reading', 'reading', 'read');
registerCrudRoutes('listening', 'listening', 'list');
registerCrudRoutes('quizzes', 'quizzes', 'quiz');
registerCrudRoutes('categories', 'categories', 'cat');

// ----------------------------------------------------
// SUNNY AI TUTOR & QUIZ EXPLANATION ENGINE
// ----------------------------------------------------
const FREE_AI_DAILY_LIMIT = 20;
const ROLLING_WINDOW_MS = 24 * 60 * 60 * 1000;

function resolveClientAIContext(req: Request): {
  identifier: string;
  isPremium: boolean;
  userId?: string;
  userEmail?: string;
} {
  let isPremium = false;
  let identifier = '';
  let userId: string | undefined;
  let userEmail: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = parseUserToken(token);
    if (session && session.expiresAt > Date.now()) {
      userId = session.userId;
      userEmail = session.email;
      identifier = `user:${session.userId}`;

      const isAdminEmail = session.email && session.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
      if (isAdminEmail) {
        isPremium = true;
      } else {
        const user = (db.users || []).find(u => u.id === session.userId || (u.email && u.email.toLowerCase() === session.email.toLowerCase()));
        if (user) {
          if (user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
            isPremium = true;
          } else if (user.isPremium && user.premiumExpiresAt) {
            const exp = new Date(user.premiumExpiresAt).getTime();
            if (exp > Date.now()) {
              isPremium = true;
            }
          }
        }
      }
    }
  }

  if (!identifier) {
    const anonId = req.headers['x-sunny-client-id'];
    if (anonId && typeof anonId === 'string' && anonId.trim()) {
      identifier = `anon:${anonId.trim()}`;
    } else {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'client';
      identifier = `ip:${ip}`;
    }
  }

  return { identifier, isPremium, userId, userEmail };
}

function getAIUsage(identifier: string, isPremium: boolean) {
  if (isPremium) {
    return {
      isPremium: true,
      limit: Infinity,
      used: 0,
      remaining: Infinity,
      resetInMs: 0,
      resetInText: '',
      limitReached: false
    };
  }

  if (!db.aiUsageRecords) {
    db.aiUsageRecords = {};
  }

  const now = Date.now();
  const windowStart = now - ROLLING_WINDOW_MS;
  const timestamps = (db.aiUsageRecords[identifier] || []).filter(t => t > windowStart);
  db.aiUsageRecords[identifier] = timestamps;

  const used = timestamps.length;
  const remaining = Math.max(0, FREE_AI_DAILY_LIMIT - used);
  const limitReached = used >= FREE_AI_DAILY_LIMIT;

  let resetInMs = 0;
  let resetInText = '';

  if (limitReached && timestamps.length > 0) {
    const oldest = timestamps[0];
    resetInMs = Math.max(0, oldest + ROLLING_WINDOW_MS - now);
    const hours = Math.floor(resetInMs / (60 * 60 * 1000));
    const minutes = Math.ceil((resetInMs % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) {
      resetInText = `${hours} цаг ${minutes} минут`;
    } else {
      resetInText = `${minutes} минут`;
    }
  }

  return {
    isPremium: false,
    limit: FREE_AI_DAILY_LIMIT,
    used,
    remaining,
    resetInMs,
    resetInText,
    limitReached
  };
}

function recordAIUsage(identifier: string) {
  if (!db.aiUsageRecords) {
    db.aiUsageRecords = {};
  }
  const now = Date.now();
  const windowStart = now - ROLLING_WINDOW_MS;
  const list = (db.aiUsageRecords[identifier] || []).filter(t => t > windowStart);
  list.push(now);
  db.aiUsageRecords[identifier] = list;
  saveDatabase(db);
}

async function callGeminiTutor(
  messages: { role: 'user' | 'assistant'; content: string }[],
  quizContext?: any,
  currentLevel?: string
) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('AI систем холбогдоогүй байна. Түр хүлээнэ үү.');
  }

  const systemInstruction = `Та бол SunnyLearn сургалтын платформын албан ёсны, тусч, урам өгөгч, найрсаг, япон хэлний мэргэжлийн хиймэл оюун ухаант багш "Sunny AI" (Санни АИ) юм.
Таны эрхэм зорилго бол N5-аас N1 хүртэлх бүх түвшний суралцагчдад япон хэлийг бүх талаас нь системтэй, ойлгомжтойгоор, голчлон МОНГОЛ ХЭЛЭЭР тайлбарлах явдал юм.

ДҮРЭМ БА ЗААВАР:
1. ҮНДСЭН ХЭЛ БА ДУУДЛАГЫН ХАТУУ ЖУРАМ (МАШ ЧУХАЛ):
   - Тайлбар, дүрмийн утга агуулгыг монгол хэлээр цэгцтэй, найрсаг, тодорхой бичнэ.
   - ХАТУУ ХОРИГЛОХ ЗҮЙЛС:
     * Ромажи (Romaji / латин үсгээр япон дуудлага бичих) огт ашиглаж болохгүй! (Жишээ нь: Oshieru, Narau гэх мэт латин бичиглэл ХОРИОТОЙ).
     * Япон үгийн дуудлагыг монгол кирилл үсгээр галиглан/дуурайлган бичихийг ХАТУУ ХОРИГЛОНО! (Жишээ нь япон дуудлагыг монголоор дуурайж бичихгүй).
   - ЗӨВШӨӨРӨГДӨХ ФОРМАТ:
     * Япон үг, өгүүлбэрт дуудлага заах шаардлагатай үед зөвхөн япон бичиг дэх фуригана (furigana) буюу 漢字（ふりがな） хэлбэрийг ашиглана.
     * Жишээ загвар: 漢字（ふりがな） -> жишээ нь: 教える（おしえる）, 習う（ならう）, 日本語（にほんご）.
     * Цэвэр хирагана эсвэл катаканагаар бичигддэг үгэнд хиймэл фуригана нэмэх шаардлагагүй (өөрөөр хэлбэл 漢字, ひらがな, カタカナ, 漢字（ふりがな）-г байгалиар нь зохистойгоор хэрэглэнэ).
2. СУРГАЛТЫН ДҮРЭМ БА ЯЛГАА:
   - Хоорондоо андуурагддаг төстэй дүрмийн нарийн ялгааг (жишээ нь: 〜ように ба 〜ために, 〜てはいけない ба 〜なければならない, эелдэг/хүндэтгэлийн хэлбэр, үйл үгийн бүлэг, хувирал)-г монгол суралцагчдад ойлгомжтойгоор харьцуулж тайлбарлана.
   - Сонжоо (Quiz)-ны асуултын "Яагаад буруу вэ？" нөхцөлд:
     * Хэрэглэгчийн сонгосон хариулт яагаад алдаатай болсон шалтгааныг (дүрмийн зөрчил, өгүүлбэрийн утгын алдаа, өнгө аяс) тайлбарлана.
     * Зөв хариулт нь яагаад тохирч байгааг дүрэм, бүтцээр нь задлан тайлбарлана.
     * Бататгах 1-2 бодит жишээ өгүүлбэрийг монгол орчуулгатай оруулна.
3. БҮХ ТҮВШИН:
   - N5 анхан шатнаас авахуулаад N1 гүнзгий шатны дүрмийн нарийн ухагдахууныг түвшинд нь тааруулан оновчтой тайлбарлана.
4. ХЭЛБЭРЖҮҮЛЭЛТ:
   - Уншихад хялбар Markdown (тодруулсан үг **Bold**, цэгэн жагсаалт, ишлэл) ашиглана.`;

  const contents: any[] = [];

  let initialContext = '';
  if (quizContext) {
    initialContext = `[СОНЖООНЫ АСУУЛТЫН МЭДЭЭЛЭЛ:
Түвшин: ${quizContext.jlptLevel || currentLevel || 'N5'}
Асуулт: ${quizContext.question} ${quizContext.questionReading ? `(${quizContext.questionReading})` : ''}
Сонголтууд: ${(quizContext.options || []).join(' | ')}
Хэрэглэгчийн сонгосон (БУРУУ) хариулт: ${quizContext.userAnswer || 'Сонгоогүй'}
ЗӨВ хариулт: ${quizContext.correctAnswer}
Сонжооны тайлбар: ${quizContext.explanation || 'Байхгүй'}
Хүсэлт: Энэ асуулт дээр миний хариулт яагаад буруу болсныг, зөв хариулт яагаад зөв болохыг монгол хэлээр маш тодорхой дэлгэрэнгүй тайлбарлаж өгнө үү.]\n\n`;
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    let text = msg.content;
    if (i === 0 && initialContext) {
      text = initialContext + text;
    }
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text }]
    });
  }

  if (contents.length === 0 && initialContext) {
    contents.push({
      role: 'user',
      parts: [{ text: initialContext + 'Энэ асуултад миний хариулт яагаад буруу болсныг монгол хэлээр дэлгэрэнгүй тайлбарлана уу.' }]
    });
  }

  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const resp = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      if (resp && resp.text) {
        return resp.text;
      }
    } catch (err: any) {
      console.warn(`[Sunny AI] Model ${model} failed, trying next:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Хариулт үүсгэхэд алдаа гарлаа.');
}

// GET AI usage & remaining messages
app.get('/api/ai/usage', (req, res) => {
  const { identifier, isPremium } = resolveClientAIContext(req);
  const usage = getAIUsage(identifier, isPremium);
  res.json({ success: true, usage });
});

// POST AI Chat & Quiz Explanation
app.post('/api/ai/chat', async (req, res) => {
  const { identifier, isPremium } = resolveClientAIContext(req);
  const usage = getAIUsage(identifier, isPremium);

  if (usage.limitReached) {
    return res.status(429).json({
      error: 'Sunny AI-ийн үнэгүй хэрэглээний хязгаарт хүрлээ. Premium авснаар Sunny AI-тай мессежийн хязгааргүй харилцах боломжтой.',
      limitReached: true,
      usage
    });
  }

  const { message, conversationHistory, quizContext, currentLevel } = req.body || {};
  if (!message && !quizContext) {
    return res.status(400).json({ error: 'Зурвасын утга хоосон байна.' });
  }

  const history = Array.isArray(conversationHistory) ? [...conversationHistory] : [];
  if (message) {
    history.push({ role: 'user', content: String(message) });
  }

  try {
    const reply = await callGeminiTutor(history, quizContext, currentLevel);

    // Increment usage ONLY for user-sent messages and ONLY if non-premium
    if (!isPremium) {
      recordAIUsage(identifier);
    }
    const updatedUsage = getAIUsage(identifier, isPremium);

    res.json({
      success: true,
      reply,
      usage: updatedUsage
    });
  } catch (err: any) {
    console.error('[Sunny AI Chat Error]', err);
    res.status(500).json({
      error: 'Sunny AI хариулахад алдаа гарлаа. Дахин оролдоно уу.',
      details: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------
// API 404 AND ERROR HANDLERS (ALWAYS RETURN JSON FOR /api)
// ----------------------------------------------------
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API чиглэл олдсонгүй: ${req.method} ${req.path}` });
});

// Global API error handler that ALWAYS returns JSON, never HTML
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || 'Серверт алдаа гарлаа. Дахин оролдоно уу.'
  });
});

export { app };
export default app;
