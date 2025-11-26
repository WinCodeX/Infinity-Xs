// src/services/mpesa.service.ts

import axios from 'axios';
import dotenv from 'dotenv';
import { AppError } from '../middleware/error.middleware';

// Load environment variables for M-Pesa keys
dotenv.config();

// --- CONFIGURATION ---
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_LIPA_NA_MPESA_SHORTCODE;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

// Base URLs (using sandbox for development)
const BASE_URL = 'https://sandbox.safaricom.co.ke';
// Change to 'https://api.safaricom.co.ke' for production

/**
 * Generates the M-Pesa API access token.
 * This token is required for all subsequent Daraja API calls.
 * @returns {Promise<string>} The Daraja API access token.
 */
export async function getAccessToken(): Promise<string> {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error('M-Pesa API keys are missing in environment variables.');
  }

  try {
    const authString = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    const response = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    if (response.data && response.data.access_token) {
      return response.data.access_token;
    }
    throw new AppError('Failed to retrieve M-Pesa access token.', 500);

  } catch (error) {
    // Log the underlying API error for debugging
    console.error('M-Pesa Token Error:', axios.isAxiosError(error) ? error.response?.data : error);
    throw new AppError('M-Pesa authentication failed.', 500);
  }
}


/**
 * Generates the M-Pesa Security Timestamp (YYYYMMDDHHmmss).
 * @returns {string} The timestamp string.
 */
function getTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  return year + month + day + hour + minute + second;
}

/**
 * Initiates an M-Pesa STK Push transaction (Lipa Na M-Pesa Online).
 * @param {number} amount - The amount to be paid.
 * @param {string} phone - The customer's M-Pesa registered phone number (format: 2547...).
 * @param {string} orderId - Unique identifier for the transaction (used in callback).
 * @returns {Promise<any>} The response data from the Daraja API.
 */
export async function initiateMpesaStkPush(
  amount: number, 
  phone: string, 
  orderId: string
): Promise<any> {
  
  if (!PASSKEY || !SHORTCODE || !CALLBACK_URL) {
    throw new Error('M-Pesa STK Push configuration (PASSKEY, SHORTCODE, or CALLBACK_URL) is missing.');
  }

  // 1. Get Access Token
  const token = await getAccessToken();

  // 2. Generate required security parameters
  const timestamp = getTimestamp();
  const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString('base64');

  // Format phone number to 2547...
  const formattedPhone = phone.startsWith('0') ? `254${phone.substring(1)}` : phone;

  // 3. Construct the STK Push payload
  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline', // Or 'CustomerBuyGoodsOnline'
    Amount: Math.ceil(amount), // Amount must be an integer for Daraja API
    PartyA: formattedPhone, // Customer phone number
    PartyB: SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: CALLBACK_URL,
    AccountReference: orderId, // Used to link the payment back to your internal order
    TransactionDesc: `Payment for Order #${orderId}`,
  };

  // 4. Send the request
  try {
    const response = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check for specific M-Pesa errors (e.g., when the request is accepted but failed)
    if (response.data.ResponseCode && response.data.ResponseCode !== '0') {
      console.error('M-Pesa STK Error:', response.data.ResponseDescription);
      throw new AppError(response.data.CustomerMessage || 'M-Pesa request failed.', 400);
    }

    return response.data;

  } catch (error) {
    // Detailed logging for Axios errors
    if (axios.isAxiosError(error)) {
      console.error('STK Push API Error:', error.response?.data || error.message);
      throw new AppError('Failed to communicate with M-Pesa API.', 500);
    }
    throw error;
  }
}