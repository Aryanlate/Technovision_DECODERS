import type { Dictionary } from '../../types';

/**
 * Page-scoped dictionary module for the home page (`/`).
 * Merged over the shared dictionary, so keys here win where they overlap.
 */
const en: Dictionary = {
  home: {
    badge: 'SETU 2026 • PROBLEM STATEMENT PS-03',
    title: 'Know if you qualify, what you miss, and what to do next.',
    lede:
      'OpportunityKit turns messy internship listings, scholarships, and hackathons into transparent, rule-based eligibility checklists. Compare against your master student credentials with zero LLM decision hallucination.',
    runDemo: '⚡ Run the Sample Demo',
    loadingDemo: 'Loading Demo Engine...',
    ctaPaste: 'Paste An Opportunity →',
    ctaProfile: 'Build Master Profile',
    presentationReady: 'Presentation Ready:',
    offlineNote:
      'All benchmark agent citations & rule engines run 100% offline with no external network required.',
    demoModeEnabled: 'DEMO MODE ENABLED',

    howTag: 'EDITORIAL ARCHITECTURE',
    howTitle: 'HOW IT WORKS',
    howSubtitle: 'Five transparent steps from messy job post to verified application action plan.',
    stepLabel: 'Step {number}',
    step1Title: 'Create Profile Once',
    step1Body:
      'Add year, branch, CGPA, technical skills, ready documents, and verified links into your master record.',
    step1Note: '✓ Stored Locally & Securely',
    step2Title: 'Paste Any Listing',
    step2Body:
      'Drop raw paragraphs from internship portals, scholarship notices, or hackathon brochures.',
    step2Note: '✓ Auto-Detects Type',
    step3Title: 'Editable Checklist',
    step3Body:
      'Deterministic regex parser extracts criteria with verbatim sentence citations and parse warnings.',
    step3Note: '✓ Fix, Add, or Delete',
    step4Title: 'Rule-Based Audit',
    step4Body:
      'Pure TypeScript rules evaluate every item. “Unknown” is never marked as fails; missing answers are {missingInfo}.',
    step4Note: '✓ 100% Deterministic (No AI)',
    step5Title: 'Inline Fix & Plan',
    step5Body:
      'Fill missing fields right in the audit table to recalculate readiness instantly without reloading.',
    step5Note: '✓ Live Instant Recalculation',

    sampleTag: 'BENCHMARK AUDIT DEMO',
    sampleTitle: 'Sample Result Preview',
    launchResult: 'Launch Full Interactive Result →',
    candidateLine: 'CANDIDATE: ALEX SHARMA (2ND-YEAR CSE) • OPPORTUNITY: SUMMER INTERNSHIP',
    summaryLine: '3 {match} · 1 {mismatch} · 2 {missingInfo} → Not ready to apply yet',
    tooltipCount: '{count} {status} ({percent}%)',
    tableRequirement: 'Requirement',
    tableAsks: 'Opportunity Asks',
    tableCredentials: 'Profile Credentials',
    tableStatus: 'Status',
    tableRule: 'Deterministic Rule Used',
    rowYear: 'Year of Study',
    rowYearAsks: '2nd or 3rd-year student',
    rowYearValue: '2nd Year (CSE)',
    ruleYear: 'rangeRule: Year 2 matches allowed years [2, 3]',
    rowSkills: 'Technical Skills',
    rowSkillsAsks: 'HTML, CSS, JavaScript',
    rowSkillsValue: 'HTML, CSS, Python',
    ruleSkills: 'listRule: Missing required skill: JavaScript',
    rowPortfolio: 'Portfolio / GitHub',
    rowPortfolioAsks: 'Portfolio or GitHub link required',
    rowPortfolioValue: 'Not provided in profile',
    rulePortfolio: 'linkRule: Neither portfolio nor GitHub URL is present in profile',
    notice:
      'Notice: The missing info row can be fixed inline on the live results page with instant status recalculation.',
    testAudit: 'Test Interactive Live Audit →'
  }
};

const hi: Dictionary = {
  home: {
    badge: 'SETU 2026 • समस्या कथन PS-03',
    title: 'जानें कि आप पात्र हैं या नहीं, क्या छूट रहा है, और आगे क्या करना है।',
    lede:
      'OpportunityKit अस्त-व्यस्त इंटर्नशिप लिस्टिंग, छात्रवृत्तियों और हैकाथॉन को पारदर्शी, नियम-आधारित पात्रता चेकलिस्ट में बदल देता है। अपनी मास्टर छात्र योग्यताओं से तुलना करें, बिना किसी LLM निर्णय भ्रम के।',
    runDemo: '⚡ नमूना डेमो चलाएँ',
    loadingDemo: 'डेमो इंजन लोड हो रहा है...',
    ctaPaste: 'कोई अवसर पेस्ट करें →',
    ctaProfile: 'मास्टर प्रोफ़ाइल बनाएँ',
    presentationReady: 'प्रस्तुति के लिए तैयार:',
    offlineNote:
      'सभी बेंचमार्क एजेंट उद्धरण और नियम इंजन 100% ऑफ़लाइन चलते हैं, किसी बाहरी नेटवर्क की आवश्यकता नहीं।',
    demoModeEnabled: 'डेमो मोड सक्षम',

    howTag: 'संपादकीय संरचना',
    howTitle: 'यह कैसे काम करता है',
    howSubtitle: 'अस्त-व्यस्त जॉब पोस्ट से सत्यापित आवेदन कार्य योजना तक पाँच पारदर्शी चरण।',
    stepLabel: 'चरण {number}',
    step1Title: 'प्रोफ़ाइल एक बार बनाएँ',
    step1Body:
      'वर्ष, शाखा, CGPA, तकनीकी कौशल, तैयार दस्तावेज़ और सत्यापित लिंक अपने मास्टर रिकॉर्ड में जोड़ें।',
    step1Note: '✓ स्थानीय रूप से और सुरक्षित रूप से संग्रहीत',
    step2Title: 'कोई भी लिस्टिंग पेस्ट करें',
    step2Body:
      'इंटर्नशिप पोर्टल, छात्रवृत्ति सूचना या हैकाथॉन ब्रोशर से कच्चे पैराग्राफ डालें।',
    step2Note: '✓ प्रकार स्वतः पहचानता है',
    step3Title: 'संपादन योग्य चेकलिस्ट',
    step3Body:
      'नियतात्मक रेगेक्स पार्सर मानदंडों को शब्दशः वाक्य उद्धरण और पार्स चेतावनियों के साथ निकालता है।',
    step3Note: '✓ ठीक करें, जोड़ें या हटाएँ',
    step4Title: 'नियम-आधारित ऑडिट',
    step4Body:
      'शुद्ध TypeScript नियम हर मद का मूल्यांकन करते हैं। “अज्ञात” को कभी असफल नहीं माना जाता; अनुत्तरित उत्तर {missingInfo} होते हैं।',
    step4Note: '✓ 100% नियतात्मक (कोई AI नहीं)',
    step5Title: 'इनलाइन सुधार और योजना',
    step5Body:
      'तैयारी तुरंत पुनर्गणना करने के लिए ऑडिट तालिका में ही रिक्त फ़ील्ड भरें, बिना पुनः लोड किए।',
    step5Note: '✓ तत्काल लाइव पुनर्गणना',

    sampleTag: 'बेंचमार्क ऑडिट डेमो',
    sampleTitle: 'नमूना परिणाम पूर्वावलोकन',
    launchResult: 'पूरा इंटरैक्टिव परिणाम लॉन्च करें →',
    candidateLine: 'उम्मीदवार: ALEX SHARMA (द्वितीय वर्ष CSE) • अवसर: ग्रीष्मकालीन इंटर्नशिप',
    summaryLine: '3 {match} · 1 {mismatch} · 2 {missingInfo} → अभी आवेदन के लिए तैयार नहीं',
    tooltipCount: '{count} {status} ({percent}%)',
    tableRequirement: 'आवश्यकता',
    tableAsks: 'अवसर की माँग',
    tableCredentials: 'प्रोफ़ाइल प्रमाण-पत्र',
    tableStatus: 'स्थिति',
    tableRule: 'प्रयुक्त नियतात्मक नियम',
    rowYear: 'अध्ययन वर्ष',
    rowYearAsks: 'द्वितीय या तृतीय वर्ष का छात्र',
    rowYearValue: 'द्वितीय वर्ष (CSE)',
    ruleYear: 'rangeRule: वर्ष 2 अनुमत वर्षों [2, 3] से मेल खाता है',
    rowSkills: 'तकनीकी कौशल',
    rowSkillsAsks: 'HTML, CSS, JavaScript',
    rowSkillsValue: 'HTML, CSS, Python',
    ruleSkills: 'listRule: आवश्यक कौशल अनुपस्थित: JavaScript',
    rowPortfolio: 'पोर्टफ़ोलियो / GitHub',
    rowPortfolioAsks: 'पोर्टफ़ोलियो या GitHub लिंक आवश्यक',
    rowPortfolioValue: 'प्रोफ़ाइल में प्रदान नहीं किया गया',
    rulePortfolio: 'linkRule: प्रोफ़ाइल में न तो पोर्टफ़ोलियो और न ही GitHub URL मौजूद है',
    notice:
      'सूचना: जीवंत परिणाम पृष्ठ पर अनुपस्थित जानकारी वाली पंक्ति को इनलाइन ठीक किया जा सकता है, तत्काल स्थिति पुनर्गणना के साथ।',
    testAudit: 'इंटरैक्टिव लाइव ऑडिट का परीक्षण करें →'
  }
};

const mr: Dictionary = {
  home: {
    badge: 'SETU 2026 • समस्या विधान PS-03',
    title: 'तुम्ही पात्र आहात का, काय राहिले आहे, आणि पुढे काय करावे हे जाणून घ्या.',
    lede:
      'OpportunityKit गोंधळलेल्या इंटर्नशिप सूची, शिष्यवृत्ती आणि हॅकाथॉन यांना पारदर्शक, नियम-आधारित पात्रता चेकलिस्टमध्ये बदलतो. तुमच्या मास्टर विद्यार्थी पात्रतेशी तुलना करा, LLM निर्णयाच्या कोणत्याही भ्रमाशिवाय.',
    runDemo: '⚡ नमुना डेमो चालवा',
    loadingDemo: 'डेमो इंजिन लोड होत आहे...',
    ctaPaste: 'कोणतीही संधी पेस्ट करा →',
    ctaProfile: 'मास्टर प्रोफाइल तयार करा',
    presentationReady: 'सादरीकरणासाठी तयार:',
    offlineNote:
      'सर्व बेंचमार्क एजंट संदर्भ आणि नियम इंजिन 100% ऑफलाइन चालतात, बाह्य नेटवर्कची गरज नाही.',
    demoModeEnabled: 'डेमो मोड सुरू',

    howTag: 'संपादकीय रचना',
    howTitle: 'हे कसे कार्य करते',
    howSubtitle: 'गोंधळलेल्या जॉब पोस्टपासून सत्यापित अर्ज कृती योजनेपर्यंत पाच पारदर्शक पायऱ्या.',
    stepLabel: 'पायरी {number}',
    step1Title: 'प्रोफाइल एकदा तयार करा',
    step1Body:
      'वर्ष, शाखा, CGPA, तांत्रिक कौशल्ये, तयार कागदपत्रे आणि सत्यापित दुवे तुमच्या मास्टर रेकॉर्डमध्ये जोडा.',
    step1Note: '✓ स्थानिक आणि सुरक्षितपणे साठवले',
    step2Title: 'कोणतीही सूची पेस्ट करा',
    step2Body:
      'इंटर्नशिप पोर्टल, शिष्यवृत्ती सूचना किंवा हॅकाथॉन माहितीपत्रकातून कच्चे परिच्छेद टाका.',
    step2Note: '✓ प्रकार स्वयं ओळखतो',
    step3Title: 'संपादनयोग्य चेकलिस्ट',
    step3Body:
      'निर्धारक रेगेक्स पार्सर अटी शब्दशः वाक्य संदर्भ आणि पार्स इशाऱ्यांसह काढतो.',
    step3Note: '✓ दुरुस्त करा, जोडा किंवा हटवा',
    step4Title: 'नियम-आधारित ऑडिट',
    step4Body:
      'शुद्ध TypeScript नियम प्रत्येक बाबीचे मूल्यांकन करतात. “अज्ञात” कधीही अपयश मानले जात नाही; अनुत्तरित उत्तरे {missingInfo} असतात.',
    step4Note: '✓ 100% निर्धारक (AI नाही)',
    step5Title: 'इनलाइन दुरुस्ती आणि योजना',
    step5Body:
      'पुन्हा लोड न करता तयारी लगेच पुन्हा मोजण्यासाठी ऑडिट तक्त्यातच रिकामे फील्ड भरा.',
    step5Note: '✓ तात्काळ थेट पुनर्गणना',

    sampleTag: 'बेंचमार्क ऑडिट डेमो',
    sampleTitle: 'नमुना निकाल पूर्वावलोकन',
    launchResult: 'पूर्ण इंटरॅक्टिव्ह निकाल सुरू करा →',
    candidateLine: 'उमेदवार: ALEX SHARMA (द्वितीय वर्ष CSE) • संधी: उन्हाळी इंटर्नशिप',
    summaryLine: '3 {match} · 1 {mismatch} · 2 {missingInfo} → अजून अर्जासाठी तयार नाही',
    tooltipCount: '{count} {status} ({percent}%)',
    tableRequirement: 'आवश्यकता',
    tableAsks: 'संधी काय मागते',
    tableCredentials: 'प्रोफाइल पुरावे',
    tableStatus: 'स्थिती',
    tableRule: 'वापरलेला निर्धारक नियम',
    rowYear: 'अभ्यास वर्ष',
    rowYearAsks: 'द्वितीय किंवा तृतीय वर्षाचा विद्यार्थी',
    rowYearValue: 'द्वितीय वर्ष (CSE)',
    ruleYear: 'rangeRule: वर्ष 2 अनुमत वर्षांशी [2, 3] जुळते',
    rowSkills: 'तांत्रिक कौशल्ये',
    rowSkillsAsks: 'HTML, CSS, JavaScript',
    rowSkillsValue: 'HTML, CSS, Python',
    ruleSkills: 'listRule: आवश्यक कौशल्य गहाळ: JavaScript',
    rowPortfolio: 'पोर्टफोलिओ / GitHub',
    rowPortfolioAsks: 'पोर्टफोलिओ किंवा GitHub दुवा आवश्यक',
    rowPortfolioValue: 'प्रोफाइलमध्ये दिलेले नाही',
    rulePortfolio: 'linkRule: प्रोफाइलमध्ये पोर्टफोलिओ किंवा GitHub URL दोन्हीपैकी एकही नाही',
    notice:
      'सूचना: थेट निकाल पृष्ठावर गहाळ माहितीची ओळ इनलाइन दुरुस्त करता येते, तात्काळ स्थिती पुनर्गणनेसह.',
    testAudit: 'इंटरॅक्टिव्ह थेट ऑडिट तपासा →'
  }
};

const module_ = { en, hi, mr };
export default module_;
