// src/services/mpesa.service.ts

/**
 * M-Pesa Integration Service - FIXED VERSION
 * 
 * Handles M-Pesa STK Push (Lipa Na M-Pesa Online) payments
 * Uses Safaricom Daraja API
 * 
 * IMPORTANT SETUP NOTES:
 * 1. Register at https://developer.safaricom.co.ke
 * 2. Create an app to get Consumer Key and Secret
 * 3. Use SANDBOX for testing (real phone numbers work in sandbox)
 * 4. For production, get production credentials
 */

import axios, { AxiosError } from 'axios';
import { AppError } from '../middleware/error.middleware';

/**
 * M-Pesa Configuration
 * All credentials come from environment variables
 */
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  passkey: process.env.MPESA_PASSKEY || '',
  shortcode: process.env.MPESA_LIPA_NA_MPESA_SHORTCODE || '',
  callbackUrl: process.env.MPESA_CALLBACK_URL || '',
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
};

/**
 * Get Base URL based on environment
 */
const getBaseUrl = (): string => {
  return MPESA_CONFIG.environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
};

/**
 * Validate M-Pesa Configuration
 * Checks if all required environment variables are set
 */
const validateMpesaConfig = (): void => {
  const requiredFields = [
    'consumerKey',
    'consumerSecret',
    'passkey',
    'shortcode',
    'callbackUrl',
  ];

  const missingFields = requiredFields.filter(
    (field) => !MPESA_CONFIG[field as keyof typeof MPESA_CONFIG]
  );

  if (missingFields.length > 0) {
    throw new AppError(
      `M-Pesa configuration incomplete. Missing: ${missingFields.join(', ')}. Check your .env file.`,
      500
    );
  }

  // Validate callback URL format
  if (!MPESA_CONFIG.callbackUrl.startsWith('http')) {
    throw new AppError(
      'MPESA_CALLBACK_URL must be a valid URL starting with http or https',
      500
    );
  }

  console.log('✅ M-Pesa configuration validated');
};

/**
 * Get M-Pesa Access Token
 * 
 * Access tokens expire after 1 hour
 * For production, implement token caching to avoid unnecessary requests
 * 
 * @returns Access token string
 */
export const getAccessToken = async (): Promise<string> => {
  try {
    // Validate config before making request
    validateMpesaConfig();

    // Create Basic Auth header
    const auth = Buffer.from(
      `${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`
    ).toString('base64');

    const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

    console.log('🔐 Requesting M-Pesa access token...');

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      timeout: 30000, // 30 second timeout
    });

    if (!response.data || !response.data.access_token) {
      throw new Error('No access token in response');
    }

    console.log('✅ M-Pesa access token obtained');
    return response.data.access_token;

  } catch (error) {
    console.error('❌ M-Pesa Access Token Error:');
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Status:', axiosError.response?.status);
      console.error('Data:', axiosError.response?.data);
      console.error('Message:', axiosError.message);

      // Check for common errors
      if (axiosError.response?.status === 401) {
        throw new AppError(
          'M-Pesa authentication failed. Check your Consumer Key and Secret in .env',
          500
        );
      }

      if (axiosError.code === 'ECONNREFUSED') {
        throw new AppError('Cannot connect to M-Pesa API. Check your internet connection.', 500);
      }

      if (axiosError.code === 'ETIMEDOUT') {
        throw new AppError('M-Pesa API request timeout. Please try again.', 500);
      }
    }

    throw new AppError('Failed to get M-Pesa access token. Check server logs.', 500);
  }
};

/**
 * Generate Timestamp in M-Pesa Format
 * Format: YYYYMMDDHHmmss
 * Example: 20241126143022
 * 
 * @returns Timestamp string
 */
const getTimestamp = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');

  return `${year}${month}${day}${hour}${minute}${second}`;
};

/**
 * Generate M-Pesa Password
 * Password = Base64(Shortcode + Passkey + Timestamp)
 * 
 * @param timestamp Current timestamp
 * @returns Base64 encoded password
 */
const generatePassword = (timestamp: string): string => {
  const data = `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`;
  return Buffer.from(data).toString('base64');
};

/**
 * Format Phone Number for M-Pesa
 * Converts various formats to M-Pesa format (254...)
 * 
 * Examples:
 * - 0712345678 → 254712345678
 * - 712345678 → 254712345678
 * - 254712345678 → 254712345678
 * - +254712345678 → 254712345678
 * 
 * @param phone Phone number
 * @returns Formatted phone number
 */
const formatPhoneNumber = (phone: string): string => {
  // Remove spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Remove leading +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Remove leading 0 and add 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }

  // Add 254 if not present
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  return cleaned;
};

/**
 * Validate Phone Number
 * Ensures phone number is valid Kenyan format
 * 
 * @param phone Phone number
 */
const validatePhoneNumber = (phone: string): void => {
  const formatted = formatPhoneNumber(phone);

  // Should be 12 digits (254 + 9 digits)
  if (formatted.length !== 12) {
    throw new AppError(
      `Invalid phone number format: ${phone}. Must be a valid Kenyan number.`,
      400
    );
  }

  // Should start with 254
  if (!formatted.startsWith('254')) {
    throw new AppError(
      `Phone number must be a Kenyan number starting with 254 or 0.`,
      400
    );
  }
};

/**
 * Initiate M-Pesa STK Push
 * 
 * Sends payment request to customer's phone
 * Customer enters M-Pesa PIN to complete payment
 * 
 * FLOW:
 * 1. Get access token
 * 2. Format phone number
 * 3. Generate password and timestamp
 * 4. Send STK Push request
 * 5. Customer receives prompt on phone
 * 6. M-Pesa calls your callback URL with result
 * 
 * @param amount Amount in KES (minimum 1)
 * @param phone Customer phone number
 * @param orderId Your order reference
 * @returns STK Push response
 */
export const initiateMpesaStkPush = async (
  amount: number,
  phone: string,
  orderId: string
): Promise<any> => {
  try {
    console.log('📱 Initiating M-Pesa STK Push...');
    console.log('Amount:', amount);
    console.log('Phone:', phone);
    console.log('Order ID:', orderId);

    // Validate configuration
    validateMpesaConfig();

    // Validate and format phone number
    validatePhoneNumber(phone);
    const formattedPhone = formatPhoneNumber(phone);
    console.log('Formatted Phone:', formattedPhone);

    // Validate amount
    if (amount < 1) {
      throw new AppError('Amount must be at least KES 1', 400);
    }

    // Round amount to integer (M-Pesa doesn't accept decimals)
    const roundedAmount = Math.ceil(amount);

    // Get access token
    const accessToken = await getAccessToken();

    // Generate security credentials
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    console.log('Timestamp:', timestamp);
    console.log('Shortcode:', MPESA_CONFIG.shortcode);

    // Construct STK Push payload
    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // For PayBill
      // Use 'CustomerBuyGoodsOnline' for Till Number
      Amount: roundedAmount,
      PartyA: formattedPhone, // Customer phone
      PartyB: MPESA_CONFIG.shortcode, // Your business shortcode
      PhoneNumber: formattedPhone, // Customer phone
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: orderId, // Your order reference
      TransactionDesc: `Payment for Order ${orderId}`,
    };

    console.log('STK Push Payload:', JSON.stringify(payload, null, 2));

    // Send STK Push request
    const url = `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`;

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout
    });

    console.log('M-Pesa Response:', JSON.stringify(response.data, null, 2));

    // Check response code
    if (response.data.ResponseCode === '0') {
      console.log('✅ STK Push sent successfully');
      return {
        success: true,
        CheckoutRequestID: response.data.CheckoutRequestID,
        MerchantRequestID: response.data.MerchantRequestID,
        ResponseCode: response.data.ResponseCode,
        ResponseDescription: response.data.ResponseDescription,
        CustomerMessage: response.data.CustomerMessage || 'Payment request sent. Check your phone.',
      };
    } else {
      console.error('❌ M-Pesa returned error code:', response.data.ResponseCode);
      throw new AppError(
        response.data.CustomerMessage || response.data.ResponseDescription || 'M-Pesa request failed',
        400
      );
    }

  } catch (error) {
    console.error('❌ M-Pesa STK Push Error:');
    
    // If it's already an AppError, rethrow it
    if (error instanceof AppError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Status:', axiosError.response?.status);
      console.error('Data:', JSON.stringify(axiosError.response?.data, null, 2));
      console.error('Message:', axiosError.message);

      // Handle specific M-Pesa errors
      const responseData: any = axiosError.response?.data;

      if (responseData?.errorMessage) {
        throw new AppError(`M-Pesa Error: ${responseData.errorMessage}`, 400);
      }

      if (axiosError.response?.status === 400) {
        throw new AppError(
          'Invalid M-Pesa request. Check phone number and amount.',
          400
        );
      }

      if (axiosError.response?.status === 401) {
        throw new AppError(
          'M-Pesa authentication failed. Check credentials in .env',
          500
        );
      }

      if (axiosError.code === 'ECONNREFUSED') {
        throw new AppError(
          'Cannot connect to M-Pesa API. Check internet connection.',
          500
        );
      }

      if (axiosError.code === 'ETIMEDOUT') {
        throw new AppError(
          'M-Pesa request timeout. Please try again.',
          500
        );
      }
    }

    // Generic error
    throw new AppError(
      'Failed to initiate M-Pesa payment. Please try again or contact support.',
      500
    );
  }
};

/**
 * Query STK Push Transaction Status
 * 
 * Checks the status of a previous STK Push request
 * Useful for polling or checking failed transactions
 * 
 * @param checkoutRequestID The CheckoutRequestID from STK Push response
 * @returns Transaction status
 */
export const queryStkPushStatus = async (
  checkoutRequestID: string
): Promise<any> => {
  try {
    validateMpesaConfig();

    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    const url = `${getBaseUrl()}/mpesa/stkpushquery/v1/query`;

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return response.data;

  } catch (error) {
    console.error('Error querying STK Push status:', error);
    throw new AppError('Failed to query payment status', 500);
  }
};