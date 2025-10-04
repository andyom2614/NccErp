import axios from 'axios';

// Twilio configuration - you'll need to add these to your environment variables
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER;

// Interface for ANO data from spreadsheet
interface AnoData {
  name: string;
  rank: string;
  whatsappNumber: string;
  email: string;
  college: string;
}

import { getAnoContactsByColleges, getCadetContactsByColleges } from './googleSheetsService';

// Function to get ANO data from Google Sheets by college names
export const getAnoDataFromSpreadsheet = async (collegeNames: string[]): Promise<AnoData[]> => {
  try {
    if (collegeNames.length === 0) return [];

    // Fetch ANO contacts from Google Sheets by college names
    const sheetsContacts = await getAnoContactsByColleges(collegeNames);
    
    // Convert to the expected format
    const matchedAnos: AnoData[] = sheetsContacts.map((contact: any) => ({
      name: contact.name,
      rank: contact.rank,
      whatsappNumber: contact.whatsappNumber,
      email: contact.email,
      college: contact.college
    }));
    
    console.log(`Retrieved ${matchedAnos.length} ANO contacts from Google Sheets`);
    return matchedAnos;
    
  } catch (error) {
    console.error('Error fetching ANO data from Google Sheets:', error);
    return [];
  }
};

// Function to get Cadet data from Google Sheets by college names
export const getCadetDataFromSpreadsheet = async (collegeNames: string[]): Promise<AnoData[]> => {
  try {
    if (collegeNames.length === 0) return [];

    // Fetch Cadet contacts from Google Sheets by college names
    const sheetsContacts = await getCadetContactsByColleges(collegeNames);
    
    // Convert to the expected format
    const matchedCadets: AnoData[] = sheetsContacts.map((contact: any) => ({
      name: contact.name,
      rank: contact.rank,
      whatsappNumber: contact.whatsappNumber,
      email: contact.email,
      college: contact.college
    }));
    
    console.log(`Retrieved ${matchedCadets.length} Cadet contacts from Google Sheets`);
    return matchedCadets;
    
  } catch (error) {
    console.error('Error fetching Cadet data from Google Sheets:', error);
    return [];
  }
};

// Function to format WhatsApp message for ANOs
export const formatCampNotificationMessage = (
  anoData: AnoData,
  campDetails: {
    title: string;
    description?: string;
    reportingDate: string;
    reportingTime: string;
    venue: string;
    createdBy: string;
  }
): string => {
  const message = `
🪖 *NCC CAMP NOTIFICATION* 🪖

Dear ${anoData.rank} ${anoData.name},

You have received a new camp notification kindly login into your acoount and nominate the cadets :

📅 *Camp:* ${campDetails.title}
${campDetails.description ? `📝 *Description:* ${campDetails.description}` : ''}
📍 *Venue:* ${campDetails.venue}
🗓️ *Reporting Date:* ${new Date(campDetails.reportingDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
⏰ *Reporting Time:* ${campDetails.reportingTime}

👤 *Sent by:* ${campDetails.createdBy}

Please check your NCC ERP portal for complete details and vacancy information.

🔗 Portal: ${window.location.origin}

Best Regards,
NCC ERP System
  `.trim();
  
  return message;
};

// Function to send WhatsApp message using Twilio
export const sendWhatsAppMessage = async (
  toNumber: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Twilio configuration is missing. Please check your environment variables.');
    }

    // Format phone number for Twilio
    let formattedNumber = toNumber.replace(/[\s-]/g, ''); // Remove spaces and dashes
    
    // Add +91 country code if not present (for Indian numbers)
    if (!formattedNumber.startsWith('+')) {
      // If number starts with 91, add + 
      if (formattedNumber.startsWith('91')) {
        formattedNumber = '+' + formattedNumber;
      } 
      // If number doesn't start with 91, add +91
      else {
        formattedNumber = '+91' + formattedNumber;
      }
    }
    
    // Add debug logging
    console.log('🔍 TWILIO DEBUG:');
    console.log('Original number:', toNumber);
    console.log('Formatted number:', formattedNumber);
    console.log('From:', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`);
    console.log('To:', `whatsapp:${formattedNumber}`);
    console.log('Using Sandbox:', TWILIO_WHATSAPP_NUMBER === '+14155238886');
    console.log('Message preview:', message.substring(0, 100) + '...');
    
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      new URLSearchParams({
        From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        To: `whatsapp:${formattedNumber}`,
        Body: message
      }),
      {
        auth: {
          username: TWILIO_ACCOUNT_SID,
          password: TWILIO_AUTH_TOKEN
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ Twilio Response:', {
      sid: response.data.sid,
      status: response.data.status,
      errorCode: response.data.error_code,
      errorMessage: response.data.error_message
    });

    return {
      success: true,
      messageId: response.data.sid
    };
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp message:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to send WhatsApp message'
    };
  }
};

// Function to format WhatsApp message for Cadets
export const formatCadetCampNotificationMessage = (
  cadetData: AnoData,
  campDetails: {
    title: string;
    reportingDate: string;
    reportingTime: string;
  }
): string => {
  const message = `
🪖 *NCC CAMP NOTIFICATION* 🪖

Dear ${cadetData.rank} ${cadetData.name},

Your college has been allotted vacancy of *${campDetails.title}*

The reporting time and date is:
📅 *Date:* ${new Date(campDetails.reportingDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
⏰ *Time:* ${campDetails.reportingTime}

Kindly contact your college ANO for further details.

Best Regards,
NCC ERP System
  `.trim();
  
  return message;
};

// Main function to send notifications to ANOs
export const sendCampNotificationToAnos = async (
  campDetails: {
    title: string;
    description?: string;
    reportingDate: string;
    reportingTime: string;
    venue: string;
    createdBy: string;
  },
  collegeNames: string[]
): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
  results: Array<{ email: string; success: boolean; error?: string; messageId?: string }>;
}> => {
  try {
    // Get ANO data from spreadsheet by college names
    const anoDataList = await getAnoDataFromSpreadsheet(collegeNames);
    
    if (anoDataList.length === 0) {
      return {
        success: false,
        sentCount: 0,
        failedCount: 0,
        results: []
      };
    }

    // Send messages to each ANO
    const results = await Promise.all(
      anoDataList.map(async (anoData) => {
        const message = formatCampNotificationMessage(anoData, campDetails);
        const result = await sendWhatsAppMessage(anoData.whatsappNumber, message);
        
        return {
          email: anoData.email,
          success: result.success,
          error: result.error,
          messageId: result.messageId
        };
      })
    );

    const sentCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      results
    };
  } catch (error) {
    console.error('Error in sendCampNotificationToAnos:', error);
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      results: []
    };
  }
};

// Function to send notifications to Cadets
export const sendCampNotificationToCadets = async (
  campDetails: {
    title: string;
    reportingDate: string;
    reportingTime: string;
  },
  collegeNames: string[]
): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
  results: Array<{ email: string; success: boolean; error?: string; messageId?: string }>;
}> => {
  try {
    // Get Cadet data from spreadsheet by college names
    const cadetDataList = await getCadetDataFromSpreadsheet(collegeNames);
    
    if (cadetDataList.length === 0) {
      return {
        success: false,
        sentCount: 0,
        failedCount: 0,
        results: []
      };
    }

    // Send messages to each Cadet
    const results = await Promise.all(
      cadetDataList.map(async (cadetData) => {
        const message = formatCadetCampNotificationMessage(cadetData, campDetails);
        const result = await sendWhatsAppMessage(cadetData.whatsappNumber, message);
        
        return {
          email: cadetData.email,
          success: result.success,
          error: result.error,
          messageId: result.messageId
        };
      })
    );

    const sentCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      results
    };
  } catch (error) {
    console.error('Error in sendCampNotificationToCadets:', error);
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      results: []
    };
  }
};

// Function to validate Twilio configuration
export const validateTwilioConfig = (): { isValid: boolean; missingVars: string[] } => {
  const missingVars = [];
  
  if (!TWILIO_ACCOUNT_SID) missingVars.push('VITE_TWILIO_ACCOUNT_SID');
  if (!TWILIO_AUTH_TOKEN) missingVars.push('VITE_TWILIO_AUTH_TOKEN'); 
  if (!TWILIO_WHATSAPP_NUMBER) missingVars.push('VITE_TWILIO_WHATSAPP_NUMBER');
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
};