import axios from 'axios';

// Google Sheets API configuration
const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const GOOGLE_SHEETS_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;
const GOOGLE_SHEETS_RANGE = import.meta.env.VITE_GOOGLE_SHEETS_RANGE || 'Sheet1!A:E';

// Cadet Google Sheets configuration
const CADET_GOOGLE_SHEETS_ID = import.meta.env.VITE_CADET_GOOGLE_SHEETS_ID;
const CADET_GOOGLE_SHEETS_RANGE = import.meta.env.VITE_CADET_GOOGLE_SHEETS_RANGE || 'Sheet1!A:E';



interface GoogleSheetsResponse {
  values: string[][];
}

// Interface matching your ANO spreadsheet structure
interface AnoContact {
  name: string;
  rank: string;
  email: string;
  whatsappNumber: string;
  college: string;
}

// Interface matching your Cadet spreadsheet structure
interface CadetContact {
  name: string;
  rank: string;
  email: string;
  whatsappNumber: string;
  college: string;
}

// Function to fetch data from Google Sheets
export const fetchAnoContactsFromGoogleSheets = async (): Promise<AnoContact[]> => {
  try {
    if (!GOOGLE_SHEETS_API_KEY) {
      console.error('Google Sheets API key not configured');
      return [];
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${GOOGLE_SHEETS_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
    
    const response = await axios.get<GoogleSheetsResponse>(url);
    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      console.log('No data found in Google Sheets or only header row exists');
      return [];
    }

    // Skip the header row (first row) and process data rows
    const contacts: AnoContact[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Ensure we have at least 5 columns (name, rank, email, whatsapp, college)
      if (row.length >= 5 && row[0] && row[1] && row[2] && row[3] && row[4]) {
        contacts.push({
          name: row[0].trim(),
          rank: row[1].trim(),
          email: row[2].trim().toLowerCase(),
          whatsappNumber: row[3].trim(),
          college: row[4].trim()
        });
      }
    }

    console.log(`Fetched ${contacts.length} ANO contacts from Google Sheets`);
    return contacts;
    
  } catch (error: any) {
    console.error('Error fetching data from Google Sheets:', error.response?.data || error.message);
    
    // If it's a permission error, provide helpful guidance
    if (error.response?.status === 403) {
      console.error('Google Sheets API access denied. Please check:');
      console.error('1. API key is valid and has Sheets API enabled');
      console.error('2. Spreadsheet is shared publicly or with the API key');
    }
    
    return [];
  }
};

// Function to get ANO contacts by college names
export const getAnoContactsByColleges = async (targetColleges: string[]): Promise<AnoContact[]> => {
  try {
    const allContacts = await fetchAnoContactsFromGoogleSheets();
    
    console.log('DEBUG - Target colleges from Firestore:', targetColleges);
    console.log('DEBUG - Available colleges in Google Sheets:', allContacts.map(c => c.college));
    
    // Filter contacts by the provided college list (case-insensitive matching)
    const matchedContacts = allContacts.filter(contact => 
      targetColleges.some(targetCollege => 
        targetCollege.toLowerCase().trim() === contact.college.toLowerCase().trim()
      )
    );
    
    console.log(`Found ${matchedContacts.length} matching ANO contacts for provided colleges`);
    
    if (matchedContacts.length === 0 && targetColleges.length > 0 && allContacts.length > 0) {
      console.warn('No college matches found! Please check if:');
      console.warn('1. College names in Google Sheets match college names in Firestore');
      console.warn('2. College name format is consistent (no extra spaces, same case)');
      console.warn('3. Colleges are properly configured in the system');
    }
    
    return matchedContacts;
    
  } catch (error) {
    console.error('Error filtering ANO contacts by colleges:', error);
    return [];
  }
};

// Function to validate Google Sheets configuration
export const validateGoogleSheetsConfig = (): { isValid: boolean; missingVars: string[] } => {
  const missingVars = [];
  
  if (!GOOGLE_SHEETS_API_KEY) missingVars.push('VITE_GOOGLE_SHEETS_API_KEY');
  if (!GOOGLE_SHEETS_ID) missingVars.push('VITE_GOOGLE_SHEETS_ID');
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
};

// Function to test the Google Sheets connection
export const testGoogleSheetsConnection = async (): Promise<{
  success: boolean;
  message: string;
  data?: AnoContact[];
}> => {
  try {
    const config = validateGoogleSheetsConfig();
    if (!config.isValid) {
      return {
        success: false,
        message: `Missing configuration: ${config.missingVars.join(', ')}`
      };
    }

    const contacts = await fetchAnoContactsFromGoogleSheets();
    
    return {
      success: true,
      message: `Successfully connected to Google Sheets. Found ${contacts.length} ANO contacts.`,
      data: contacts
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`
    };
  }
};

// Function to fetch cadet data from Google Sheets
export const fetchCadetContactsFromGoogleSheets = async (): Promise<CadetContact[]> => {
  try {
    if (!GOOGLE_SHEETS_API_KEY) {
      console.error('Google Sheets API key not configured');
      return [];
    }

    if (!CADET_GOOGLE_SHEETS_ID) {
      console.log('Cadet Google Sheets ID not configured, using ANO sheet');
      // Fallback to ANO sheet if cadet sheet not configured
      return await fetchAnoContactsFromGoogleSheets();
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CADET_GOOGLE_SHEETS_ID}/values/${CADET_GOOGLE_SHEETS_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
    
    const response = await axios.get<GoogleSheetsResponse>(url);
    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      console.log('No cadet data found in Google Sheets or only header row exists');
      return [];
    }

    // Skip the header row (first row) and process data rows
    const contacts: CadetContact[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Ensure we have at least 5 columns (name, rank, email, whatsapp, college)
      if (row.length >= 5 && row[0] && row[1] && row[2] && row[3] && row[4]) {
        contacts.push({
          name: row[0].trim(),
          rank: row[1].trim(),
          email: row[2].trim().toLowerCase(),
          whatsappNumber: row[3].trim(),
          college: row[4].trim()
        });
      }
    }

    console.log(`Fetched ${contacts.length} Cadet contacts from Google Sheets`);
    return contacts;
    
  } catch (error: any) {
    console.error('Error fetching cadet data from Google Sheets:', error.response?.data || error.message);
    return [];
  }
};

// Function to get Cadet contacts by their college names
export const getCadetContactsByColleges = async (targetColleges: string[]): Promise<CadetContact[]> => {
  try {
    const allContacts = await fetchCadetContactsFromGoogleSheets();
    
    console.log('DEBUG - Target colleges for cadets:', targetColleges);
    console.log('DEBUG - Available cadet colleges in Google Sheets:', allContacts.map(c => c.college));
    
    // Filter contacts by the provided college list (case-insensitive matching)
    const matchedContacts = allContacts.filter(contact => 
      targetColleges.some(targetCollege => 
        targetCollege.toLowerCase().trim() === contact.college.toLowerCase().trim()
      )
    );
    
    console.log(`Found ${matchedContacts.length} matching Cadet contacts for provided colleges`);
    
    if (matchedContacts.length === 0 && targetColleges.length > 0 && allContacts.length > 0) {
      console.warn('No cadet college matches found! Please check if:');
      console.warn('1. College names in Cadet Google Sheets match college names in Firestore');
      console.warn('2. College name format is consistent (no extra spaces, same case)');
      console.warn('3. Colleges are properly configured in the system');
    }
    
    return matchedContacts;
    
  } catch (error) {
    console.error('Error filtering Cadet contacts by colleges:', error);
    return [];
  }
};