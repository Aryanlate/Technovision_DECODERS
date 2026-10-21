import type { Dictionary } from '../../types';

/** Page-scoped dictionary module for the result page (`/result`). */
const en: Dictionary = {
  result: {
    loading: {
      tag: 'STEP 2 • TRANSPARENT AUDIT',
      title: 'VERIFICATION RESULTS',
      subtitle: 'Evaluating eligibility credentials against opportunity requirements...'
    },

    empty: {
      message:
        'No parsed opportunity checklist found in your session. Head over to the Check page to paste a listing or run the sample demo.',
      action: 'Go to Check Page',
      cta: 'Go to Check Page →'
    },

    header: {
      tag: 'STEP 2 • TRANSPARENT AUDIT',
      title: 'VERIFICATION RESULTS',
      subtitle:
        "Transparent rule-based checklist audit. 'Unknown' is never marked as fails. Every finding lists the exact rule used."
    },

    action: {
      editChecklist: '← Edit Checklist',
      copiedMarkdown: '✓ Copied Markdown',
      copySummary: 'Copy Summary',
      preparePdf: 'Prepare PDF',
      printPdf: 'Print / Save PDF',
      addToCalendar: 'Add deadline to calendar',
      shareReadonly: 'Share read-only link',
      exportJson: 'Export JSON',
      dismiss: 'Dismiss'
    },

    deadlineTooltip: 'Deadline {deadline}',
    noDeadlineTooltip: 'No deadline found in this listing',

    missingProfile: {
      message:
        "You haven't created your master profile yet. Missing info fields are waiting for your details. Create your profile once or load our benchmark student profile to verify your eligibility.",
      action: 'Load Benchmark Profile (Alex Sharma)'
    },

    usage: {
      planUnlimited: 'Plan: {plan} • Unlimited Opportunity Checks Active',
      freeUsed: '{used} of {limit} free checks used this month',
      remaining: '({remaining} remaining before reset)',
      upgrade: 'Upgrade to Student Premium (Rs 49/mo) for unlimited checks & GitHub analysis →',
      unlimitedActive: 'UNLIMITED ACTIVE'
    },

    verdictLabel: 'AUDIT VERDICT',
    summaryHeadline:
      '{matchCount} {matchLabel} · {mismatchCount} {mismatchLabel} · {missingCount} {missingLabel} → {verdict}',
    verdict: {
      ready: 'Ready to apply',
      almost: 'Almost ready to apply',
      notReady: 'Not ready to apply yet'
    },
    readinessScoreLabel: 'Readiness Score',
    whatIfNotSavedActual: 'What-if, not saved · actual {score}%',
    hide: 'Hide',
    showFormula: 'How this score is calculated',
    formulaLabel: 'Formula: ',

    scoreTable: {
      requirement: 'Requirement',
      weight: 'Weight',
      status: 'Status',
      points: 'Points',
      total: 'Total',
      required: 'required',
      optional: 'optional'
    },

    whatIf: {
      banner: 'What-if, not saved',
      clear: 'Clear what-if',
      counts:
        '{matchCount} {matchLabel} · {mismatchCount} {mismatchLabel} · {missingCount} {missingLabel} · Score {score}%'
    },

    totalCriteria: '{total} Total Criteria Evaluated',
    segmentTitle: '{count} {label} ({percent}%)',

    a11y: {
      score: 'Readiness score {score} percent',
      progress: '{matchCount} {matchLabel}, {mismatchCount} {mismatchLabel}, {missingCount} {missingLabel}'
    },

    audit: {
      title: 'Detailed Eligibility Audit Table',
      description:
        'Every rule runs transparently in plain TypeScript without AI decision making. Missing info fields can be fixed inline below.',
      requirement: 'Requirement',
      asks: 'Opportunity Asks',
      profile: 'Your Profile',
      status: 'Status',
      reason: 'Reason with Rule Used',
      specifiedInChecklist: 'Specified in checklist',
      rulePrefix: 'Rule: {rule}',
      assumeFix: 'Assume I will fix this',
      whatIfNotSaved: 'What-if, not saved',
      quickFix: 'Quick Fix:',
      defaultNextStep: 'Provide this information to verify eligibility instantly.'
    },

    placeholder: {
      link: 'https://github.com/username or portfolio',
      weeks: 'Weeks (e.g. 8)',
      cgpa: 'CGPA (e.g. 8.2)',
      generic: 'Enter missing value'
    },

    fix: {
      saveLink: 'Save Link',
      markDocumentReady: '✓ Mark Document Ready',
      setWeeks: 'Set Weeks',
      setYear: 'Set Year',
      setCgpa: 'Set CGPA',
      update: 'Update'
    },

    yearOption: {
      one: '1st Year',
      two: '2nd Year',
      three: '3rd Year',
      four: '4th Year'
    },

    project: {
      title: 'Best-Fit Project Highlight',
      lead: 'Lead with this project',
      matchOne: '{score} match',
      matchMany: '{score} matches'
    },

    nextSteps: {
      title: 'Next Steps & Action Plan',
      description: 'Ordered by quickest fix first. Effort labels are rough estimates, not promises.',
      allSatisfied: '✓ All criteria are fully satisfied! You are ready to apply right now.',
      stepLine: '{order}. [{status}] {title}: {action}',
      estimatedEffort: 'Estimated effort',
      estimateSuffix: '~ {estimate} (estimate)',
      editProfile: 'Edit Master Profile →',
      checkAnother: 'Check Another Opportunity'
    },

    effort: {
      year: { action: 'Set your year of study', estimate: '1 minute' },
      cgpa: { action: 'Add your CGPA', estimate: '2 minutes' },
      'link:github': { action: 'Add GitHub link', estimate: '5 minutes' },
      'link:either': { action: 'Add GitHub or portfolio link', estimate: '5 minutes' },
      'link:linkedin': { action: 'Add LinkedIn link', estimate: '5 minutes' },
      'link:portfolio': { action: 'Add portfolio link', estimate: '10 minutes' },
      'link:instagram': { action: 'Add Instagram link', estimate: '5 minutes' },
      'document:other': { action: 'Upload the document', estimate: '15 minutes' },
      'document:resume': { action: 'Prepare your resume', estimate: '30 minutes' },
      availability: { action: 'Confirm your availability', estimate: '5 minutes' },
      projectCount: { action: 'Add a project', estimate: 'about 1 week' },
      projectTag: { action: 'Add a matching project', estimate: 'about 1 week' },
      skills: { action: 'Learn {skills} basics', estimate: 'about 2 weeks' },
      deadline: { action: 'Submit before the deadline', estimate: '1 minute' },
      'custom:income': { action: 'Add family income details', estimate: '5 minutes' },
      'custom:generic': { action: 'Provide the missing evidence', estimate: '10 minutes' }
    },

    agents: {
      eyebrow: 'AI EVIDENCE & DEEP ANALYSIS',
      premiumUnlocked: 'PREMIUM UNLOCKED',
      studentFeature: 'STUDENT PREMIUM FEATURE',
      title: 'Agent Research & GitHub Proof Extraction',
      descriptionUnlocked:
        'AI agents inspect candidate repository commits, verified proof artifacts, and live employer legitimacy.',
      descriptionLocked:
        'Free tier includes 100% deterministic rule verification above. Upgrade to Student Premium to unlock deep repository evidence, employer legitimacy checks, and tailored ATS document templates.',
      upgrade: 'Upgrade to Unlock (Rs 49/mo) →',
      source: 'Source',
      noSource: 'No source link — cannot be counted',
      invariantLabel: 'Agent Invariant:',
      invariantBody:
        'AI agents only suggest. The transparent rule engine above made the final eligibility decision. Anything marked AI-suggested needs your confirmation, and a fact without a source link is never counted.',
      preview: {
        githubTitle: '🔒 GitHub Repository Proof',
        githubDesc:
          'Inspects commit history, pull requests, and verified repositories to substantiate technical skill claims.',
        employerTitle: '🔒 Live Web Employer Research',
        employerDesc:
          'Verifies employer domain history, recruiter legitimacy, and screens against fraudulent listings.',
        atsTitle: '🔒 ATS Document Templates',
        atsDesc:
          'Generates keyword-targeted resume bullet points and document checklist templates for this listing.',
        available: 'Available on Student Premium'
      },
      modules: {
        github: {
          title: 'GitHub Repo Analysis',
          repository: 'Repository',
          commits: 'Commits',
          languages: 'Languages',
          note: 'Matches the portfolio requirement in the listing.'
        },
        employer: {
          title: 'Employer Legitimacy',
          employer: 'Employer',
          domainAge: 'Domain age',
          note: 'No source link was captured, so this claim cannot be counted yet.'
        },
        ats: {
          title: 'ATS Document Template',
          keywordMatch: 'Keyword match',
          actionVerbs: 'Action verbs',
          note: 'Generated wording for your application documents.'
        }
      }
    },

    notices: {
      loadedSample: 'Loaded benchmark student profile (Alex Sharma). Re-evaluated instantly.',
      updatedProfile: 'Updated profile with "{title}". Status recalculated instantly.',
      pdfDownloaded: 'Checklist PDF downloaded.',
      pdfFailed: 'We could not build the PDF in this browser.',
      noDeadline: 'This listing has no date we can read, so no calendar reminder was created.',
      calendarDownloaded: 'Calendar file downloaded with reminders 3 days and 1 day before.',
      calendarFailed: 'We could not build the calendar file for this deadline.',
      linkCopied: 'Read-only link copied. It expires in 7 days and you can revoke it in the tracker.',
      linkCreated: 'Read-only link created: {link}',
      linkFailed: 'We could not create a share link right now.',
      exported: 'Exported this result and your profile as JSON.'
    }
  }
};

const hi: Dictionary = {
  result: {
    loading: {
      tag: 'चरण 2 • पारदर्शी लेखा-जोखा',
      title: 'सत्यापन परिणाम',
      subtitle: 'अवसर की शर्तों के विरुद्ध पात्रता प्रमाणों का मूल्यांकन किया जा रहा है...'
    },

    empty: {
      message:
        'आपके सत्र में कोई पार्स की गई अवसर चेकलिस्ट नहीं मिली। लिस्टिंग पेस्ट करने या नमूना डेमो चलाने के लिए चेक पेज पर जाएँ।',
      action: 'चेक पेज पर जाएँ',
      cta: 'चेक पेज पर जाएँ →'
    },

    header: {
      tag: 'चरण 2 • पारदर्शी लेखा-जोखा',
      title: 'सत्यापन परिणाम',
      subtitle:
        'पारदर्शी नियम-आधारित चेकलिस्ट ऑडिट। \'अज्ञात\' को कभी विफल नहीं माना जाता। प्रत्येक निष्कर्ष प्रयुक्त सटीक नियम दर्शाता है।'
    },

    action: {
      editChecklist: '← चेकलिस्ट संपादित करें',
      copiedMarkdown: '✓ मार्कडाउन कॉपी हो गया',
      copySummary: 'सारांश कॉपी करें',
      preparePdf: 'PDF तैयार करें',
      printPdf: 'प्रिंट / PDF सहेजें',
      addToCalendar: 'कैलेंडर में समय-सीमा जोड़ें',
      shareReadonly: 'केवल-पढ़ने योग्य लिंक साझा करें',
      exportJson: 'JSON निर्यात करें',
      dismiss: 'खारिज करें'
    },

    deadlineTooltip: 'समय-सीमा {deadline}',
    noDeadlineTooltip: 'इस लिस्टिंग में कोई समय-सीमा नहीं मिली',

    missingProfile: {
      message:
        'आपने अभी तक अपनी मुख्य प्रोफ़ाइल नहीं बनाई है। अपूर्ण जानकारी वाले फ़ील्ड आपके विवरण की प्रतीक्षा कर रहे हैं। अपनी पात्रता सत्यापित करने के लिए एक बार अपनी प्रोफ़ाइल बनाएँ या हमारी बेंचमार्क छात्र प्रोफ़ाइल लोड करें।',
      action: 'बेंचमार्क प्रोफ़ाइल लोड करें (Alex Sharma)'
    },

    usage: {
      planUnlimited: 'योजना: {plan} • असीमित अवसर जाँच सक्रिय',
      freeUsed: 'इस महीने {limit} में से {used} मुफ़्त जाँचें उपयोग की गईं',
      remaining: '(रीसेट से पहले {remaining} शेष)',
      upgrade:
        'असीमित जाँच और GitHub विश्लेषण के लिए स्टूडेंट प्रीमियम (Rs 49/माह) में अपग्रेड करें →',
      unlimitedActive: 'असीमित सक्रिय'
    },

    verdictLabel: 'ऑडिट निर्णय',
    summaryHeadline:
      '{matchCount} {matchLabel} · {mismatchCount} {mismatchLabel} · {missingCount} {missingLabel} → {verdict}',
    verdict: {
      ready: 'आवेदन के लिए तैयार',
      almost: 'आवेदन के लिए लगभग तैयार',
      notReady: 'अभी आवेदन के लिए तैयार नहीं'
    },
    readinessScoreLabel: 'तैयारी स्कोर',
    whatIfNotSavedActual: 'क्या-अगर, सहेजा नहीं गया · वास्तविक {score}%',
    hide: 'छिपाएँ',
    showFormula: 'यह स्कोर कैसे गणना किया जाता है',
    formulaLabel: 'सूत्र: ',

    scoreTable: {
      requirement: 'शर्त',
      weight: 'भार',
      status: 'स्थिति',
      points: 'अंक',
      total: 'कुल',
      required: 'आवश्यक',
      optional: 'वैकल्पिक'
    },

    whatIf: {
      banner: 'क्या-अगर, सहेजा नहीं गया',
      clear: 'क्या-अगर साफ़ करें',
      counts:
        '{matchCount} {matchLabel} · {mismatchCount} {mismatchLabel} · {missingCount} {missingLabel} · स्कोर {score}%'
    },

    totalCriteria: '{total} कुल शर्तों का मूल्यांकन',
    segmentTitle: '{count} {label} ({percent}%)',

    a11y: {
      score: 'तैयारी स्कोर {score} प्रतिशत',
      progress: '{matchCount} {matchLabel}, {mismatchCount} {mismatchLabel}, {missingCount} {missingLabel}'
    },

    audit: {
      title: 'विस्तृत पात्रता ऑडिट तालिका',
      description:
        'प्रत्येक नियम AI निर्णय के बिना सामान्य TypeScript में पारदर्शी रूप से चलता है। अपूर्ण जानकारी वाले फ़ील्ड नीचे इनलाइन ठीक किए जा सकते हैं।',
      requirement: 'शर्त',
      asks: 'अवसर की माँग',
      profile: 'आपकी प्रोफ़ाइल',
      status: 'स्थिति',
      reason: 'प्रयुक्त नियम के साथ कारण',
      specifiedInChecklist: 'चेकलिस्ट में निर्दिष्ट',
      rulePrefix: 'नियम: {rule}',
      assumeFix: 'मान लें कि मैं इसे ठीक करूँगा',
      whatIfNotSaved: 'क्या-अगर, सहेजा नहीं गया',
      quickFix: 'त्वरित सुधार:',
      defaultNextStep: 'पात्रता तुरंत सत्यापित करने के लिए यह जानकारी दें।'
    },

    placeholder: {
      link: 'https://github.com/username या पोर्टफ़ोलियो',
      weeks: 'सप्ताह (जैसे 8)',
      cgpa: 'CGPA (जैसे 8.2)',
      generic: 'अनुपस्थित मान दर्ज करें'
    },

    fix: {
      saveLink: 'लिंक सहेजें',
      markDocumentReady: '✓ दस्तावेज़ तैयार के रूप में चिह्नित करें',
      setWeeks: 'सप्ताह सेट करें',
      setYear: 'वर्ष सेट करें',
      setCgpa: 'CGPA सेट करें',
      update: 'अद्यतन करें'
    },

    yearOption: {
      one: 'प्रथम वर्ष',
      two: 'द्वितीय वर्ष',
      three: 'तृतीय वर्ष',
      four: 'चतुर्थ वर्ष'
    },

    project: {
      title: 'सर्वोत्तम-उपयुक्त प्रोजेक्ट हाइलाइट',
      lead: 'इस प्रोजेक्ट के साथ शुरुआत करें',
      matchOne: '{score} मेल',
      matchMany: '{score} मेल'
    },

    nextSteps: {
      title: 'अगले कदम और कार्य योजना',
      description: 'सबसे तेज़ सुधार पहले के क्रम में। प्रयास लेबल मोटे अनुमान हैं, वादे नहीं।',
      allSatisfied: '✓ सभी शर्तें पूरी तरह संतुष्ट हैं! आप अभी आवेदन के लिए तैयार हैं।',
      stepLine: '{order}. [{status}] {title}: {action}',
      estimatedEffort: 'अनुमानित प्रयास',
      estimateSuffix: '~ {estimate} (अनुमान)',
      editProfile: 'मुख्य प्रोफ़ाइल संपादित करें →',
      checkAnother: 'एक और अवसर जाँचें'
    },

    effort: {
      year: { action: 'अपना अध्ययन वर्ष सेट करें', estimate: '1 मिनट' },
      cgpa: { action: 'अपना CGPA जोड़ें', estimate: '2 मिनट' },
      'link:github': { action: 'GitHub लिंक जोड़ें', estimate: '5 मिनट' },
      'link:either': { action: 'GitHub या पोर्टफ़ोलियो लिंक जोड़ें', estimate: '5 मिनट' },
      'link:linkedin': { action: 'LinkedIn लिंक जोड़ें', estimate: '5 मिनट' },
      'link:portfolio': { action: 'पोर्टफ़ोलियो लिंक जोड़ें', estimate: '10 मिनट' },
      'link:instagram': { action: 'Instagram लिंक जोड़ें', estimate: '5 मिनट' },
      'document:other': { action: 'दस्तावेज़ अपलोड करें', estimate: '15 मिनट' },
      'document:resume': { action: 'अपना रेज़्युमे तैयार करें', estimate: '30 मिनट' },
      availability: { action: 'अपनी उपलब्धता की पुष्टि करें', estimate: '5 मिनट' },
      projectCount: { action: 'एक प्रोजेक्ट जोड़ें', estimate: 'लगभग 1 सप्ताह' },
      projectTag: { action: 'मेल खाता प्रोजेक्ट जोड़ें', estimate: 'लगभग 1 सप्ताह' },
      skills: { action: '{skills} की मूल बातें सीखें', estimate: 'लगभग 2 सप्ताह' },
      deadline: { action: 'समय-सीमा से पहले जमा करें', estimate: '1 मिनट' },
      'custom:income': { action: 'परिवार की आय विवरण जोड़ें', estimate: '5 मिनट' },
      'custom:generic': { action: 'अनुपस्थित प्रमाण प्रदान करें', estimate: '10 मिनट' }
    },

    agents: {
      eyebrow: 'AI प्रमाण और गहन विश्लेषण',
      premiumUnlocked: 'प्रीमियम अनलॉक',
      studentFeature: 'स्टूडेंट प्रीमियम सुविधा',
      title: 'एजेंट शोध और GitHub प्रमाण निष्कर्षण',
      descriptionUnlocked:
        'AI एजेंट उम्मीदवार के रिपॉज़िटरी कमिट, सत्यापित प्रमाण आर्टिफ़ैक्ट और लाइव नियोक्ता वैधता की जाँच करते हैं।',
      descriptionLocked:
        'मुफ़्त टियर में ऊपर 100% नियतात्मक नियम सत्यापन शामिल है। गहन रिपॉज़िटरी प्रमाण, नियोक्ता वैधता जाँच और अनुकूलित ATS दस्तावेज़ टेम्पलेट अनलॉक करने के लिए स्टूडेंट प्रीमियम में अपग्रेड करें।',
      upgrade: 'अनलॉक के लिए अपग्रेड करें (Rs 49/माह) →',
      source: 'स्रोत',
      noSource: 'कोई स्रोत लिंक नहीं — इसे गिना नहीं जा सकता',
      invariantLabel: 'एजेंट अपरिवर्तनीय नियम:',
      invariantBody:
        'AI एजेंट केवल सुझाव देते हैं। ऊपर के पारदर्शी नियम इंजन ने अंतिम पात्रता निर्णय लिया। AI-सुझाव के रूप में चिह्नित किसी भी चीज़ के लिए आपकी पुष्टि आवश्यक है, और बिना स्रोत लिंक वाला तथ्य कभी नहीं गिना जाता।',
      preview: {
        githubTitle: '🔒 GitHub रिपॉज़िटरी प्रमाण',
        githubDesc:
          'तकनीकी कौशल दावों की पुष्टि के लिए कमिट इतिहास, पुल अनुरोध और सत्यापित रिपॉज़िटरी की जाँच करता है।',
        employerTitle: '🔒 लाइव वेब नियोक्ता शोध',
        employerDesc:
          'नियोक्ता डोमेन इतिहास, भर्तीकर्ता वैधता की पुष्टि करता है और धोखाधड़ी वाली लिस्टिंग के विरुद्ध जाँच करता है।',
        atsTitle: '🔒 ATS दस्तावेज़ टेम्पलेट',
        atsDesc:
          'इस लिस्टिंग के लिए कीवर्ड-लक्षित रेज़्युमे बुलेट पॉइंट और दस्तावेज़ चेकलिस्ट टेम्पलेट तैयार करता है।',
        available: 'स्टूडेंट प्रीमियम पर उपलब्ध'
      },
      modules: {
        github: {
          title: 'GitHub रिपो विश्लेषण',
          repository: 'रिपॉज़िटरी',
          commits: 'कमिट',
          languages: 'भाषाएँ',
          note: 'लिस्टिंग में पोर्टफ़ोलियो शर्त से मेल खाता है।'
        },
        employer: {
          title: 'नियोक्ता वैधता',
          employer: 'नियोक्ता',
          domainAge: 'डोमेन आयु',
          note: 'कोई स्रोत लिंक कैप्चर नहीं हुआ, इसलिए इस दावे को अभी गिना नहीं जा सकता।'
        },
        ats: {
          title: 'ATS दस्तावेज़ टेम्पलेट',
          keywordMatch: 'कीवर्ड मिलान',
          actionVerbs: 'क्रिया शब्द',
          note: 'आपके आवेदन दस्तावेज़ों के लिए तैयार शब्दावली।'
        }
      }
    },

    notices: {
      loadedSample: 'बेंचमार्क छात्र प्रोफ़ाइल लोड की गई (Alex Sharma)। तुरंत पुनः मूल्यांकन किया गया।',
      updatedProfile: '"{title}" के साथ प्रोफ़ाइल अद्यतन की गई। स्थिति तुरंत पुनर्गणित की गई।',
      pdfDownloaded: 'चेकलिस्ट PDF डाउनलोड हो गई।',
      pdfFailed: 'इस ब्राउज़र में हम PDF नहीं बना सके।',
      noDeadline: 'इस लिस्टिंग में कोई पढ़ने योग्य तिथि नहीं है, इसलिए कोई कैलेंडर अनुस्मारक नहीं बनाया गया।',
      calendarDownloaded: 'कैलेंडर फ़ाइल डाउनलोड हो गई, जिसमें 3 दिन और 1 दिन पहले अनुस्मारक हैं।',
      calendarFailed: 'इस समय-सीमा के लिए हम कैलेंडर फ़ाइल नहीं बना सके।',
      linkCopied:
        'केवल-पढ़ने योग्य लिंक कॉपी हो गया। यह 7 दिनों में समाप्त हो जाता है और आप इसे ट्रैकर में रद्द कर सकते हैं।',
      linkCreated: 'केवल-पढ़ने योग्य लिंक बनाया गया: {link}',
      linkFailed: 'अभी हम शेयर लिंक नहीं बना सके।',
      exported: 'यह परिणाम और आपकी प्रोफ़ाइल JSON के रूप में निर्यात की गई।'
    }
  }
};

const mr: Dictionary = {
  result: {
    loading: {
      tag: 'चरण 2 • पारदर्शक लेखाजोखा',
      title: 'सत्यापन निकाल',
      subtitle: 'संधीच्या अटींशी पात्रता पुराव्यांचे मूल्यांकन केले जात आहे...'
    },

    empty: {
      message:
        'तुमच्या सत्रात कोणतीही पार्स केलेली संधी चेकलिस्ट आढळली नाही. जाहिरात पेस्ट करण्यासाठी किंवा नमुना डेमो चालवण्यासाठी चेक पेजवर जा.',
      action: 'चेक पेजवर जा',
      cta: 'चेक पेजवर जा →'
    },

    header: {
      tag: 'चरण 2 • पारदर्शक लेखाजोखा',
      title: 'सत्यापन निकाल',
      subtitle:
        'पारदर्शक नियम-आधारित चेकलिस्ट ऑडिट. \'अज्ञात\' कधीही अपयश मानले जात नाही. प्रत्येक निष्कर्ष वापरलेला नेमका नियम दर्शवतो.'
    },

    action: {
      editChecklist: '← चेकलिस्ट संपादित करा',
      copiedMarkdown: '✓ मार्कडाउन कॉपी झाले',
      copySummary: 'सारांश कॉपी करा',
      preparePdf: 'PDF तयार करा',
      printPdf: 'प्रिंट / PDF जतन करा',
      addToCalendar: 'कॅलेंडरमध्ये अंतिम मुदत जोडा',
      shareReadonly: 'फक्त-वाचनीय लिंक शेअर करा',
      exportJson: 'JSON निर्यात करा',
      dismiss: 'बंद करा'
    },

    deadlineTooltip: 'अंतिम मुदत {deadline}',
    noDeadlineTooltip: 'या जाहिरातीत कोणतीही अंतिम मुदत आढळली नाही',

    missingProfile: {
      message:
        'तुम्ही अजून तुमचे मुख्य प्रोफाइल तयार केलेले नाही. अपूर्ण माहितीची फील्ड्स तुमच्या तपशिलांची वाट पाहत आहेत. तुमची पात्रता तपासण्यासाठी एकदा तुमचे प्रोफाइल तयार करा किंवा आमचे बेंचमार्क विद्यार्थी प्रोफाइल लोड करा.',
      action: 'बेंचमार्क प्रोफाइल लोड करा (Alex Sharma)'
    },

    usage: {
      planUnlimited: 'योजना: {plan} • अमर्याद संधी तपासण्या सक्रिय',
      freeUsed: 'या महिन्यात {limit} पैकी {used} मोफत तपासण्या वापरल्या',
      remaining: '(रीसेटपूर्वी {remaining} शिल्लक)',
      upgrade:
        'अमर्याद तपासण्या आणि GitHub विश्लेषणासाठी स्टुडंट प्रीमियम (Rs 49/महिना) मध्ये अपग्रेड करा →',
      unlimitedActive: 'अमर्याद सक्रिय'
    },

    verdictLabel: 'ऑडिट निर्णय',
    summaryHeadline:
      '{matchCount} {matchLabel} · {mismatchCount} {mismatchLabel} · {missingCount} {missingLabel} → {verdict}',
    verdict: {
      ready: 'अर्जासाठी तयार',
      almost: 'अर्जासाठी जवळपास तयार',
      notReady: 'अजून अर्जासाठी तयार नाही'
    },
    readinessScoreLabel: 'तयारी गुण',
    whatIfNotSavedActual: 'काय-जर, जतन केलेले नाही · प्रत्यक्ष {score}%',
    hide: 'लपवा',
    showFormula: 'हा गुण कसा मोजला जातो',
    formulaLabel: 'सूत्र: ',

    scoreTable: {
      requirement: 'अट',
      weight: 'वजन',
      status: 'स्थिती',
      points: 'गुण',
      total: 'एकूण',
      required: 'आवश्यक',
      optional: 'ऐच्छिक'
    },

    whatIf: {
      banner: 'काय-जर, जतन केलेले नाही',
      clear: 'काय-जर साफ करा',
      counts:
        '{matchCount} {matchLabel} · {mismatchCount} {mismatchLabel} · {missingCount} {missingLabel} · गुण {score}%'
    },

    totalCriteria: '{total} एकूण निकषांचे मूल्यांकन',
    segmentTitle: '{count} {label} ({percent}%)',

    a11y: {
      score: 'तयारी गुण {score} टक्के',
      progress: '{matchCount} {matchLabel}, {mismatchCount} {mismatchLabel}, {missingCount} {missingLabel}'
    },

    audit: {
      title: 'तपशीलवार पात्रता ऑडिट तक्ता',
      description:
        'प्रत्येक नियम AI निर्णयाशिवाय सामान्य TypeScript मध्ये पारदर्शकपणे चालतो. अपूर्ण माहितीची फील्ड्स खाली इनलाइन दुरुस्त करता येतात.',
      requirement: 'अट',
      asks: 'संधीची मागणी',
      profile: 'तुमचे प्रोफाइल',
      status: 'स्थिती',
      reason: 'वापरलेल्या नियमासह कारण',
      specifiedInChecklist: 'चेकलिस्टमध्ये निर्दिष्ट',
      rulePrefix: 'नियम: {rule}',
      assumeFix: 'मी हे दुरुस्त करीन असे गृहीत धरा',
      whatIfNotSaved: 'काय-जर, जतन केलेले नाही',
      quickFix: 'झटपट दुरुस्ती:',
      defaultNextStep: 'पात्रता त्वरित सत्यापित करण्यासाठी ही माहिती द्या.'
    },

    placeholder: {
      link: 'https://github.com/username किंवा पोर्टफोलिओ',
      weeks: 'आठवडे (उदा. 8)',
      cgpa: 'CGPA (उदा. 8.2)',
      generic: 'अनुपलब्ध मूल्य प्रविष्ट करा'
    },

    fix: {
      saveLink: 'लिंक जतन करा',
      markDocumentReady: '✓ दस्तऐवज तयार म्हणून चिन्हांकित करा',
      setWeeks: 'आठवडे सेट करा',
      setYear: 'वर्ष सेट करा',
      setCgpa: 'CGPA सेट करा',
      update: 'अद्ययावत करा'
    },

    yearOption: {
      one: 'प्रथम वर्ष',
      two: 'द्वितीय वर्ष',
      three: 'तृतीय वर्ष',
      four: 'चतुर्थ वर्ष'
    },

    project: {
      title: 'सर्वोत्तम-योग्य प्रोजेक्ट हायलाइट',
      lead: 'या प्रोजेक्टने सुरुवात करा',
      matchOne: '{score} जुळणी',
      matchMany: '{score} जुळण्या'
    },

    nextSteps: {
      title: 'पुढील पायऱ्या आणि कृती योजना',
      description: 'सर्वात वेगवान दुरुस्ती आधी या क्रमाने. प्रयत्न लेबल अंदाजे अंदाज आहेत, वचन नाहीत.',
      allSatisfied: '✓ सर्व निकष पूर्णपणे पूर्ण झाले आहेत! तुम्ही आत्ताच अर्ज करण्यास तयार आहात.',
      stepLine: '{order}. [{status}] {title}: {action}',
      estimatedEffort: 'अंदाजे प्रयत्न',
      estimateSuffix: '~ {estimate} (अंदाज)',
      editProfile: 'मुख्य प्रोफाइल संपादित करा →',
      checkAnother: 'आणखी एक संधी तपासा'
    },

    effort: {
      year: { action: 'तुमचे अभ्यास वर्ष सेट करा', estimate: '1 मिनिट' },
      cgpa: { action: 'तुमचे CGPA जोडा', estimate: '2 मिनिटे' },
      'link:github': { action: 'GitHub लिंक जोडा', estimate: '5 मिनिटे' },
      'link:either': { action: 'GitHub किंवा पोर्टफोलिओ लिंक जोडा', estimate: '5 मिनिटे' },
      'link:linkedin': { action: 'LinkedIn लिंक जोडा', estimate: '5 मिनिटे' },
      'link:portfolio': { action: 'पोर्टफोलिओ लिंक जोडा', estimate: '10 मिनिटे' },
      'link:instagram': { action: 'Instagram लिंक जोडा', estimate: '5 मिनिटे' },
      'document:other': { action: 'दस्तऐवज अपलोड करा', estimate: '15 मिनिटे' },
      'document:resume': { action: 'तुमचा रेझ्युमे तयार करा', estimate: '30 मिनिटे' },
      availability: { action: 'तुमची उपलब्धता निश्चित करा', estimate: '5 मिनिटे' },
      projectCount: { action: 'प्रोजेक्ट जोडा', estimate: 'सुमारे 1 आठवडा' },
      projectTag: { action: 'जुळणारा प्रोजेक्ट जोडा', estimate: 'सुमारे 1 आठवडा' },
      skills: { action: '{skills} च्या मूलभूत गोष्टी शिका', estimate: 'सुमारे 2 आठवडे' },
      deadline: { action: 'अंतिम मुदतीपूर्वी सबमिट करा', estimate: '1 मिनिट' },
      'custom:income': { action: 'कुटुंबाची उत्पन्न तपशील जोडा', estimate: '5 मिनिटे' },
      'custom:generic': { action: 'अनुपलब्ध पुरावा द्या', estimate: '10 मिनिटे' }
    },

    agents: {
      eyebrow: 'AI पुरावा आणि सखोल विश्लेषण',
      premiumUnlocked: 'प्रीमियम अनलॉक',
      studentFeature: 'स्टुडंट प्रीमियम सुविधा',
      title: 'एजंट संशोधन आणि GitHub पुरावा काढणी',
      descriptionUnlocked:
        'AI एजंट उमेदवाराच्या रिपॉझिटरी कमिट, सत्यापित पुरावा आर्टिफॅक्ट आणि थेट नियोक्ता वैधता तपासतात.',
      descriptionLocked:
        'मोफत श्रेणीत वरील 100% निर्धारक नियम सत्यापन समाविष्ट आहे. सखोल रिपॉझिटरी पुरावा, नियोक्ता वैधता तपासणी आणि अनुकूलित ATS दस्तऐवज टेम्पलेट अनलॉक करण्यासाठी स्टुडंट प्रीमियममध्ये अपग्रेड करा.',
      upgrade: 'अनलॉकसाठी अपग्रेड करा (Rs 49/महिना) →',
      source: 'स्रोत',
      noSource: 'स्रोत लिंक नाही — मोजता येत नाही',
      invariantLabel: 'एजंट अपरिवर्तनीय नियम:',
      invariantBody:
        'AI एजंट फक्त सुचवतात. वरील पारदर्शक नियम इंजिनने अंतिम पात्रता निर्णय घेतला. AI-सुचवलेले असे चिन्हांकित केलेल्या गोष्टीसाठी तुमची पुष्टी आवश्यक आहे, आणि स्रोत लिंक नसलेली वस्तुस्थिती कधीही मोजली जात नाही.',
      preview: {
        githubTitle: '🔒 GitHub रिपॉझिटरी पुरावा',
        githubDesc:
          'तांत्रिक कौशल्य दाव्यांची पुष्टी करण्यासाठी कमिट इतिहास, पुल विनंत्या आणि सत्यापित रिपॉझिटरी तपासतो.',
        employerTitle: '🔒 थेट वेब नियोक्ता संशोधन',
        employerDesc:
          'नियोक्ता डोमेन इतिहास, भर्तीकर्ता वैधता तपासतो आणि फसव्या जाहिरातींविरुद्ध छाननी करतो.',
        atsTitle: '🔒 ATS दस्तऐवज टेम्पलेट',
        atsDesc:
          'या जाहिरातीसाठी कीवर्ड-लक्ष्यित रेझ्युमे बुलेट पॉइंट्स आणि दस्तऐवज चेकलिस्ट टेम्पलेट तयार करतो.',
        available: 'स्टुडंट प्रीमियमवर उपलब्ध'
      },
      modules: {
        github: {
          title: 'GitHub रेपो विश्लेषण',
          repository: 'रिपॉझिटरी',
          commits: 'कमिट',
          languages: 'भाषा',
          note: 'जाहिरातीतील पोर्टफोलिओ अटीशी जुळते.'
        },
        employer: {
          title: 'नियोक्ता वैधता',
          employer: 'नियोक्ता',
          domainAge: 'डोमेन वय',
          note: 'कोणतीही स्रोत लिंक कॅप्चर झाली नाही, त्यामुळे हा दावा अजून मोजता येत नाही.'
        },
        ats: {
          title: 'ATS दस्तऐवज टेम्पलेट',
          keywordMatch: 'कीवर्ड जुळणी',
          actionVerbs: 'क्रियापदे',
          note: 'तुमच्या अर्ज दस्तऐवजांसाठी तयार शब्दरचना.'
        }
      }
    },

    notices: {
      loadedSample: 'बेंचमार्क विद्यार्थी प्रोफाइल लोड केले (Alex Sharma). त्वरित पुनर्मूल्यांकन केले.',
      updatedProfile: '"{title}" सह प्रोफाइल अद्ययावत केले. स्थिती त्वरित पुनर्गणित केली.',
      pdfDownloaded: 'चेकलिस्ट PDF डाउनलोड झाली.',
      pdfFailed: 'या ब्राउझरमध्ये आम्हाला PDF तयार करता आली नाही.',
      noDeadline: 'या जाहिरातीत वाचता येणारी तारीख नाही, म्हणून कॅलेंडर स्मरणपत्र तयार केले नाही.',
      calendarDownloaded: 'कॅलेंडर फाइल डाउनलोड झाली, 3 दिवस आणि 1 दिवस आधी स्मरणपत्रांसह.',
      calendarFailed: 'या अंतिम मुदतीसाठी आम्हाला कॅलेंडर फाइल तयार करता आली नाही.',
      linkCopied: 'फक्त-वाचनीय लिंक कॉपी झाली. ती 7 दिवसांत संपते आणि तुम्ही ती ट्रॅकरमध्ये रद्द करू शकता.',
      linkCreated: 'फक्त-वाचनीय लिंक तयार केली: {link}',
      linkFailed: 'आत्ता आम्हाला शेअर लिंक तयार करता आली नाही.',
      exported: 'हा निकाल आणि तुमचे प्रोफाइल JSON म्हणून निर्यात केले.'
    }
  }
};

const module_ = { en, hi, mr };
export default module_;
