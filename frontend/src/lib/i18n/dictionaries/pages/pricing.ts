import type { Dictionary } from '../../types';

/** Page-scoped dictionary module for the pricing page (`/pricing`). */
const en: Dictionary = {
  pricing: {
    tag: 'BUSINESS MODEL & PLANS',
    title: 'TRANSPARENT, STUDENT-FIRST PRICING',
    subtitle:
      'Start for free with zero lock-in. Upgrade to Student Premium for deep GitHub repository verification, web research, and unlimited audits. Campus licenses built for college placement cells.',

    usageHeading: 'Monthly Opportunity Checks Usage',
    currentPlan: 'CURRENT PLAN: {plan}',
    resetToFree: '(Reset to Free)',
    resetToFreeHint: 'Switch back to Free tier to test usage gates',
    usageUnlimited: 'Unlimited opportunity checks active',
    usageCount: '{used} of {limit} free checks used this month',
    remainingUnlimited: '∞ REMAINING',
    remainingChecks: '{remaining} CHECKS REMAINING',
    promptUnlimited:
      'You enjoy unlimited opportunity checks, deep GitHub analysis, and priority agent verification.',
    promptExceeded:
      'You have used all 5 free checks for this month. Upgrade to Premium for unlimited audits, or continue reviewing existing evaluations below.',
    promptRemaining:
      'You have 2 free checks remaining. Upgrade to Student Premium for unlimited checks and deep GitHub evidence verification.',
    upgradeUsage: 'Upgrade (Rs {price}/mo) →',

    billingCycleLabel: 'Billing Cycle:',
    monthlyOption: 'Monthly (Rs 79/mo)',
    semesterOption: 'Semester Pass (Rs 49/mo)',
    saveBadge: 'SAVE 38%',

    checkCurrentPlan: '✓ Current Active Plan',
    downgradeToFree: 'Downgrade to Free',

    free: {
      tagline: 'STUDENT STARTER',
      price: 'Rs 0',
      period: '/ forever free',
      name: 'Free Starter',
      description:
        'Essential eligibility checking for individual college students applying to internships.',
      feature1: '1 master student profile with projects & links',
      feature2: 'Up to 5 rule-based opportunity checks / month',
      feature3: 'Deterministic rule engine (runs locally in browser)',
      feature4: 'Invariant Guarantee: “Unknown” never fails',
      feature5: 'Live inline fix fields on audit report',
      feature6: 'Deep GitHub repo evidence analysis',
      feature7: 'Web research & employer scam check'
    },

    premium: {
      badge: 'MOST POPULAR FOR APPLICANTS',
      tagline: 'PRO STUDENT',
      active: 'ACTIVE',
      price: 'Rs {price}',
      periodMonthly: '/ month',
      periodSemester: '/ month (billed per semester)',
      name: 'Student Premium',
      description:
        'Supercharge your job search with unlimited audits, automated GitHub repo proof analysis, and web intelligence.',
      feature1: 'Unlimited opportunity checklist audits',
      feature2: 'Deep GitHub repository evidence extraction',
      feature3: 'Live web research & company scam screening',
      feature4: 'Related-opportunity discovery & cross-comparison',
      feature5: 'Longitudinal readiness tracking & scoreboard',
      feature6: 'Document checklist templates & ATS resume export',
      activeButton: '✓ Premium Active',
      upgradeButton: 'Upgrade to Premium →'
    },

    college: {
      tagline: 'FOR INSTITUTIONS & PLACEMENT CELLS',
      priceLabel: 'Institutional',
      period: '/ per year',
      name: 'College License',
      description:
        'Empower training and placement cells (T&P) with batch student analytics and company-drive shortlisting.',
      feature1: 'Placement-cell administrative dashboard (/college)',
      feature2: 'Bulk student profiles (120+ candidates per batch)',
      feature3: 'Custom company-drive eligibility checklists',
      feature4: 'Batch skill-gap reports & readiness bar charts',
      feature5: 'Direct Excel/CSV export & shortlisting notices',
      viewDashboard: 'View Placement Dashboard →',
      simulateActivate: 'Simulate Activating College License'
    },

    valueTag: 'VALUE PROPOSITION',
    valueTitle: 'WHY OPPORTUNITYKIT PAYS FOR ITSELF',
    valueSubtitle:
      'Measurable return on investment for both ambitious candidates and university placement coordinators.',
    value1Title: '1,000x ROI for Students',
    value1Body:
      'Missing out on a single Rs 50,000 scholarship or an Rs 35,000/mo engineering stipend because you overlooked an 8-week duration or an unverified GitHub portfolio costs 1,000x more than an Rs 49 monthly subscription.',
    value1Point: '✓ Prevent avoidable disqualification',
    value2Title: '40+ Hours Saved Per Drive',
    value2Body:
      'Placement officers manually inspect hundreds of student resumes and CGPA cuts for every visiting recruiter. OpportunityKit runs custom company checklists against 120 students in 18 milliseconds with zero clerical error.',
    value2Point: '✓ Automated candidate shortlisting',
    value3Title: 'Zero Decision Hallucination',
    value3Body:
      "Standard chatbots guess Yes or No with confidence and mislead students. OpportunityKit's pure TypeScript engine guarantees every finding cites the verbatim text quote and the exact mathematical rule used.",
    value3Point: '✓ Invariant: Unknown never fails',

    checkout: {
      title: 'OpportunityKit Checkout',
      orderId: 'ORDER ID:',
      collegeName: 'College Campus License',
      amount: 'Rs {price}',
      cycleMonthly: 'Monthly',
      cycleSemester: 'Semester Pass',
      premiumSummary: 'Unlimited checks, GitHub repo analysis, and web research ({cycle}).',
      collegeSummary:
        'Full placement cell dashboard with 120 student batch analysis and custom drive checklists.',
      selectPayment: 'Select Mock Payment Method:',
      upi: '⚡ UPI / QR',
      card: '💳 Debit / Credit',
      netbanking: '🏦 NetBanking',
      razorpayTitle: 'Razorpay Integration Ready',
      razorpayBody:
        'Structured with order signature validation (`razorpay_order_id`). Clicking Pay activates the plan in local state and logs analytics.',
      processing: 'Processing...',
      pay: 'Pay Rs {price} & Activate'
    },

    toast: {
      paymentSuccessTitle: 'PAYMENT SUCCESSFUL',
      upgraded: 'Upgraded to {plan}! Order ID: {orderId}',
      paymentFailedTitle: 'PAYMENT FAILED',
      paymentFailedBody: 'Payment simulation failed. Please try again.',
      planResetTitle: 'PLAN RESET',
      planResetBody: 'Plan reset to Free Starter (3 of 5 checks used).'
    }
  }
};

const hi: Dictionary = {
  pricing: {
    tag: 'व्यवसाय मॉडल और योजनाएँ',
    title: 'पारदर्शी, छात्र-प्रथम मूल्य निर्धारण',
    subtitle:
      'बिना किसी लॉक-इन के मुफ़्त शुरू करें। गहन GitHub रिपॉज़िटरी सत्यापन, वेब शोध और असीमित ऑडिट के लिए Student Premium में अपग्रेड करें। कॉलेज प्लेसमेंट सेल के लिए बनाए गए कैंपस लाइसेंस।',

    usageHeading: 'मासिक अवसर जाँच उपयोग',
    currentPlan: 'वर्तमान योजना: {plan}',
    resetToFree: '(मुफ़्त में रीसेट करें)',
    resetToFreeHint: 'उपयोग सीमाएँ परखने के लिए वापस Free श्रेणी में जाएँ',
    usageUnlimited: 'असीमित अवसर जाँच सक्रिय',
    usageCount: 'इस माह {limit} में से {used} मुफ़्त जाँचें उपयोग हुईं',
    remainingUnlimited: '∞ शेष',
    remainingChecks: '{remaining} जाँचें शेष',
    promptUnlimited:
      'आपको असीमित अवसर जाँच, गहन GitHub विश्लेषण और प्राथमिकता वाला एजेंट सत्यापन उपलब्ध है।',
    promptExceeded:
      'आपने इस माह की सभी 5 मुफ़्त जाँचें उपयोग कर ली हैं। असीमित ऑडिट के लिए Premium में अपग्रेड करें, या नीचे मौजूद मूल्यांकन देखना जारी रखें।',
    promptRemaining:
      'आपके पास 2 मुफ़्त जाँचें शेष हैं। असीमित जाँच और गहन GitHub प्रमाण सत्यापन के लिए Student Premium में अपग्रेड करें।',
    upgradeUsage: 'अपग्रेड करें (Rs {price}/माह) →',

    billingCycleLabel: 'बिलिंग चक्र:',
    monthlyOption: 'मासिक (Rs 79/माह)',
    semesterOption: 'सेमेस्टर पास (Rs 49/माह)',
    saveBadge: '38% बचाएँ',

    checkCurrentPlan: '✓ वर्तमान सक्रिय योजना',
    downgradeToFree: 'Free में डाउनग्रेड करें',

    free: {
      tagline: 'छात्र स्टार्टर',
      price: 'Rs 0',
      period: '/ हमेशा मुफ़्त',
      name: 'फ्री स्टार्टर',
      description:
        'इंटर्नशिप के लिए आवेदन करने वाले व्यक्तिगत कॉलेज छात्रों के लिए आधारभूत पात्रता जाँच।',
      feature1: 'प्रोजेक्ट और लिंक सहित 1 मुख्य छात्र प्रोफ़ाइल',
      feature2: 'प्रति माह अधिकतम 5 नियम-आधारित अवसर जाँचें',
      feature3: 'नियतात्मक नियम इंजन (ब्राउज़र में स्थानीय रूप से चलता है)',
      feature4: 'अपरिवर्तनीय गारंटी: “अज्ञात” कभी विफल नहीं होता',
      feature5: 'ऑडिट रिपोर्ट पर लाइव इनलाइन सुधार फ़ील्ड',
      feature6: 'गहन GitHub रेपो प्रमाण विश्लेषण',
      feature7: 'वेब शोध और नियोक्ता धोखाधड़ी जाँच'
    },

    premium: {
      badge: 'आवेदकों के लिए सर्वाधिक लोकप्रिय',
      tagline: 'प्रो स्टूडेंट',
      active: 'सक्रिय',
      price: 'Rs {price}',
      periodMonthly: '/ माह',
      periodSemester: '/ माह (प्रति सेमेस्टर बिल)',
      name: 'स्टूडेंट प्रीमियम',
      description:
        'असीमित ऑडिट, स्वचालित GitHub रेपो प्रमाण विश्लेषण और वेब इंटेलिजेंस के साथ अपनी जॉब खोज को तेज़ करें।',
      feature1: 'असीमित अवसर चेकलिस्ट ऑडिट',
      feature2: 'गहन GitHub रिपॉज़िटरी प्रमाण निष्कर्षण',
      feature3: 'लाइव वेब शोध और कंपनी धोखाधड़ी स्क्रीनिंग',
      feature4: 'संबंधित-अवसर खोज और परस्पर तुलना',
      feature5: 'दीर्घकालिक तैयारी ट्रैकिंग और स्कोरबोर्ड',
      feature6: 'दस्तावेज़ चेकलिस्ट टेम्पलेट और ATS रिज़्यूमे निर्यात',
      activeButton: '✓ प्रीमियम सक्रिय',
      upgradeButton: 'प्रीमियम में अपग्रेड करें →'
    },

    college: {
      tagline: 'संस्थानों और प्लेसमेंट सेल के लिए',
      priceLabel: 'संस्थागत',
      period: '/ प्रति वर्ष',
      name: 'कॉलेज लाइसेंस',
      description:
        'प्रशिक्षण और प्लेसमेंट सेल (T&P) को बैच छात्र विश्लेषण और कंपनी-ड्राइव शॉर्टलिस्टिंग के साथ सशक्त बनाएँ।',
      feature1: 'प्लेसमेंट-सेल प्रशासनिक डैशबोर्ड (/college)',
      feature2: 'बल्क छात्र प्रोफ़ाइल (प्रति बैच 120+ उम्मीदवार)',
      feature3: 'कस्टम कंपनी-ड्राइव पात्रता चेकलिस्ट',
      feature4: 'बैच कौशल-अंतराल रिपोर्ट और तैयारी बार चार्ट',
      feature5: 'सीधा Excel/CSV निर्यात और शॉर्टलिस्टिंग सूचनाएँ',
      viewDashboard: 'प्लेसमेंट डैशबोर्ड देखें →',
      simulateActivate: 'कॉलेज लाइसेंस सक्रिय करने का अनुकरण करें'
    },

    valueTag: 'मूल्य प्रस्ताव',
    valueTitle: 'OpportunityKit अपनी लागत क्यों वसूल करता है',
    valueSubtitle:
      'महत्वाकांक्षी उम्मीदवारों और विश्वविद्यालय प्लेसमेंट समन्वयकों दोनों के लिए मापने योग्य निवेश पर प्रतिफल।',
    value1Title: 'छात्रों के लिए 1,000x ROI',
    value1Body:
      '8-सप्ताह की अवधि या असत्यापित GitHub पोर्टफ़ोलियो की अनदेखी के कारण एक ही Rs 50,000 छात्रवृत्ति या Rs 35,000/माह इंजीनियरिंग स्टाइपेंड खो देना, Rs 49 मासिक सदस्यता से 1,000x अधिक महंगा पड़ता है।',
    value1Point: '✓ टाली जा सकने वाली अयोग्यता रोकें',
    value2Title: 'प्रति ड्राइव 40+ घंटे बचत',
    value2Body:
      'प्लेसमेंट अधिकारी प्रत्येक आने वाले भर्तीकर्ता के लिए सैकड़ों छात्र रिज़्यूमे और CGPA कट-ऑफ़ मैन्युअल रूप से जाँचते हैं। OpportunityKit 120 छात्रों पर कस्टम कंपनी चेकलिस्ट 18 मिलीसेकंड में बिना किसी लिपिकीय त्रुटि के चलाता है।',
    value2Point: '✓ स्वचालित उम्मीदवार शॉर्टलिस्टिंग',
    value3Title: 'शून्य निर्णय भ्रम',
    value3Body:
      'मानक चैटबॉट आत्मविश्वास से हाँ या ना अनुमान लगाते हैं और छात्रों को भटकाते हैं। OpportunityKit का शुद्ध TypeScript इंजन गारंटी देता है कि हर निष्कर्ष शब्दशः उद्धृत पाठ और प्रयुक्त सटीक गणितीय नियम का हवाला देता है।',
    value3Point: '✓ अपरिवर्तनीय: अज्ञात कभी विफल नहीं होता',

    checkout: {
      title: 'OpportunityKit चेकआउट',
      orderId: 'ऑर्डर ID:',
      collegeName: 'कॉलेज कैंपस लाइसेंस',
      amount: 'Rs {price}',
      cycleMonthly: 'मासिक',
      cycleSemester: 'सेमेस्टर पास',
      premiumSummary: 'असीमित जाँचें, GitHub रेपो विश्लेषण और वेब शोध ({cycle})।',
      collegeSummary:
        '120 छात्र बैच विश्लेषण और कस्टम ड्राइव चेकलिस्ट सहित पूर्ण प्लेसमेंट सेल डैशबोर्ड।',
      selectPayment: 'नकली भुगतान विधि चुनें:',
      upi: '⚡ UPI / QR',
      card: '💳 डेबिट / क्रेडिट',
      netbanking: '🏦 NetBanking',
      razorpayTitle: 'Razorpay एकीकरण तैयार',
      razorpayBody:
        'ऑर्डर हस्ताक्षर सत्यापन (`razorpay_order_id`) के साथ संरचित। Pay पर क्लिक करने से स्थानीय स्थिति में योजना सक्रिय हो जाती है और एनालिटिक्स दर्ज होती है।',
      processing: 'प्रोसेस हो रहा है...',
      pay: 'Rs {price} भुगतान करें और सक्रिय करें'
    },

    toast: {
      paymentSuccessTitle: 'भुगतान सफल',
      upgraded: '{plan} में अपग्रेड किया गया! ऑर्डर ID: {orderId}',
      paymentFailedTitle: 'भुगतान विफल',
      paymentFailedBody: 'भुगतान अनुकरण विफल रहा। कृपया पुनः प्रयास करें।',
      planResetTitle: 'योजना रीसेट',
      planResetBody: 'योजना फ्री स्टार्टर पर रीसेट की गई (5 में से 3 जाँचें उपयोग हुईं)।'
    }
  }
};

const mr: Dictionary = {
  pricing: {
    tag: 'व्यवसाय मॉडेल आणि योजना',
    title: 'पारदर्शक, विद्यार्थी-प्रथम किंमत',
    subtitle:
      'कोणत्याही लॉक-इनशिवाय विनामूल्य सुरू करा. सखोल GitHub रेपॉझिटरी पडताळणी, वेब संशोधन आणि अमर्यादित ऑडिटसाठी Student Premium मध्ये अपग्रेड करा. कॉलेज प्लेसमेंट सेलसाठी तयार केलेले कॅम्पस परवाने.',

    usageHeading: 'मासिक संधी तपासणी वापर',
    currentPlan: 'सध्याची योजना: {plan}',
    resetToFree: '(विनामूल्यवर रीसेट करा)',
    resetToFreeHint: 'वापर मर्यादा तपासण्यासाठी पुन्हा Free श्रेणीत जा',
    usageUnlimited: 'अमर्यादित संधी तपासणी सक्रिय',
    usageCount: 'या महिन्यात {limit} पैकी {used} विनामूल्य तपासण्या वापरल्या',
    remainingUnlimited: '∞ शिल्लक',
    remainingChecks: '{remaining} तपासण्या शिल्लक',
    promptUnlimited:
      'तुम्हाला अमर्यादित संधी तपासणी, सखोल GitHub विश्लेषण आणि प्राधान्य एजंट पडताळणी उपलब्ध आहे.',
    promptExceeded:
      'तुम्ही या महिन्याच्या सर्व 5 विनामूल्य तपासण्या वापरल्या आहेत. अमर्यादित ऑडिटसाठी Premium मध्ये अपग्रेड करा, किंवा खालील विद्यमान मूल्यांकने पाहत राहा.',
    promptRemaining:
      'तुमच्याकडे 2 विनामूल्य तपासण्या शिल्लक आहेत. अमर्यादित तपासण्या आणि सखोल GitHub पुरावा पडताळणीसाठी Student Premium मध्ये अपग्रेड करा.',
    upgradeUsage: 'अपग्रेड करा (Rs {price}/महिना) →',

    billingCycleLabel: 'बिलिंग चक्र:',
    monthlyOption: 'मासिक (Rs 79/महिना)',
    semesterOption: 'सेमिस्टर पास (Rs 49/महिना)',
    saveBadge: '38% बचत',

    checkCurrentPlan: '✓ सध्याची सक्रिय योजना',
    downgradeToFree: 'Free वर डाउनग्रेड करा',

    free: {
      tagline: 'विद्यार्थी स्टार्टर',
      price: 'Rs 0',
      period: '/ कायम विनामूल्य',
      name: 'फ्री स्टार्टर',
      description:
        'इंटर्नशिपसाठी अर्ज करणाऱ्या वैयक्तिक कॉलेज विद्यार्थ्यांसाठी आवश्यक पात्रता तपासणी.',
      feature1: 'प्रोजेक्ट आणि दुव्यांसह 1 मुख्य विद्यार्थी प्रोफाइल',
      feature2: 'दर महिन्याला जास्तीत जास्त 5 नियम-आधारित संधी तपासण्या',
      feature3: 'निर्धारक नियम इंजिन (ब्राउझरमध्ये स्थानिकपणे चालते)',
      feature4: 'अपरिवर्तनीय हमी: “अज्ञात” कधीही अयशस्वी ठरत नाही',
      feature5: 'ऑडिट अहवालावर थेट इनलाइन दुरुस्ती फील्ड',
      feature6: 'सखोल GitHub रेपो पुरावा विश्लेषण',
      feature7: 'वेब संशोधन आणि नियोक्ता फसवणूक तपासणी'
    },

    premium: {
      badge: 'अर्जदारांसाठी सर्वाधिक लोकप्रिय',
      tagline: 'प्रो विद्यार्थी',
      active: 'सक्रिय',
      price: 'Rs {price}',
      periodMonthly: '/ महिना',
      periodSemester: '/ महिना (प्रति सेमिस्टर बिल)',
      name: 'स्टूडेंट प्रीमियम',
      description:
        'अमर्यादित ऑडिट, स्वयंचलित GitHub रेपो पुरावा विश्लेषण आणि वेब इंटेलिजन्ससह तुमचा नोकरी शोध वेगवान करा.',
      feature1: 'अमर्यादित संधी चेकलिस्ट ऑडिट',
      feature2: 'सखोल GitHub रेपॉझिटरी पुरावा उत्खनन',
      feature3: 'थेट वेब संशोधन आणि कंपनी फसवणूक स्क्रीनिंग',
      feature4: 'संबंधित-संधी शोध आणि परस्पर तुलना',
      feature5: 'दीर्घकालीन तयारी ट्रॅकिंग आणि स्कोअरबोर्ड',
      feature6: 'दस्तऐवज चेकलिस्ट टेम्पलेट आणि ATS रेझ्युमे निर्यात',
      activeButton: '✓ प्रीमियम सक्रिय',
      upgradeButton: 'प्रीमियममध्ये अपग्रेड करा →'
    },

    college: {
      tagline: 'संस्था आणि प्लेसमेंट सेलसाठी',
      priceLabel: 'संस्थात्मक',
      period: '/ प्रति वर्ष',
      name: 'कॉलेज परवाना',
      description:
        'प्रशिक्षण आणि प्लेसमेंट सेल (T&P) सक्षम करा — बॅच विद्यार्थी विश्लेषण आणि कंपनी-ड्राइव्ह शॉर्टलिस्टिंगसह.',
      feature1: 'प्लेसमेंट-सेल प्रशासकीय डॅशबोर्ड (/college)',
      feature2: 'बल्क विद्यार्थी प्रोफाइल (प्रति बॅच 120+ उमेदवार)',
      feature3: 'कस्टम कंपनी-ड्राइव्ह पात्रता चेकलिस्ट',
      feature4: 'बॅच कौशल्य-अंतर अहवाल आणि तयारी बार चार्ट',
      feature5: 'थेट Excel/CSV निर्यात आणि शॉर्टलिस्टिंग सूचना',
      viewDashboard: 'प्लेसमेंट डॅशबोर्ड पहा →',
      simulateActivate: 'कॉलेज परवाना सक्रिय करण्याचे अनुकरण करा'
    },

    valueTag: 'मूल्य प्रस्ताव',
    valueTitle: 'OpportunityKit स्वतःची किंमत का वसूल करते',
    valueSubtitle:
      'महत्त्वाकांक्षी उमेदवार आणि विद्यापीठ प्लेसमेंट समन्वयक दोघांसाठी मोजमापनीय गुंतवणुकीवरील परतावा.',
    value1Title: 'विद्यार्थ्यांसाठी 1,000x ROI',
    value1Body:
      '8-आठवड्यांचा कालावधी किंवा असत्यापित GitHub पोर्टफोलिओ दुर्लक्षित केल्यामुळे एकच Rs 50,000 शिष्यवृत्ती किंवा Rs 35,000/महिना अभियांत्रिकी स्टायपेंड गमावणे, Rs 49 मासिक सदस्यतेपेक्षा 1,000x जास्त महाग पडते.',
    value1Point: '✓ टाळता येणारी अपात्रता रोखा',
    value2Title: 'प्रति ड्राइव्ह 40+ तासांची बचत',
    value2Body:
      'प्लेसमेंट अधिकारी प्रत्येक भेट देणाऱ्या भर्तीकर्त्यासाठी शेकडो विद्यार्थी रेझ्युमे आणि CGPA कट-ऑफ मॅन्युअली तपासतात. OpportunityKit 120 विद्यार्थ्यांवर कस्टम कंपनी चेकलिस्ट 18 मिलिसेकंदात शून्य लिपिकीय त्रुटीसह चालवते.',
    value2Point: '✓ स्वयंचलित उमेदवार शॉर्टलिस्टिंग',
    value3Title: 'शून्य निर्णय भ्रम',
    value3Body:
      'सामान्य चॅटबॉट आत्मविश्वासाने होय किंवा नाही अंदाज लावतात आणि विद्यार्थ्यांना दिशाभूल करतात. OpportunityKit चे शुद्ध TypeScript इंजिन हमी देते की प्रत्येक निष्कर्ष शब्दशः उद्धृत मजकूर आणि वापरलेल्या अचूक गणितीय नियमाचा उल्लेख करतो.',
    value3Point: '✓ अपरिवर्तनीय: अज्ञात कधीही अयशस्वी ठरत नाही',

    checkout: {
      title: 'OpportunityKit चेकआउट',
      orderId: 'ऑर्डर ID:',
      collegeName: 'कॉलेज कॅम्पस परवाना',
      amount: 'Rs {price}',
      cycleMonthly: 'मासिक',
      cycleSemester: 'सेमिस्टर पास',
      premiumSummary: 'अमर्यादित तपासण्या, GitHub रेपो विश्लेषण आणि वेब संशोधन ({cycle}).',
      collegeSummary:
        '120 विद्यार्थी बॅच विश्लेषण आणि कस्टम ड्राइव्ह चेकलिस्टसह संपूर्ण प्लेसमेंट सेल डॅशबोर्ड.',
      selectPayment: 'बनावट पेमेंट पद्धत निवडा:',
      upi: '⚡ UPI / QR',
      card: '💳 डेबिट / क्रेडिट',
      netbanking: '🏦 NetBanking',
      razorpayTitle: 'Razorpay एकत्रीकरण तयार',
      razorpayBody:
        'ऑर्डर स्वाक्षरी पडताळणीसह (`razorpay_order_id`) संरचित. Pay वर क्लिक केल्याने स्थानिक स्थितीत योजना सक्रिय होते आणि अ‍ॅनालिटिक्स नोंदते.',
      processing: 'प्रक्रिया सुरू आहे...',
      pay: 'Rs {price} भरा आणि सक्रिय करा'
    },

    toast: {
      paymentSuccessTitle: 'पेमेंट यशस्वी',
      upgraded: '{plan} मध्ये अपग्रेड केले! ऑर्डर ID: {orderId}',
      paymentFailedTitle: 'पेमेंट अयशस्वी',
      paymentFailedBody: 'पेमेंट अनुकरण अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा.',
      planResetTitle: 'योजना रीसेट',
      planResetBody: 'योजना फ्री स्टार्टरवर रीसेट केली (5 पैकी 3 तपासण्या वापरल्या).'
    }
  }
};

const module_ = { en, hi, mr };
export default module_;
