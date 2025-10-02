import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Users,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { testGoogleSheetsConnection, validateGoogleSheetsConfig } from '../../services/googleSheetsService';
import { validateTwilioConfig } from '../../services/whatsappService';

interface AnoContact {
  name: string;
  rank: string;
  email: string;
  whatsappNumber: string;
}

export const TestGoogleSheetsConnection = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: AnoContact[];
  } | null>(null);

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const result = await testGoogleSheetsConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed with an error'
      });
    } finally {
      setLoading(false);
    }
  };

  const googleConfig = validateGoogleSheetsConfig();
  const twilioConfig = validateTwilioConfig();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">API Configuration Test</h1>
        <p className="text-gray-600 mt-1">Test Google Sheets and WhatsApp integration</p>
      </motion.div>

      {/* Configuration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <ExternalLink className="text-blue-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">Google Sheets API</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {googleConfig.isValid ? (
                <CheckCircle className="text-green-600" size={16} />
              ) : (
                <AlertCircle className="text-red-600" size={16} />
              )}
              <span className={`text-sm ${googleConfig.isValid ? 'text-green-700' : 'text-red-700'}`}>
                {googleConfig.isValid ? 'Configuration Complete' : 'Missing Configuration'}
              </span>
            </div>
            
            {!googleConfig.isValid && (
              <div className="text-sm text-gray-600 ml-6">
                <p className="font-medium">Missing variables:</p>
                <ul className="list-disc list-inside mt-1">
                  {googleConfig.missingVars.map((varName) => (
                    <li key={varName} className="text-red-600">{varName}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <Phone className="text-green-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">Twilio WhatsApp</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {twilioConfig.isValid ? (
                <CheckCircle className="text-green-600" size={16} />
              ) : (
                <AlertCircle className="text-red-600" size={16} />
              )}
              <span className={`text-sm ${twilioConfig.isValid ? 'text-green-700' : 'text-red-700'}`}>
                {twilioConfig.isValid ? 'Configuration Complete' : 'Missing Configuration'}
              </span>
            </div>
            
            {!twilioConfig.isValid && (
              <div className="text-sm text-gray-600 ml-6">
                <p className="font-medium">Missing variables:</p>
                <ul className="list-disc list-inside mt-1">
                  {twilioConfig.missingVars.map((varName) => (
                    <li key={varName} className="text-red-600">{varName}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Test Connection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TestTube className="text-purple-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">Test Google Sheets Connection</h3>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTestConnection}
            disabled={loading || !googleConfig.isValid}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <RefreshCw size={20} />
            )}
            {loading ? 'Testing...' : 'Test Connection'}
          </motion.button>
        </div>

        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="font-medium">
                {testResult.success ? 'Connection Successful' : 'Connection Failed'}
              </span>
            </div>
            <p className="text-sm">{testResult.message}</p>
          </motion.div>
        )}

        {testResult?.success && testResult.data && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-blue-600" size={20} />
              <h4 className="text-lg font-semibold text-gray-900">
                ANO Contacts Found ({testResult.data.length})
              </h4>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {testResult.data.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h5 className="font-medium text-gray-900">{contact.name}</h5>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Shield size={12} />
                        {contact.rank}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail size={14} />
                        <span>{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        <span>{contact.whatsappNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Setup Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 rounded-xl p-6 border border-blue-200"
      >
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Setup Instructions</h4>
        
        <div className="space-y-3 text-sm text-blue-700">
          <div>
            <p className="font-medium">1. Get Google Sheets API Key:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Enable Google Sheets API for your project</li>
              <li>Create an API key and add it to your .env file as VITE_GOOGLE_SHEETS_API_KEY</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">2. Make your spreadsheet public:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Open your Google Sheets document</li>
              <li>Click "Share" → "Change to anyone with the link"</li>
              <li>Set permissions to "Viewer"</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">3. Verify spreadsheet format:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Column A: Name</li>
              <li>Column B: Rank</li>
              <li>Column C: Email</li>
              <li>Column D: WhatsApp Number</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};