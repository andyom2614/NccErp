import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bug, 
  RefreshCw, 
  Users,
  Mail,
  Database,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { fetchAnoContactsFromGoogleSheets } from '../../services/googleSheetsService';

interface FirestoreAno {
  id: string;
  name: string;
  email: string;
  role: string;
  college?: string;
  unit: string;
}

interface CollegeAno {
  collegeId: string;
  collegeName: string;
  anoId: string;
  anoName: string;
  anoEmail: string;
}

export const DebugEmailMatching = () => {
  const [loading, setLoading] = useState(false);
  const [googleSheetsData, setGoogleSheetsData] = useState<any[]>([]);
  const [collegeAnos, setCollegeAnos] = useState<CollegeAno[]>([]);
  const [collegeMatches, setCollegeMatches] = useState<{
    matched: Array<{ googleCollege: string; firestoreCollege: string; anoName: string; anoEmail: string }>;
    unmatchedGoogle: any[];
    unmatchedColleges: Array<{ collegeName: string; anoCount: number }>;
  }>({ matched: [], unmatchedGoogle: [], unmatchedColleges: [] });

  const runDebugAnalysis = async () => {
    setLoading(true);
    
    try {
      // Fetch Google Sheets data
      console.log('Fetching Google Sheets data...');
      const sheetsData = await fetchAnoContactsFromGoogleSheets();
      setGoogleSheetsData(sheetsData);
      console.log('Google Sheets data:', sheetsData);

      // Fetch Firestore ANO users
      console.log('Fetching Firestore ANO users...');
      const anoQuery = query(collection(db, 'users'), where('role', '==', 'ano'));
      const anoSnapshot = await getDocs(anoQuery);
      const anoUsers: FirestoreAno[] = [];
      anoSnapshot.forEach((doc) => {
        anoUsers.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreAno);
      });
      console.log('Firestore ANO users:', anoUsers);

      // Fetch college-ANO assignments
      console.log('Fetching college-ANO assignments...');
      const collegesSnapshot = await getDocs(collection(db, 'colleges'));
      const collegeAnoAssignments: CollegeAno[] = [];
      
      collegesSnapshot.forEach((collegeDoc) => {
        const collegeData = collegeDoc.data();
        if (collegeData.anos && collegeData.anos.length > 0) {
          collegeData.anos.forEach((anoId: string) => {
            const anoUser = anoUsers.find(user => user.id === anoId);
            if (anoUser) {
              collegeAnoAssignments.push({
                collegeId: collegeDoc.id,
                collegeName: collegeData.name,
                anoId: anoId,
                anoName: anoUser.name,
                anoEmail: anoUser.email
              });
            }
          });
        }
      });
      setCollegeAnos(collegeAnoAssignments);
      console.log('College-ANO assignments:', collegeAnoAssignments);

      // Analyze college matches
      const matched: Array<{ googleCollege: string; firestoreCollege: string; anoName: string; anoEmail: string }> = [];
      const unmatchedGoogle: any[] = [...sheetsData];
      const collegeNames = Array.from(new Set(collegeAnoAssignments.map(c => c.collegeName)));
      const unmatchedColleges: Array<{ collegeName: string; anoCount: number }> = [];

      // Check which Google Sheets colleges have matching Firestore colleges
      sheetsData.forEach(googleContact => {
        const matchingCollegeAssignment = collegeAnoAssignments.find(assignment => 
          assignment.collegeName.toLowerCase().trim() === googleContact.college.toLowerCase().trim()
        );
        
        if (matchingCollegeAssignment) {
          matched.push({
            googleCollege: googleContact.college,
            firestoreCollege: matchingCollegeAssignment.collegeName,
            anoName: matchingCollegeAssignment.anoName,
            anoEmail: googleContact.email
          });
          
          // Remove from unmatched array
          const googleIndex = unmatchedGoogle.findIndex(g => 
            g.college.toLowerCase().trim() === googleContact.college.toLowerCase().trim()
          );
          if (googleIndex !== -1) unmatchedGoogle.splice(googleIndex, 1);
        }
      });

      // Find colleges in Firestore that don't have Google Sheets contacts
      collegeNames.forEach(collegeName => {
        const hasGoogleContact = sheetsData.some(contact => 
          contact.college.toLowerCase().trim() === collegeName.toLowerCase().trim()
        );
        
        if (!hasGoogleContact) {
          const anoCount = collegeAnoAssignments.filter(assignment => 
            assignment.collegeName === collegeName
          ).length;
          unmatchedColleges.push({ collegeName, anoCount });
        }
      });

      setCollegeMatches({ matched, unmatchedGoogle, unmatchedColleges });
      
    } catch (error) {
      console.error('Debug analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Debug College Matching</h1>
        <p className="text-gray-600 mt-1">Analyze Google Sheets and Firestore data to debug college matching for WhatsApp notifications</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bug className="text-red-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">College Matching Analysis</h3>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runDebugAnalysis}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
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
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </motion.button>
        </div>

        {googleSheetsData.length > 0 && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="text-blue-600" size={16} />
                  <span className="font-semibold text-blue-900">Google Sheets</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{googleSheetsData.length}</p>
                <p className="text-sm text-blue-600">ANO contacts</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="text-green-600" size={16} />
                  <span className="font-semibold text-green-900">Firestore</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{collegeAnos.length}</p>
                <p className="text-sm text-green-600">College assignments</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-purple-600" size={16} />
                  <span className="font-semibold text-purple-900">Unique Colleges</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">{Array.from(new Set(collegeAnos.map(c => c.collegeName))).length}</p>
                <p className="text-sm text-purple-600">In Firestore</p>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="text-orange-600" size={16} />
                  <span className="font-semibold text-orange-900">Matched</span>
                </div>
                <p className="text-2xl font-bold text-orange-700">{collegeMatches.matched.length}</p>
                <p className="text-sm text-orange-600">College matches</p>
              </div>
            </div>

            {/* College Matches */}
            {collegeMatches.matched.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3">✅ Matched Colleges ({collegeMatches.matched.length})</h4>
                <div className="space-y-2">
                  {collegeMatches.matched.map((match, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-green-300">
                      <div>
                        <span className="font-medium text-gray-900">{match.anoName}</span>
                        <br />
                        <span className="text-sm text-gray-600">College: {match.googleCollege}</span>
                      </div>
                      <span className="text-sm text-green-600">{match.anoEmail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched Google Sheets */}
            {collegeMatches.unmatchedGoogle.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-red-600" size={16} />
                  <h4 className="font-semibold text-red-900">❌ Google Sheets colleges not found in Firestore ({collegeMatches.unmatchedGoogle.length})</h4>
                </div>
                <p className="text-sm text-red-700 mb-3">These ANO contacts exist in Google Sheets but their colleges don't have ANO assignments in Firestore:</p>
                <div className="space-y-2">
                  {collegeMatches.unmatchedGoogle.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-red-300">
                      <div>
                        <span className="font-medium text-gray-900">{contact.name} ({contact.rank})</span>
                        <br />
                        <span className="text-sm text-red-600">College: {contact.college}</span>
                      </div>
                      <span className="text-sm text-red-600">{contact.email}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-red-700 mt-3 font-medium">
                  💡 Solution: Create colleges in Firestore with these names or update college names in Google Sheets to match existing colleges.
                </p>
              </div>
            )}

            {/* Unmatched Firestore Colleges */}
            {collegeMatches.unmatchedColleges.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-yellow-600" size={16} />
                  <h4 className="font-semibold text-yellow-900">⚠️ Firestore colleges not found in Google Sheets ({collegeMatches.unmatchedColleges.length})</h4>
                </div>
                <p className="text-sm text-yellow-700 mb-3">These colleges have ANO assignments in Firestore but don't have contact details in Google Sheets:</p>
                <div className="space-y-2">
                  {collegeMatches.unmatchedColleges.map((college, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-yellow-300">
                      <span className="font-medium text-gray-900">{college.collegeName}</span>
                      <span className="text-sm text-yellow-600">{college.anoCount} ANO{college.anoCount !== 1 ? 's' : ''} assigned</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-yellow-700 mt-3 font-medium">
                  💡 Solution: Add ANO contact details for these colleges to your Google Sheets.
                </p>
              </div>
            )}

            {/* College Assignments */}
            {collegeAnos.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">🏫 College-ANO Assignments ({collegeAnos.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {collegeAnos.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-blue-300">
                      <div>
                        <span className="font-medium text-gray-900">{assignment.collegeName}</span>
                        <br />
                        <span className="text-sm text-gray-600">{assignment.anoName}</span>
                      </div>
                      <span className="text-sm text-blue-600">{assignment.anoEmail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};