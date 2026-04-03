// === MULTI-LANGUAGE SUPPORT ===

const translations = {
    en: {
        // Navigation
        dashboard: "Dashboard",
        scanner: "AI Scanner",
        analytics: "Analytics",
        history: "History",
        chat: "AI Chat",
        assistant: "AI Assistant",
        logout: "Logout",

        // Dashboard
        welcome: "Hello",
        welcomeAdmin: "Welcome, System Admin",
        helloFarmer: "Hello, Farmer! 👋",
        farmerOverview: "Your smart farm overview.",
        totalScans: "Total Scans",
        healthyScans: "Healthy",
        infectedScans: "Infected",
        alerts: "Alerts",
        efficiency: "Efficiency",
        moisture: "Moisture",
        scanDetails: "Scan Details",
        detailedAnalytics: "Detailed Analytics",
        weatherAlert: "Weather Alert: Heavy rain expected in next 24 hours.",
        weatherAdvice: "Delay irrigation and cover harvested crops.",

        // Scanner
        scanTitle: "AI Disease Detection",
        scanSubtitle: "Upload image or use camera",
        upload: "Upload",
        camera: "Camera",
        link: "Link",
        selectImage: "Select image from gallery",
        startCamera: "Start Camera",
        capture: "Capture",
        pasteUrl: "Paste Image URL",
        load: "Load",
        analyze: "🔍 Analyze Now",
        processing: "Processing...",

        // Results
        healthy: "Crop is Healthy! 🌱",
        healthyAdvice: "Great job! Keep monitoring.",
        identifiedDisease: "Identified Disease",
        treatmentPlan: "Treatment Plan",
        immediateActions: "Immediate Actions",
        preventiveCare: "Preventive Care",

        // Disease Names
        tomatoLeafBlight: "Tomato Leaf Blight",
        powderyMildew: "Powdery Mildew",
        earlyBlight: "Early Blight",
        lateBlight: "Late Blight",
        fungalInfection: "Fungal Infection",
        bacterialInfection: "Bacterial Infection",
        whiteSpotDisease: "White Spot Disease",
        septoriaLeafSpot: "Septoria Leaf Spot",

        // Treatment Actions
        removeInfectedLeaves: "Remove and destroy all infected leaves immediately",
        dontCompostMaterial: "Do not compost infected plant material",
        sanitizeTools: "Sanitize pruning tools after each use",
        sprayFungicide: "Spray copper-based fungicide",
        ensureSpacing: "Ensure proper spacing between plants for air circulation",
        avoidOverheadWatering: "Avoid overhead watering - use drip irrigation",
        applyMulch: "Apply mulch to prevent soil splash on leaves",
        improveAirCirculation: "Improve air circulation around plants",
        removeAffectedParts: "Remove affected plant parts immediately",
        destroyDebris: "Destroy plant debris after harvesting",
        useResistantVarieties: "Use disease-resistant crop varieties",
        cropRotation: "Follow crop rotation practice",

        // Fungicides & Treatments
        copperOxychloride: "Copper Oxychloride 50% WP @ 3g/liter",
        mancozeb: "Mancozeb 75% WP @ 2.5g/liter",
        sulfur: "Sulfur-based fungicide",
        bordeauxMixture: "Bordeaux Mixture 1%",
        repeatApplication: "Repeat application every 7-10 days for 3 weeks",

        // Healthy Crop Messages
        currentStatus: "Current Status",
        excellentHealth: "Your crop is in excellent health",
        noSignsDisease: "No signs of disease or pest infestation detected",
        maintenanceTips: "Maintenance Tips",
        maintainWatering: "Maintain regular watering schedule",
        ensureDrainage: "Ensure proper drainage to prevent waterlogging",
        balancedFertilizer: "Apply balanced fertilizer as per crop requirements",
        monitoring: "Monitoring",
        checkPlantsWeekly: "Check plants weekly for early signs of pests",
        inspectLeaves: "Inspect leaves for discoloration or spots",
        monitorMoisture: "Monitor soil moisture levels regularly",

        // Disease Detection Messages
        identifiedProblem: "Identified Problem",
        tomatoLeafBlightDetected: "Tomato Leaf Blight (Early Blight) detected",
        requiresAttention: "Requires immediate attention to prevent crop damage",
        chemicalTreatment: "Chemical Treatment",
        sprayMorningEvening: "Spray during early morning or late evening",
        fieldManagement: "Field Management",
        removeInfectedImmediately: "Remove infected leaves immediately",
        sanitizeAfterUse: "Sanitize pruning tools",
        monitorFieldRegularly: "Monitor field regularly (every 3-4 days)",
        preventiveMeasures: "Preventive Measures",
        useResistantNextSeason: "Use resistant varieties in next season",

        // Fertilizer
        fertilizerCalc: "Fertilizer Calculator",
        selectCrop: "Select Crop",
        unit: "Unit",
        size: "Size",
        calculate: "Calculate Dose",
        recommendedDose: "Recommended Dose:",

        // Chat
        chatTitle: "AI Farming Assistant",
        chatPlaceholder: "Ask your farming question...",
        send: "Send",
        quickReplies: "Quick Questions:",

        // Export
        exportPdf: "Export as PDF",
        exportSuccess: "PDF exported successfully!",

        // Common
        close: "Close",
        date: "Date & Time"
    },

    hi: {
        // Navigation
        dashboard: "डैशबोर्ड",
        scanner: "AI स्कैनर",
        analytics: "विश्लेषण",
        history: "इतिहास",
        chat: "AI चैट",
        assistant: "AI सहायक",
        logout: "लॉग आउट",

        // Dashboard
        welcome: "नमस्ते",
        welcomeAdmin: "स्वागत है, सिस्टम एडमिन",
        helloFarmer: "नमस्ते, किसान! 👋",
        farmerOverview: "आपका स्मार्ट फार्म अवलोकन।",
        totalScans: "कुल स्कैन",
        healthyScans: "स्वस्थ",
        infectedScans: "संक्रमित",
        alerts: "अलर्ट",
        efficiency: "दक्षता",
        moisture: "नमी",
        scanDetails: "स्कैन विवरण",
        detailedAnalytics: "विस्तृत विश्लेषण",
        weatherAlert: "मौसम अलर्ट: अगले 24 घंटों में भारी बारिश की संभावना।",
        weatherAdvice: "सिंचाई में देरी करें और कटी हुई फसलों को ढकें।",

        // Scanner
        scanTitle: "AI रोग पहचान",
        scanSubtitle: "छवि अपलोड करें या कैमरा उपयोग करें",
        upload: "अपलोड",
        camera: "कैमरा",
        link: "लिंक",
        selectImage: "गैलरी से छवि चुनें",
        startCamera: "कैमरा शुरू करें",
        capture: "कैप्चर करें",
        pasteUrl: "छवि URL पेस्ट करें",
        load: "लोड करें",
        analyze: "🔍 विश्लेषण करें",
        processing: "प्रोसेसिंग...",

        // Results
        healthy: "फसल स्वस्थ है! 🌱",
        healthyAdvice: "बहुत अच्छा! निगरानी जारी रखें।",
        identifiedDisease: "पहचाना गया रोग",
        treatmentPlan: "उपचार योजना",
        immediateActions: "तत्काल कार्रवाई",
        preventiveCare: "रोकथाम देखभाल",

        // Disease Names
        tomatoLeafBlight: "टमाटर पत्ती झुलसा",
        powderyMildew: "पाउडरी मिल्ड्यू",
        earlyBlight: "प्रारंभिक झुलसा",
        lateBlight: "देर झुलसा",
        fungalInfection: "फंगल संक्रमण",
        bacterialInfection: "जीवाणु संक्रमण",
        whiteSpotDisease: "सफेद धब्बा रोग",
        septoriaLeafSpot: "सेप्टोरिया पत्ती धब्बा",

        // Treatment Actions
        removeInfectedLeaves: "सभी संक्रमित पत्तियों को तुरंत हटाएं और नष्ट करें",
        dontCompostMaterial: "संक्रमित पौधे की सामग्री को खाद न बनाएं",
        sanitizeTools: "प्रत्येक उपयोग के बाद छंटाई उपकरणों को कीटाणुरहित करें",
        sprayFungicide: "तांबा आधारित कवकनाशी स्प्रे करें",
        ensureSpacing: "पौधों के बीच हवा के संचार के लिए उचित दूरी सुनिश्चित करें",
        avoidOverheadWatering: "ओवरहेड सिंचाई से बचें - ड्रिप सिंचाई का उपयोग करें",
        applyMulch: "पत्तियों पर मिट्टी के छींटे को रोकने के लिए मल्च लगाएं",
        improveAirCirculation: "पौधों के चारों ओर हवा का संचार बेहतर करें",
        removeAffectedParts: "संक्रमित पौधे के हिस्सों को तुरंत हटाएं",
        destroyDebris: "कटाई के बाद पौधे के मलबे को नष्ट करें",
        useResistantVarieties: "रोग प्रतिरोधी फसल की किस्मों का उपयोग करें",
        cropRotation: "फसल चक्र क्रम का पालन करें",

        // Fungicides & Treatments
        copperOxychloride: "कॉपर ऑक्सीक्लोराइड 50% WP @ 3g/लीटर",
        mancozeb: "मैनकोज़ेब 75% WP @ 2.5g/लीटर",
        sulfur: "सल्फर आधारित कवकनाशी",
        bordeauxMixture: "बोर्डो मिश्रण 1%",
        repeatApplication: "3 सप्ताह के लिए हर 7-10 दिन में दोहराएं",

        // Healthy Crop Messages
        currentStatus: "वर्तमान स्थिति",
        excellentHealth: "आपकी फसल उत्कृष्ट स्वास्थ्य में है",
        noSignsDisease: "कोई रोग या कीट संक्रमण का संकेत नहीं पाया गया",
        maintenanceTips: "रखरखाव टिप्स",
        maintainWatering: "नियमित सिंचाई अनुसूची बनाए रखें",
        ensureDrainage: "जलभराव को रोकने के लिए उचित जल निकासी सुनिश्चित करें",
        balancedFertilizer: "फसल की आवश्यकताओं के अनुसार संतुलित खाद लागू करें",
        monitoring: "निगरानी",
        checkPlantsWeekly: "कीटों के शुरुआती संकेतों के लिए साप्ताहिक रूप से पौधों की जांच करें",
        inspectLeaves: "पत्तियों को परिवर्तन या धब्बों के लिए निरीक्षण करें",
        monitorMoisture: "नियमित रूप से मिट्टी की नमी की निगरानी करें",

        // Disease Detection Messages
        identifiedProblem: "पहचानी गई समस्या",
        tomatoLeafBlightDetected: "टमाटर पत्ती झुलसा (प्रारंभिक झुलसा) का पता चला",
        requiresAttention: "फसल के नुकसान को रोकने के लिए तत्काल ध्यान देने की आवश्यकता है",
        chemicalTreatment: "रासायनिक उपचार",
        sprayMorningEvening: "सुबह जल्दी या शाम को स्प्रे करें",
        fieldManagement: "खेत प्रबंधन",
        removeInfectedImmediately: "संक्रमित पत्तियों को तुरंत हटाएं",
        sanitizeAfterUse: "छंटाई उपकरणों को कीटाणुरहित करें",
        monitorFieldRegularly: "नियमित रूप से खेत की निगरानी करें (हर 3-4 दिन)",
        preventiveMeasures: "निवारक उपाय",
        useResistantNextSeason: "अगले मौसम में प्रतिरोधी किस्मों का उपयोग करें",

        // Fertilizer
        fertilizerCalc: "उर्वरक कैलकुलेटर",
        selectCrop: "फसल चुनें",
        unit: "इकाई",
        size: "आकार",
        calculate: "खुराक गणना करें",
        recommendedDose: "अनुशंसित खुराक:",

        // Chat
        chatTitle: "AI खेती सहायक",
        chatPlaceholder: "अपना खेती से संबंधित सवाल पूछें...",
        send: "भेजें",
        quickReplies: "त्वरित प्रश्न:",

        // Export
        exportPdf: "PDF के रूप में निर्यात करें",
        exportSuccess: "PDF सफलतापूर्वक निर्यात किया गया!",

        // Common
        close: "बंद करें",
        date: "तारीख और समय"
    },

    pa: {
        // Navigation (Punjabi)
        dashboard: "ਡੈਸ਼ਬੋਰਡ",
        scanner: "AI ਸਕੈਨਰ",
        analytics: "ਵਿਸ਼ਲੇਸ਼ਣ",
        history: "ਇਤਿਹਾਸ",
        chat: "AI ਚੈਟ",
        assistant: "AI ਸਹਾਇਕ",
        logout: "ਲਾਗ ਆਉਟ",

        // Dashboard
        welcome: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ",
        welcomeAdmin: "ਜੀ ਆਇਆਂ ਨੂੰ, ਸਿਸਟਮ ਐਡਮਿਨ",
        helloFarmer: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਕਿਸਾਨ! 👋",
        farmerOverview: "ਤੁਹਾਡੀ ਸ਼ਾਨਦਾਰ ਫਾਰਮ ਦਾ ਜਾਇਜ਼ਾ।",
        totalScans: "ਕੁੱਲ ਸਕੈਨ",
        healthyScans: "ਸਿਹਤਮੰਦ",
        infectedScans: "ਸੰਕਰਮਿਤ",
        alerts: "ਚੇਤਾਵਨੀਆਂ",
        efficiency: "ਕੁਸ਼ਲਤਾ",
        moisture: "ਨਮੀ",
        scanDetails: "ਸਕੈਨ ਵੇਰਵੇ",
        detailedAnalytics: "ਵਿਸਤਰਿਤ ਵਿਸ਼ਲੇਸ਼ਣ",
        weatherAlert: "ਮੌਸਮ ਚੇਤਾਵਨੀ: ਅਗਲੇ 24 ਘੰਟਿਆਂ ਵਿੱਚ ਭਾਰੀ ਬਾਰਿਸ਼ ਦੀ ਸੰਭਾਵਨਾ।",
        weatherAdvice: "ਸਿੰਚਾਈ ਵਿੱਚ ਦੇਰੀ ਕਰੋ ਅਤੇ ਕੱਟੀ ਹੋਈ ਫਸਲ ਨੂੰ ਢੱਕੋ।",

        // Scanner
        scanTitle: "AI ਰੋਗ ਪਛਾਣ",
        scanSubtitle: "ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ ਜਾਂ ਕੈਮਰਾ ਵਰਤੋ",
        upload: "ਅੱਪਲੋਡ",
        camera: "ਕੈਮਰਾ",
        link: "ਲਿੰਕ",
        selectImage: "ਗੈਲਰੀ ਤੋਂ ਤਸਵੀਰ ਚੁਣੋ",
        startCamera: "ਕੈਮਰਾ ਸ਼ੁਰੂ ਕਰੋ",
        capture: "ਕੈਪਚਰ ਕਰੋ",
        pasteUrl: "ਤਸਵੀਰ URL ਪੇਸਟ ਕਰੋ",
        load: "ਲੋਡ ਕਰੋ",
        analyze: "🔍 ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ",
        processing: "ਪ੍ਰੋਸੈਸਿੰਗ...",

        // Results
        healthy: "ਫਸਲ ਸਿਹਤਮੰਦ ਹੈ! 🌱",
        healthyAdvice: "ਬਹੁਤ ਵਧੀਆ! ਨਿਗਰਾਨੀ ਜਾਰੀ ਰੱਖੋ।",
        identifiedDisease: "ਪਛਾਣਿਆ ਗਿਆ ਰੋਗ",
        treatmentPlan: "ਇਲਾਜ ਯੋਜਨਾ",
        immediateActions: "ਫੌਰੀ ਕਾਰਵਾਈ",
        preventiveCare: "ਰੋਕਥਾਮ ਦੇਖਭਾਲ",

        // Disease Names
        tomatoLeafBlight: "ਟਮਾਟਰ ਪੱਤੇ ਦੀ ਝੁਲਸ",
        powderyMildew: "ਪाউਡਰੀ ਮਿਲਡਿਊ",
        earlyBlight: "ਜਲਦੀ ਝੁਲਸ",
        lateBlight: "ਦੇਰ ਝੁਲਸ",
        fungalInfection: "ਫੰਗਲ ਲਾਗ",
        bacterialInfection: "ਬੈਕਟੀਰੀਆਲ ਲਾਗ",
        whiteSpotDisease: "ਸਫੇਦ ਬਿੰਦੀ ਦਾ ਰੋਗ",
        septoriaLeafSpot: "ਸੇਪਟੋਰੀਆ ਪੱਤਾ ਬਿੰਦੀ",

        // Treatment Actions
        removeInfectedLeaves: "ਸੰਕਰਮਿਤ ਪੱਤਿਆਂ ਨੂੰ ਤੁਰੰਤ ਹਟਾਓ ਅਤੇ ਨਸ਼ਟ ਕਰੋ",
        dontCompostMaterial: "ਸੰਕਰਮਿਤ ਪੌਦੇ ਦੀ ਸਮੱਗਰੀ ਨੂੰ ਖਾਦ ਨਾ ਬਣਾਓ",
        sanitizeTools: "ਹਰ ਵਰਤੋਂ ਤੋਂ ਬਾਅਦ ਕੱਟਣ ਦੇ ਔਜ਼ਾਰਾਂ ਨੂੰ ਜਰਮ-ਮੁਕਤ ਕਰੋ",
        sprayFungicide: "ਤਾਂਬੇ ਦੀ ਬੁਨਿਆਦ 'ਤੇ ਫੰਗਸਾਈਡ ਸਪ੍ਰੇ ਕਰੋ",
        ensureSpacing: "ਹਵਾ ਦੀ ਗਤੀਸ਼ੀਲਤਾ ਲਈ ਪੌਦਿਆਂ ਦੇ ਵਿਚਕਾਰ ਸਹੀ ਦੂਰੀ ਯਕੀਨੀ ਬਣਾਓ",
        avoidOverheadWatering: "ਓਵਰਹੈੱਡ ਸਿਖਲਾਈ ਤੋਂ ਬਚੋ - ਡ੍ਰਿਪ ਸਿਖਲਾਈ ਦੀ ਵਰਤੋ ਕਰੋ",
        applyMulch: "ਪੱਤਿਆਂ ਵਿੱਚ ਮਿੱਟੀ ਦੀ ਛਿੜਕਾਅ ਨੂੰ ਰੋਕਣ ਲਈ ਮਲਚ ਲਾਵੋ",
        improveAirCirculation: "ਪੌਦਿਆਂ ਦੁਆਲੇ ਹਵਾ ਦੀ ਗਤੀਸ਼ੀਲਤਾ ਵਿੱਚ ਸੁਧਾਰ ਕਰੋ",
        removeAffectedParts: "ਪ੍ਰਭਾਵਿਤ ਪੌਦੇ ਦੇ ਹਿੱਸਿਆਂ ਨੂੰ ਤੁਰੰਤ ਹਟਾਓ",
        destroyDebris: "ਕਟਾਈ ਤੋਂ ਬਾਅਦ ਪੌਦੇ ਦੇ ਰਲ-ਪੁੱਲ ਨੂੰ ਨਸ਼ਟ ਕਰੋ",
        useResistantVarieties: "ਰੋਗ ਪ੍ਰਤਿਰੋਧੀ ਫਸਲ ਦੀਆਂ ਕਿਸਮਾਂ ਵਰਤੋ",
        cropRotation: "ਫਸਲ ਬਦਲਮ ਅਭਿਆਸ ਇਸਤਾਰ ਕਰੋ",

        // Fungicides & Treatments
        copperOxychloride: "ਕਾਪਰ ਆਕਸੀਕਲੋਰਾਈਡ 50% WP @ 3g/ਲੀਟਰ",
        mancozeb: "ਮੈਂਕੋਜ਼ੇਬ 75% WP @ 2.5g/ਲੀਟਰ",
        sulfur: "ਸਲਫਰ-ਨਿਆਂ ਫੰਗਸਾਈਡ",
        bordeauxMixture: "ਬੋਰਡੋ ਮਿਸ਼ਰਣ 1%",
        repeatApplication: "3 ਹਫ਼ਤਿਆਂ ਲਈ ਹਰ 7-10 ਦਿਨਾਂ ਵਿੱਚ ਦੁਹਰਾਓ",

        // Healthy Crop Messages
        currentStatus: "ਮੌਜੂਦਾ ਸਥਿਤੀ",
        excellentHealth: "ਤੁਹਾਡੀ ਫਸਲ ਬਹੁਤ ਵਧੀਆ ਸਿਹਤ ਵਿੱਚ ਹੈ",
        noSignsDisease: "ਨਾ ਤਾਂ ਕੋਈ ਰੋਗ ਅਤੇ ਨਾ ਹੀ ਕੀਟ ਸੰਕ੍ਰਮਣ ਦਾ ਸੰਕੇਤ ਮਿਲਿਆ",
        maintenanceTips: "ਰਖ-ਰਖਾਅ ਸੁਝਾਅ",
        maintainWatering: "ਨਿਯਮਿਤ ਸਿੰਚਾਈ ਸਮਾਰਤਾ ਬਣਾਈ ਰੱਖੋ",
        ensureDrainage: "ਜਲਭਰਾਅ ਰੋਕਣ ਲਈ ਢੁੱਕਵੀਂ ਜਲ ਜਮਾਵ ਨਿਸ਼ਚਿਤ ਕਰੋ",
        balancedFertilizer: "ਫਸਲ ਦੀ ਲੋੜ ਦੇ ਅਨੁਸਾਰ ਸੰਤੁਲਿਤ ਖਾਦ ਲਾਓ",
        monitoring: "ਨਿਗਰਾਨੀ",
        checkPlantsWeekly: "ਕੀਟਾਂ ਦੇ ਸ਼ੁਰੂਆਤੀ ਸੰਕੇਤਾਂ ਲਈ ਹਫ਼ਤਾਵਾਰੀ ਪੌਦਿਆਂ ਦੀ ਜਾਂਚ ਕਰੋ",
        inspectLeaves: "ਪੱਤੀਆਂ ਦਾ ਮੁਆਇਨਾ ਪਰਿਵਰਤਨ ਜ ਸਥਾਨਾਂ ਲਈ ਕਰੋ",
        monitorMoisture: "ਵਾ ਮਾਟੀ ਦੀ ਨਮੀ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ",

        // Disease Detection Messages
        identifiedProblem: "ਪਛਾਣਿਆ ਗਿਆ ਸਮੱਸਿਆ",
        tomatoLeafBlightDetected: "ਟਮਾਟਰ ਪੱਤੀ ਝੁਲਸਾ (ਸ਼ੁਰੂਆਤੀ ਝੁਲਸਾ) ਦਾ ਪਤਾ ਚਲਿਆ",
        requiresAttention: "ਫਸਲ ਦਾ ਨੁਕਸਾਨ ਰੋਕਣ ਲਈ ਖਾਤਮੀ ਧਿਆਨ ਦੀ ਲੋੜ ਹੈ",
        chemicalTreatment: "ਰਾਸਾਇਣਿਕ ਇਲਾਜ",
        sprayMorningEvening: "ਸਵੇਰੇ ਜਲਦੀ ਦਿਮਕੋਈ ਜ ਸ਼ਾਮ ਨੂੰ ਸਪ੍ਰੇ ਕਰੋ",
        fieldManagement: "ਖੇਤਰ ਪ੍ਰਬੰਧਨ",
        removeInfectedImmediately: "ਸੰਕਰਮਿਤ ਪੱਤੀਆ ਨੂੰ ਖਾਲ ਮਗਲ ਹਟਾਓ",
        sanitizeAfterUse: "ਕੱਟਣ ਦੇ ਹਥਿਆਰਾਂ ਨੂੰ ਕਾਫਲ ਕਰੋ",
        monitorFieldRegularly: "ਨਿਯਮਿਤ ਤੌਰ ਤੇ ਖੇਤ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ (ਹਰ 3-4 ਦਿਨ)",
        preventiveMeasures: "ਰੋਕਥਾਮ ਦੇ ਉਪਾਅ",
        useResistantNextSeason: "ਅਗਲੇ ਮੌਸਮ ਵਿੱਚ ਪ੍ਰਤੀਰੋਧੀ ਕਿਸਮਾਂ ਦਾ ਸੰਜੋਗ ਕਰੋ",

        // Fertilizer
        fertilizerCalc: "ਖਾਦ ਕੈਲਕੁਲੇਟਰ",
        selectCrop: "ਫਸਲ ਚੁਣੋ",
        unit: "ਇਕਾਈ",
        size: "ਆਕਾਰ",
        calculate: "ਖੁਰਾਕ ਦੀ ਗਣਨਾ ਕਰੋ",
        recommendedDose: "ਸਿਫਾਰਿਸ਼ ਕੀਤੀ ਖੁਰਾਕ:",

        // Chat
        chatTitle: "AI ਖੇਤੀ ਸਹਾਇਕ",
        chatPlaceholder: "ਆਪਣਾ ਖੇਤੀ ਸਵਾਲ ਪੁੱਛੋ...",
        send: "ਭੇਜੋ",
        quickReplies: "ਤੇਜ਼ ਸਵਾਲ:",

        // Export
        exportPdf: "PDF ਵਜੋਂ ਐਕਸਪੋਰਟ ਕਰੋ",
        exportSuccess: "PDF ਸਫਲਤਾਪੂਰਵਕ ਐਕਸਪੋਰਟ ਕੀਤਾ ਗਿਆ!",

        // Common
        close: "ਬੰਦ ਕਰੋ",
        date: "ਮਿਤੀ ਅਤੇ ਸਮਾਂ"
    },

    mr: {
        // Navigation (Marathi)
        dashboard: "डॅशबोर्ड",
        scanner: "AI स्कॅनर",
        analytics: "विश्लेषण",
        history: "इतिहास",
        chat: "AI चॅट",
        assistant: "AI सहाय्यक",
        logout: "लॉग आउट",

        // Dashboard
        welcome: "नमस्कार",
        welcomeAdmin: "स्वागत आहे, सिस्टम अॅडमिन", helloFarmer: "नमस्कार, शेतकरी! 👋",
        farmerOverview: "तुमचा स्मार्ट फार्म विहंगावलोकन।", totalScans: "एकूण स्कॅन",
        healthyScans: "निरोगी",
        infectedScans: "संक्रमित",
        alerts: "सूचना",
        efficiency: "कार्यक्षमता",
        moisture: "आर्द्रता",
        scanDetails: "स्कॅन तपशील",
        detailedAnalytics: "तपशीलवार विश्लेषण",
        weatherAlert: "हवामान सूचना: पुढील 24 तासांत मुसळधार पाऊस अपेक्षित.",
        weatherAdvice: "सिंचन उशीर करा आणि कापणी केलेली पिके झाकून ठेवा.",

        // Scanner
        scanTitle: "AI रोग ओळख",
        scanSubtitle: "प्रतिमा अपलोड करा किंवा कॅमेरा वापरा",
        upload: "अपलोड",
        camera: "कॅमेरा",
        link: "लिंक",
        selectImage: "गॅलरीमधून प्रतिमा निवडा",
        startCamera: "कॅमेरा सुरू करा",
        capture: "कॅप्चर करा",
        pasteUrl: "प्रतिमा URL पेस्ट करा",
        load: "लोड करा",
        analyze: "🔍 विश्लेषण करा",
        processing: "प्रक्रिया चालू आहे...",

        // Results
        healthy: "पीक निरोगी आहे! 🌱",
        healthyAdvice: "उत्तम! निरीक्षण सुरू ठेवा.",
        identifiedDisease: "ओळखलेला रोग",
        treatmentPlan: "उपचार योजना",
        immediateActions: "तात्काळ कार्रवाई",
        preventiveCare: "प्रतिबंधक काळजी",

        // Disease Names
        tomatoLeafBlight: "टोमॅटो पत्र विलायिका",
        powderyMildew: "पाउडर मिल्ड्यू",
        earlyBlight: "लवकर विलायिका",
        lateBlight: "उशीर विलायिका",
        fungalInfection: "बुरशी संक्रमण",
        bacterialInfection: "जीवाणू संक्रमण",
        whiteSpotDisease: "पांढऱ्या डाग रोग",
        septoriaLeafSpot: "सेप्टोरिया पत्र डाग",

        // Treatment Actions
        removeInfectedLeaves: "सर्व संक्रमित पत्रे लगेच हटवा आणि नष्ट करा",
        dontCompostMaterial: "संक्रमित वनस्पती सामग्री खतात न करा",
        sanitizeTools: "प्रत्येक वापराच्या नंतर छाननी साहित्य जीवाणुरहित करा",
        sprayFungicide: "तांब्याच्या आधारावर बुरशीनाशक फवारणी करा",
        ensureSpacing: "हवेच्या संचारासाठी वनस्पतींमध्ये योग्य अंतर सुनिश्चित करा",
        avoidOverheadWatering: "ओव्हरहेड सिंचन टाळा - ड्रिप सिंचन वापरा",
        applyMulch: "पत्रांवर मातीचा छर्र रोखण्यासाठी मल्च लावा",
        improveAirCirculation: "वनस्पतीभोवती हवेच्या संचारात सुधारणा करा",
        removeAffectedParts: "प्रभावित वनस्पती भाग लगेच हटवा",
        destroyDebris: "कापणीनंतर वनस्पती मलबा नष्ट करा",
        useResistantVarieties: "रोग-प्रतिरोधक पीक जातीचा वापर करा",
        cropRotation: "पीक रोटेशन सराव पालन करा",

        // Fungicides & Treatments
        copperOxychloride: "तांबा ऑक्सीक्लोराइड 50% WP @ 3g/लीटर",
        mancozeb: "मॅनकोजेब 75% WP @ 2.5g/लीटर",
        sulfur: "सल्फर-आधारित बुरशीनाशक",
        bordeauxMixture: "बोर्डेक्स मिश्रण 1%",
        repeatApplication: "3 आठवड्यांसाठी प्रत्येक 7-10 दिवसांनी पुनरावृत्ती करा",

        // Healthy Crop Messages
        currentStatus: "वर्तमान स्थिति",
        excellentHealth: "तुमची पीक उत्कृष्ट आरोग्यात आहे",
        noSignsDisease: "कोणतेही रोग किंवा कीटक संक्रमणाचे संकेत आढळले नाहीत",
        maintenanceTips: "देखभाल सूचना",
        maintainWatering: "नियमित सिंचन वेळापत्रक राखून ठेवा",
        ensureDrainage: "जलतापन रोखण्यासाठी योग्य जल निकासी सुनिश्चित करा",
        balancedFertilizer: "पीकची आवश्यकता यानुसार संतुलित खत लागू करा",
        monitoring: "निरीक्षण",
        checkPlantsWeekly: "कीटकांच्या प्रथम संकेतांसाठी साप्ताहिक वनस्पतीची तपासणी करा",
        inspectLeaves: "बदल किंवा डाग्यांसाठी पत्रांची परीक्षा करा",
        monitorMoisture: "नियमितपणे मातीची आर्द्रता निरीक्षण करा",

        // Disease Detection Messages
        identifiedProblem: "ओळखलेली समस्या",
        tomatoLeafBlightDetected: "टोमॅटो पत्र झुलशा (प्रारंभिक झुलशा) आढळले",
        requiresAttention: "पीकचे नुकसान रोखण्यासाठी तात्काळ लक्ष देण्याची आवश्यकता आहे",
        chemicalTreatment: "रासायनिक उपचार",
        sprayMorningEvening: "सकाळी लवकर किंवा संध्याकाळी फवारणी करा",
        fieldManagement: "क्षेत्र व्यवस्थापन",
        removeInfectedImmediately: "संक्रमित पत्रे लगेच हटवा",
        sanitizeAfterUse: "छाननी साधने निर्जंतुक करा",
        monitorFieldRegularly: "नियमितपणे क्षेत्राचे निरीक्षण करा (प्रत्येक 3-4 दिवस)",
        preventiveMeasures: "प्रतिबंधात्मक उपाय",
        useResistantNextSeason: "पुढील हंगामात प्रतिरोधक जाती वापरा",

        // Fertilizer
        fertilizerCalc: "खत कॅल्क्युलेटर",
        selectCrop: "पीक निवडा",
        unit: "एकक",
        size: "आकार",
        calculate: "डोस गणना करा",
        recommendedDose: "शिफारस केलेला डोस:",

        // Chat
        chatTitle: "AI शेती सहाय्यक",
        chatPlaceholder: "तुमचा शेती प्रश्न विचारा...",
        send: "पाठवा",
        quickReplies: "द्रुत प्रश्न:",

        // Export
        exportPdf: "PDF म्हणून निर्यात करा",
        exportSuccess: "PDF यशस्वीरित्या निर्यात केले!",

        // Common
        close: "बंद करा",
        date: "तारीख आणि वेळ"
    }
};

// Current language
let currentLang = localStorage.getItem('appLanguage') || 'en';

// Translation function
function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
}

// Change language
function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('appLanguage', lang);
    updateUILanguage();
    // Close the language menu after selection
    const langMenu = document.getElementById('lang-menu');
    if (langMenu) {
        langMenu.style.display = 'none';
    }
    // Update language display in button
    const currentLangSpan = document.getElementById('current-lang');
    if (currentLangSpan) {
        currentLangSpan.innerText = lang.toUpperCase();
    }
}

// Update all UI text
function updateUILanguage() {
    // Navigation items
    const navItems = {
        'nav-dashboard': 'dashboard',
        'nav-scanner': 'scanner',
        'nav-analytics': 'analytics',
        'nav-history': 'history',
        'nav-chat': 'chat',
        'nav-assistant': 'assistant'
    };

    Object.keys(navItems).forEach(id => {
        const elem = document.querySelector(`#${id}`);
        if (elem) {
            // Find the span inside the anchor tag
            const span = elem.querySelector('span');
            if (span) {
                span.innerText = t(navItems[id]);
            } else {
                // Fallback if no span exists (though index.html has them now)
                const icon = elem.querySelector('i');
                const iconHTML = icon ? icon.outerHTML : '';
                elem.innerHTML = iconHTML + ' <span>' + t(navItems[id]) + '</span>';
            }
        }
    });

    // Update primary text elements by ID
    const textUpdates = {
        'scan-title': 'scanTitle',
        'calc-title': 'fertilizerCalc',
        'history-title': 'scanHistory',
        'chat-title': 'chatTitle'
    };

    Object.keys(textUpdates).forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.innerText = t(textUpdates[id]);
    });

    // Update dashboard stat cards by their position
    const statLabels = document.querySelectorAll('.stat-card h4');
    const statLabelsArray = ['totalScans', 'healthyScans', 'infectedScans', 'alerts'];
    statLabels.forEach((label, index) => {
        if (statLabelsArray[index]) {
            label.innerText = t(statLabelsArray[index]);
        }
    });

    // Update any elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (key) {
            if (elem.tagName === 'INPUT' && elem.type === 'placeholder') {
                elem.placeholder = t(key);
            } else {
                elem.innerText = t(key);
            }
        }
    });

    // Update chat input placeholder
    const chatInput = document.getElementById('chat-input');
    if (chatInput) chatInput.placeholder = t('chatPlaceholder');

    // Reload quick replies with new language
    if (typeof loadQuickReplies === 'function') {
        loadQuickReplies();
    }

    // Refresh modal if it's open with translated content
    if (typeof refreshHistoryModalTranslation === 'function') {
        const modal = document.getElementById('history-modal');
        if (modal && modal.style.display !== 'none') {
            refreshHistoryModalTranslation();
        }
    }
}

// Voice language mapping
const voiceLangMap = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'bho': 'hi-IN',
    'pa': 'pa-IN',
    'mr': 'mr-IN'
};

function getVoiceLang() {
    return voiceLangMap[currentLang] || 'en-US';
}

// Initialize translation system on page load
document.addEventListener('DOMContentLoaded', function () {
    // Load language from localStorage
    currentLang = localStorage.getItem('appLanguage') || 'en';

    // Initialize language selector UI
    const langBtn = document.getElementById('current-lang');
    if (langBtn) {
        langBtn.innerText = currentLang.toUpperCase();
    }

    // Initialize chat quick replies if chat view exists
    if (document.getElementById('quick-replies-container')) {
        loadQuickReplies();
    }

    // Initialize chat history if chat exists
    if (typeof loadChatHistory === 'function') {
        loadChatHistory();
    }

    // Update UI with current language
    updateUILanguage();
});

// Load quick replies based on current language
function loadQuickReplies() {
    const grid = document.querySelector('.quick-replies-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const questions = quickQuestions[currentLang] || quickQuestions['en'];

    if (questions) {
        questions.forEach(question => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn';
            btn.innerText = question;
            btn.onclick = () => quickReplyClick(question);
            grid.appendChild(btn);
        });
    }
}

// Toggle language menu
function toggleLanguageMenu() {
    const menu = document.getElementById('lang-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}
