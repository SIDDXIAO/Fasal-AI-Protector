"""
AI Assistant - Gemma 2 9B Integration with Boundaries
Comprehensive farming intelligence system (Better Hindi/Hinglish support)
"""
import requests
from django.conf import settings
import json


class GemmaAssistant:
    """AI Assistant using Gemma 2 9B with farming domain boundaries"""
    
    def __init__(self):
        self.base_url = settings.GEMMA_AI_BASE_URL
        self.model = settings.GEMMA_AI_MODEL
        
        # Gemma-optimized system prompt — Gemma 2 has excellent Hindi support
        self.system_prompt = """You are FasAi, an expert Indian farming AI assistant.
RULES: Reply in the SAME language as the user (Hindi→Hindi in Devanagari, English→English, Hinglish→Hinglish). Only answer farming/agriculture questions. Be concise, use bullet points and emojis. Include dosage, prices, safety info when relevant. Write all words correctly. Use proper English for technical terms (Mancozeb, Carbendazim, ml/liter, fungicide)."""
    
    def is_farming_related(self, query):
        """Check if query is farming-related"""
        farming_keywords = [
            # ═══════════════════════════════════════════════════════════════
            # ENGLISH KEYWORDS (~400+)
            # ═══════════════════════════════════════════════════════════════

            # ── Cereals & Grains ──
            'wheat', 'rice', 'paddy', 'maize', 'corn', 'barley', 'oat', 'millet',
            'sorghum', 'jowar', 'bajra', 'ragi', 'quinoa', 'buckwheat', 'triticale',

            # ── Pulses & Legumes ──
            'lentil', 'chickpea', 'pigeon pea', 'moong', 'urad', 'masoor', 'chana',
            'arhar', 'toor', 'rajma', 'kidney bean', 'black gram', 'green gram',
            'moth bean', 'horse gram', 'kulthi', 'cowpea', 'lobia', 'soybean',
            'groundnut', 'peanut',

            # ── Oilseeds ──
            'mustard', 'rapeseed', 'sunflower', 'safflower', 'sesame', 'til',
            'linseed', 'castor', 'niger', 'coconut', 'palm oil', 'olive',

            # ── Vegetables ──
            'tomato', 'potato', 'onion', 'garlic', 'ginger', 'turmeric',
            'chilli', 'pepper', 'capsicum', 'brinjal', 'eggplant', 'okra',
            'ladyfinger', 'bhindi', 'cabbage', 'cauliflower', 'broccoli',
            'spinach', 'palak', 'methi', 'fenugreek', 'coriander', 'dhaniya',
            'radish', 'mooli', 'carrot', 'turnip', 'beetroot', 'sweet potato',
            'yam', 'taro', 'arbi', 'colocasia', 'pumpkin', 'bottle gourd',
            'lauki', 'bitter gourd', 'karela', 'ridge gourd', 'turai', 'torai',
            'sponge gourd', 'snake gourd', 'ash gourd', 'petha', 'cucumber',
            'khira', 'kakdi', 'watermelon', 'muskmelon', 'kharbooja',
            'pea', 'matar', 'bean', 'french bean', 'cluster bean', 'guar',
            'drumstick', 'moringa', 'sahjan', 'lettuce', 'celery', 'asparagus',
            'mushroom', 'khumbi', 'parsley', 'mint', 'pudina', 'curry leaf',
            'amaranth', 'chaulai', 'bathua', 'lotus stem', 'kamal kakdi',
            'jackfruit', 'kathal', 'raw banana', 'kachha kela', 'artichoke',
            'leek', 'spring onion', 'hara pyaz', 'baby corn', 'vegetable',
            'sabzi', 'sabji',

            # ── Fruits ──
            'mango', 'aam', 'banana', 'kela', 'apple', 'seb', 'grape', 'angoor',
            'orange', 'santra', 'lemon', 'nimbu', 'lime', 'papaya', 'guava',
            'amrud', 'pomegranate', 'anar', 'litchi', 'lychee', 'pineapple',
            'ananas', 'strawberry', 'blueberry', 'raspberry', 'mulberry',
            'shahtoot', 'fig', 'anjeer', 'date', 'khajoor', 'coconut', 'nariyal',
            'kiwi', 'avocado', 'dragon fruit', 'passion fruit', 'custard apple',
            'sitaphal', 'sharifa', 'jackfruit', 'sapota', 'chiku', 'jamun',
            'java plum', 'ber', 'jujube', 'amla', 'gooseberry', 'tamarind',
            'imli', 'wood apple', 'bael', 'star fruit', 'kamrakh', 'persimmon',
            'peach', 'aadu', 'plum', 'aloo bukhara', 'apricot', 'khurmani',
            'cherry', 'walnut', 'akhrot', 'almond', 'badam', 'cashew', 'kaju',
            'pistachio', 'pista', 'fruit', 'phal',

            # ── Spices & Condiments ──
            'turmeric', 'haldi', 'cumin', 'jeera', 'coriander', 'black pepper',
            'kali mirch', 'cardamom', 'elaichi', 'clove', 'laung', 'cinnamon',
            'dalchini', 'nutmeg', 'jaiphal', 'mace', 'javitri', 'saffron',
            'kesar', 'bay leaf', 'tej patta', 'fennel', 'saunf', 'fenugreek',
            'ajwain', 'carom', 'asafoetida', 'heeng', 'hing', 'poppy seed',
            'khas khas', 'star anise', 'vanilla', 'tamarind',

            # ── Cash Crops ──
            'sugarcane', 'ganna', 'cotton', 'kapas', 'jute', 'pat', 'hemp',
            'tobacco', 'tambaku', 'tea', 'chai', 'coffee', 'rubber', 'silk',
            'resham', 'indigo', 'neel', 'opium', 'saffron',

            # ── Flowers & Ornamental ──
            'marigold', 'genda', 'rose', 'gulab', 'jasmine', 'mogra', 'chameli',
            'sunflower', 'surajmukhi', 'lotus', 'kamal', 'tuberose', 'rajnigandha',
            'chrysanthemum', 'guldaudi', 'dahlia', 'gladiolus', 'lily', 'orchid',
            'hibiscus', 'gudhal', 'bougainvillea', 'lavender', 'tulip', 'poppy',
            'flower', 'phool', 'floriculture', 'nursery',

            # ── Plantation Crops ──
            'bamboo', 'baans', 'eucalyptus', 'teak', 'sagwan', 'sandalwood',
            'chandan', 'neem', 'peepal', 'banyan', 'bargad', 'mahogany',
            'poplar', 'shisham', 'rosewood', 'agroforestry', 'plantation',
            'timber', 'lakdi',

            # ── Farming General ──
            'crop', 'plant', 'farm', 'farming', 'farmer', 'agriculture',
            'agricultural', 'agri', 'agribusiness', 'agrotech', 'agronomy',
            'horticulture', 'floriculture', 'sericulture', 'apiculture',
            'aquaculture', 'pisciculture', 'silviculture', 'viticulture',
            'cultivation', 'cultivate', 'cultivator', 'harvest', 'harvesting',
            'yield', 'production', 'productivity', 'sow', 'sowing', 'seed',
            'seedling', 'sapling', 'nursery', 'transplant', 'transplanting',
            'grow', 'growing', 'growth', 'germination', 'germinate',
            'propagation', 'grafting', 'budding', 'layering', 'cutting',
            'pruning', 'thinning', 'weeding', 'mulching', 'staking',
            'trellising', 'intercropping', 'mixed cropping', 'relay cropping',
            'crop rotation', 'monoculture', 'polyculture', 'cover crop',
            'green manure', 'field', 'plot', 'acre', 'hectare', 'bigha',
            'khet', 'land', 'terrace', 'raised bed', 'greenhouse', 'polyhouse',
            'shade net', 'tunnel farming', 'vertical farming', 'hydroponics',
            'aeroponics', 'aquaponics', 'precision farming', 'smart farming',
            'organic farming', 'natural farming', 'zero budget',

            # ── Soil & Land ──
            'soil', 'mitti', 'clay', 'sand', 'silt', 'loam', 'alluvial',
            'black soil', 'red soil', 'laterite', 'saline', 'alkaline',
            'acidic', 'ph', 'humus', 'topsoil', 'subsoil', 'erosion',
            'degradation', 'reclamation', 'contour', 'terrace',
            'soil health', 'soil test', 'soil moisture', 'soil fertility',
            'nutrient', 'nitrogen', 'phosphorus', 'potassium', 'npk',
            'zinc', 'iron', 'boron', 'calcium', 'magnesium', 'sulphur',
            'micronutrient', 'macronutrient', 'deficiency', 'toxicity',

            # ── Water & Irrigation ──
            'water', 'pani', 'irrigation', 'irrigate', 'drip', 'sprinkler',
            'flood irrigation', 'furrow', 'canal', 'nahar', 'borewell',
            'tubewell', 'well', 'kuan', 'pond', 'talab', 'tank', 'dam',
            'bandh', 'reservoir', 'rainwater', 'harvesting', 'watershed',
            'groundwater', 'waterlogging', 'drainage', 'nala', 'pump',
            'motor', 'pipe', 'hose', 'micro irrigation', 'fertigation',
            'flood', 'drought', 'sukha', 'baadh',

            # ── Fertilizers ──
            'fertilizer', 'khad', 'urea', 'dap', 'npk', 'potash', 'mop',
            'ssp', 'tsp', 'ammonium sulphate', 'calcium nitrate',
            'zinc sulphate', 'borax', 'gypsum', 'lime', 'chuna',
            'vermicompost', 'compost', 'farmyard manure', 'fym',
            'green manure', 'biofertilizer', 'rhizobium', 'azotobacter',
            'phosphobacteria', 'mycorrhiza', 'humic acid', 'fulvic acid',
            'seaweed extract', 'neem cake', 'castor cake', 'bone meal',
            'fish meal', 'rock phosphate', 'micronutrient mixture',
            'foliar spray', 'basal dose', 'top dressing', 'side dressing',
            'organic manure', 'gobar', 'cow dung', 'poultry manure',
            'press mud', 'biochar', 'liquid fertilizer',

            # ── Pesticides & Chemicals ──
            'pesticide', 'pest', 'insecticide', 'fungicide', 'herbicide',
            'weedicide', 'acaricide', 'miticide', 'nematicide', 'rodenticide',
            'molluscicide', 'bactericide', 'virucide', 'bio pesticide',
            'botanical pesticide', 'neem oil', 'bt', 'trichoderma',
            'pseudomonas', 'beauveria', 'metarhizium', 'ipm',
            'integrated pest management', 'spray', 'spraying', 'chhidkav',
            'dusting', 'fumigation', 'drenching', 'seed treatment',
            'chemical', 'poison', 'organic pesticide', 'biopesticide',
            'pheromone trap', 'yellow sticky trap', 'light trap',
            'imidacloprid', 'chlorpyrifos', 'cypermethrin', 'deltamethrin',
            'lambda cyhalothrin', 'profenofos', 'acephate', 'thiamethoxam',
            'fipronil', 'spinosad', 'emamectin benzoate', 'abamectin',
            'mancozeb', 'carbendazim', 'copper oxychloride', 'sulphur',
            'propiconazole', 'hexaconazole', 'tebuconazole', 'azoxystrobin',
            'metalaxyl', 'tricyclazole', 'isoprothiolane', 'kasugamycin',
            'streptomycin', 'validamycin', 'glyphosate', 'paraquat',
            'pendimethalin', 'atrazine', 'butachlor', 'pretilachlor',
            'bispyribac sodium', 'clodinafop', 'sulfosulfuron',
            'metsulfuron', '2-4-d', 'ethion', 'phorate', 'cartap',
            'carbofuran', 'monocrotophos', 'dimethoate', 'malathion',
            'quinalphos', 'triazophos', 'dichlorvos', 'endosulfan',

            # ── Diseases ──
            'disease', 'blight', 'rust', 'wilt', 'rot', 'mildew', 'smut',
            'mosaic', 'leaf curl', 'leaf spot', 'canker', 'scab', 'blast',
            'dieback', 'damping off', 'anthracnose', 'cercospora',
            'alternaria', 'fusarium', 'phytophthora', 'pythium',
            'rhizoctonia', 'sclerotinia', 'botrytis', 'powdery mildew',
            'downy mildew', 'bacterial blight', 'bacterial wilt',
            'crown rot', 'root rot', 'stem rot', 'fruit rot', 'ear rot',
            'grain discoloration', 'sheath blight', 'sheath rot',
            'false smut', 'kernel bunt', 'loose smut', 'covered smut',
            'ergot', 'tungro', 'grassy stunt', 'ragged stunt',
            'yellow dwarf', 'stripe virus', 'ring spot', 'bunchy top',
            'panama disease', 'sigatoka', 'citrus canker', 'citrus greening',
            'hlb', 'tristeza', 'gummosis', 'collar rot', 'foot rot',
            'tikka', 'early blight', 'late blight', 'bacterial leaf blight',
            'brown spot', 'narrow brown leaf spot', 'leaf scald',
            'white tip', 'ufra', 'khaira', 'bacterial leaf streak',
            'black rot', 'club root', 'white rust', 'purple blotch',
            'stemphylium blight', 'basal rot', 'pink rot', 'black mould',
            'sooty mould', 'red rot', 'whip smut', 'wilt disease',
            'pith necrosis', 'viral disease', 'fungal disease',
            'bacterial disease', 'nematode disease', 'phytoplasma',
            'infection', 'symptom', 'diagnosis', 'treatment', 'cure',
            'remedy', 'prevention', 'control', 'resistant variety',

            # ── Pests & Insects ──
            'insect', 'pest', 'bug', 'worm', 'caterpillar', 'larva', 'grub',
            'aphid', 'jassid', 'whitefly', 'thrips', 'mite', 'spider mite',
            'mealybug', 'scale insect', 'leaf hopper', 'plant hopper',
            'brown plant hopper', 'bph', 'stem borer', 'shoot borer',
            'fruit borer', 'pod borer', 'bollworm', 'army worm',
            'fall armyworm', 'cutworm', 'leaf roller', 'leaf miner',
            'fruit fly', 'root knot nematode', 'cyst nematode',
            'termite', 'deemak', 'grasshopper', 'locust', 'tiddi',
            'beetle', 'weevil', 'flea beetle', 'red pumpkin beetle',
            'epilachna beetle', 'hadda beetle', 'rhinoceros beetle',
            'red palm weevil', 'trunk borer', 'bark borer', 'gall midge',
            'rice hispa', 'rice case worm', 'ear cutting caterpillar',
            'pink bollworm', 'spotted bollworm', 'american bollworm',
            'diamond back moth', 'dbm', 'tobacco caterpillar', 'spodoptera',
            'helicoverpa', 'heliothis', 'earias', 'maruca', 'bean fly',
            'mustard aphid', 'mustard sawfly', 'painted bug',
            'sugarcane borer', 'top borer', 'internode borer',
            'early shoot borer', 'woolly aphid', 'pyrilla', 'white grub',
            'snail', 'slug', 'rat', 'rodent', 'bird', 'monkey', 'nilgai',
            'wild boar', 'peacock', 'parrot',

            # ── Weeds ──
            'weed', 'kharpatwar', 'grass', 'ghas', 'doob', 'motha',
            'bathua', 'hirankhuri', 'jangali palak', 'makoy',
            'satyanashi', 'gajar ghas', 'parthenium', 'congress grass',
            'lantana', 'water hyacinth', 'jal kumbhi', 'nutsedge',
            'bermuda grass', 'johnson grass', 'crabgrass', 'barnyard grass',

            # ── Weather & Climate ──
            'weather', 'climate', 'rain', 'rainfall', 'monsoon',
            'temperature', 'humidity', 'frost', 'fog', 'kohra', 'hail',
            'ola', 'olavrishti', 'storm', 'toofan', 'cyclone', 'flood',
            'drought', 'heatwave', 'loo', 'cold wave', 'sheetlahar',
            'wind', 'hawa', 'sunshine', 'dhoop', 'cloud', 'badal',
            'dew', 'os', 'forecast', 'prediction', 'el nino', 'la nina',
            'climate change', 'global warming', 'season', 'rabi', 'kharif',
            'zaid', 'spring', 'summer', 'winter', 'autumn',

            # ── Equipment & Tools ──
            'tractor', 'plough', 'hal', 'harrow', 'cultivator', 'rotavator',
            'seed drill', 'transplanter', 'harvester', 'combine', 'thresher',
            'winnower', 'chaff cutter', 'reaper', 'baler', 'sprayer',
            'knapsack', 'power tiller', 'pump', 'motor', 'generator',
            'drone', 'sensor', 'sickle', 'hansiya', 'darati', 'spade',
            'khurpi', 'hoe', 'kudal', 'rake', 'wheelbarrow', 'cart',
            'trolley', 'tanker', 'tank', 'pipe', 'drip kit', 'mulch film',
            'shade net', 'poly house', 'green house', 'cold storage',
            'godown', 'silo', 'grain bin', 'storage', 'warehouse',
            'farm machinery', 'implement', 'equipment', 'tool',

            # ── Market & Trade ──
            'mandi', 'market', 'price', 'rate', 'bhav', 'daam', 'cost',
            'msp', 'minimum support price', 'procurement', 'apmc',
            'e-nam', 'auction', 'wholesale', 'retail', 'export', 'import',
            'trading', 'broker', 'aarhti', 'dalal', 'middleman',
            'commission', 'cold chain', 'processing', 'value addition',
            'grading', 'sorting', 'packaging', 'branding', 'fpo',
            'cooperative', 'sahakari', 'subsidy', 'loan', 'insurance',
            'fasal bima', 'pmfby', 'kisan credit card', 'kcc',
            'income', 'profit', 'loss', 'expense', 'investment',
            'supply', 'demand', 'trend', 'forecast',

            # ── Animal Husbandry ──
            'cattle', 'cow', 'gai', 'buffalo', 'bhains', 'bull', 'bail',
            'ox', 'goat', 'bakri', 'sheep', 'bhed', 'pig', 'suar',
            'poultry', 'murgi', 'chicken', 'duck', 'batakh', 'turkey',
            'fish', 'machli', 'prawn', 'shrimp', 'crab', 'lobster',
            'dairy', 'milk', 'doodh', 'ghee', 'butter', 'curd', 'dahi',
            'paneer', 'cheese', 'egg', 'anda', 'meat', 'gosht',
            'honey', 'shahad', 'beekeeping', 'madhumakkhi', 'apiary',
            'silkworm', 'resham keeda', 'fodder', 'chara', 'feed',
            'breed', 'breeding', 'vaccination', 'deworming', 'veterinary',
            'pashu', 'pashupalan', 'livestock', 'animal husbandry',
            'vermicompost', 'kechua khad', 'biogas', 'gobar gas',

            # ── Government Schemes ──
            'scheme', 'yojana', 'subsidy', 'grant', 'pm kisan', 'pmfby',
            'kisan samman nidhi', 'fasal bima', 'krishi', 'nabard',
            'kcc', 'credit', 'loan', 'rin', 'karz', 'pacs',
            'soil health card', 'neem coated urea', 'micro irrigation',
            'pmksy', 'rkvy', 'atma', 'extension',

            # ═══════════════════════════════════════════════════════════════
            # HINDI TRANSLITERATED (~200+)
            # ═══════════════════════════════════════════════════════════════
            'fasal', 'kheti', 'kisan', 'beej', 'khad', 'pani', 'sinchai',
            'rog', 'keet', 'dawa', 'mausam', 'barish', 'gehun', 'dhan',
            'tamatar', 'aloo', 'sabzi', 'buai', 'katai', 'upchar', 'upay',
            'dawai', 'keetnashak', 'urvarak', 'kharpatwar', 'niyantran',
            'pehchan', 'salaah', 'tarika', 'vidhi', 'prakriya',
            'makka', 'sarson', 'bajra', 'chana', 'moong', 'masoor',
            'udad', 'arhar', 'soyabean', 'moongfali', 'til',
            'ganna', 'kapas', 'jute', 'chai', 'coffee',
            'aam', 'kela', 'seb', 'angoor', 'santra', 'nimbu', 'papita',
            'amrood', 'anaar', 'litchi', 'chiku', 'jamun', 'ber',
            'baingan', 'mirch', 'bhindi', 'lauki', 'karela', 'kaddu',
            'gobhi', 'phool gobhi', 'band gobhi', 'mooli', 'gajar',
            'shalgam', 'chukander', 'shakarkandi', 'arbi', 'shimla mirch',
            'pyaz', 'lahsun', 'adrak', 'haldi', 'jeera', 'dhania',
            'elaichi', 'laung', 'dalchini', 'kesar', 'saunf', 'ajwain',
            'heeng', 'kali mirch', 'lal mirch', 'rai', 'methi',
            'genda', 'gulab', 'chameli', 'mogra', 'kamal',
            'mitti', 'zameen', 'khet', 'khalihan', 'kharihan',
            'tractor', 'hal', 'kudal', 'hansiya', 'fawda',
            'gobar', 'kechua', 'keechad', 'nahar', 'kuan', 'talab',
            'baadh', 'sukha', 'andhi', 'toofan', 'ola', 'kohra',
            'rabi', 'kharif', 'zaid', 'phasal', 'ugana', 'bona',
            'ropai', 'nirhai', 'gudai', 'chhidkav', 'dhulai',
            'mandi', 'bhav', 'daam', 'bazaar', 'bikri', 'kharidi',
            'munafa', 'nuksan', 'bima', 'karz', 'rin', 'yojana',
            'gai', 'bhains', 'bakri', 'bhed', 'murgi', 'machli',
            'doodh', 'ghee', 'shahad', 'anda', 'chara',
            'pashu', 'pashupalan', 'gaushala', 'tabela',
            'deemak', 'tiddi', 'makhi', 'machar', 'kira',
            'saanp', 'chuha', 'gilahri', 'bandar', 'nilgai', 'suar',

            # ═══════════════════════════════════════════════════════════════
            # HINDI UNICODE (देवनागरी) (~300+)
            # ═══════════════════════════════════════════════════════════════

            # ── फसलें / Crops ──
            'फसल', 'खेती', 'किसान', 'बीज', 'खाद', 'पानी', 'सिंचाई',
            'गेहूं', 'धान', 'चावल', 'मक्का', 'बाजरा', 'ज्वार', 'रागी', 'जौ',
            'चना', 'मसूर', 'मूंग', 'उड़द', 'अरहर', 'तूर', 'राजमा', 'लोबिया',
            'सोयाबीन', 'मूंगफली', 'तिल', 'सरसों', 'अलसी', 'सूरजमुखी',
            'गन्ना', 'कपास', 'जूट', 'पटसन', 'तम्बाकू',

            # ── सब्जियां / Vegetables ──
            'टमाटर', 'आलू', 'प्याज', 'लहसुन', 'अदरक', 'हल्दी',
            'मिर्च', 'शिमला मिर्च', 'बैंगन', 'भिंडी', 'लौकी', 'करेला',
            'कद्दू', 'तोरई', 'तुरई', 'खीरा', 'ककड़ी', 'परवल', 'चिचिंडा',
            'गोभी', 'फूल गोभी', 'बंद गोभी', 'ब्रोकली',
            'पालक', 'मेथी', 'धनिया', 'पुदीना', 'करी पत्ता',
            'मूली', 'गाजर', 'शलजम', 'चुकंदर', 'शकरकंद',
            'अरबी', 'जिमीकंद', 'कमल ककड़ी',
            'मटर', 'सेम', 'ग्वार', 'बरबटी', 'चौलाई', 'बथुआ',
            'सहजन', 'मशरूम', 'खुम्भी', 'तरबूज', 'खरबूजा',
            'सब्जी', 'भाजी', 'साग',

            # ── फल / Fruits ──
            'आम', 'केला', 'सेब', 'अंगूर', 'संतरा', 'नींबू', 'मौसमी',
            'पपीता', 'अमरूद', 'अनार', 'लीची', 'अनानास',
            'चीकू', 'सीताफल', 'शरीफा', 'जामुन', 'बेर', 'आंवला',
            'इमली', 'बेल', 'कमरख', 'आड़ू', 'आलूबुखारा', 'खुबानी',
            'अखरोट', 'बादाम', 'काजू', 'पिस्ता', 'नारियल',
            'खजूर', 'अंजीर', 'शहतूत', 'स्ट्रॉबेरी', 'कीवी',
            'ड्रैगन फ्रूट', 'फल',

            # ── मसाले / Spices ──
            'हल्दी', 'जीरा', 'धनिया', 'काली मिर्च', 'लाल मिर्च',
            'इलायची', 'लौंग', 'दालचीनी', 'जायफल', 'जावित्री',
            'केसर', 'तेज पत्ता', 'सौंफ', 'अजवाइन', 'हींग',
            'खसखस', 'राई', 'मेथी दाना', 'कलौंजी',

            # ── फूल / Flowers ──
            'गेंदा', 'गुलाब', 'चमेली', 'मोगरा', 'रजनीगंधा',
            'गुलदाउदी', 'डहेलिया', 'कमल', 'गुड़हल', 'सूरजमुखी',
            'फूल', 'बागवानी', 'नर्सरी',

            # ── रोग / Diseases ──
            'रोग', 'बीमारी', 'संक्रमण', 'फफूंद', 'फफूंदी', 'जीवाणु',
            'विषाणु', 'सड़न', 'गलन', 'झुलसा', 'कुंठन', 'कंडवा',
            'मोज़ेक', 'पत्ती मोड़', 'पत्ती धब्बा', 'तना सड़न', 'जड़ सड़न',
            'फल सड़न', 'चूर्णिल फफूंदी', 'मृदुरोमिल फफूंदी',
            'उकठा', 'म्लानि', 'अंगमारी', 'ब्लाइट', 'ब्लास्ट',
            'लक्षण', 'पहचान', 'निदान', 'इलाज', 'उपचार', 'उपाय',
            'नियंत्रण', 'रोकथाम', 'बचाव', 'प्रतिरोधी',

            # ── कीट / Pests ──
            'कीट', 'कीड़ा', 'कीड़े', 'इल्ली', 'सुंडी', 'लार्वा',
            'माहू', 'मोयला', 'सफेद मक्खी', 'थ्रिप्स', 'जैसिड',
            'तेला', 'फुदका', 'तना छेदक', 'फल छेदक', 'फली छेदक',
            'पत्ती लपेट', 'पत्ती सुरंग', 'फल मक्खी', 'सूत्रकृमि',
            'दीमक', 'टिड्डी', 'टिड्डा', 'भृंग', 'घुन',
            'सफेद गिडार', 'गुलाबी सुंडी', 'अमेरिकन सुंडी',
            'चेपा', 'मकड़ी', 'घोंघा', 'चूहा', 'बंदर', 'नीलगाय',
            'जंगली सूअर', 'तोता', 'मोर',

            # ── दवाई और रसायन ──
            'कीटनाशक', 'फफूंदनाशक', 'खरपतवारनाशक', 'जैव कीटनाशक',
            'दवा', 'दवाई', 'स्प्रे', 'छिड़काव', 'धूल', 'बीजोपचार',
            'रसायन', 'रासायनिक', 'जैविक', 'नीम तेल', 'ट्राइकोडर्मा',
            'बीटी', 'आईपीएम', 'समेकित कीट प्रबंधन',
            'यूरिया', 'डीएपी', 'पोटाश', 'जिंक', 'बोरॉन',
            'एनपीके', 'जिप्सम', 'चूना', 'वर्मीकम्पोस्ट', 'गोबर',
            'केंचुआ खाद', 'हरी खाद', 'जीवामृत', 'बीजामृत',

            # ── मिट्टी / Soil ──
            'मिट्टी', 'ज़मीन', 'जमीन', 'खेत', 'भूमि',
            'दोमट', 'बलुई', 'चिकनी', 'काली मिट्टी', 'लाल मिट्टी',
            'क्षारीय', 'अम्लीय', 'लवणीय', 'उपजाऊ', 'बंजर',
            'मृदा स्वास्थ्य', 'मृदा परीक्षण', 'पोषक तत्व',

            # ── सिंचाई / Irrigation ──
            'सिंचाई', 'टपक सिंचाई', 'फव्वारा सिंचाई', 'बूंद बूंद',
            'नहर', 'कुआं', 'बोरवेल', 'तालाब', 'बांध', 'पंप', 'मोटर',
            'जलभराव', 'जल निकासी', 'वर्षा जल संचयन',
            'बाढ़', 'सूखा', 'ओला', 'कोहरा', 'पाला', 'तूफान',

            # ── मौसम / Weather ──
            'मौसम', 'बारिश', 'वर्षा', 'मानसून', 'तापमान', 'आर्द्रता',
            'ठंड', 'गर्मी', 'लू', 'शीतलहर', 'धूप', 'बादल', 'ओस', 'कोहरा',
            'रबी', 'खरीफ', 'जायद', 'बसंत', 'सावन', 'भादों',

            # ── बाज़ार / Market ──
            'मंडी', 'भाव', 'बाजार', 'बाज़ार', 'दाम', 'कीमत', 'दर',
            'एमएसपी', 'न्यूनतम समर्थन मूल्य', 'खरीद', 'बिक्री',
            'मुनाफा', 'लाभ', 'हानि', 'नुकसान', 'लागत', 'आमदनी',
            'आढ़ती', 'दलाल', 'बिचौलिया', 'सहकारी',

            # ── उपकरण / Equipment ──
            'ट्रैक्टर', 'हल', 'कुदाल', 'हंसिया', 'दरांती', 'फावड़ा',
            'खुरपी', 'थ्रेशर', 'हार्वेस्टर', 'रोटावेटर', 'कल्टीवेटर',
            'ड्रोन', 'स्प्रेयर', 'बैलगाड़ी', 'ट्रॉली',
            'कोल्ड स्टोरेज', 'गोदाम', 'भंडारण',

            # ── पशुपालन / Animal Husbandry ──
            'गाय', 'भैंस', 'बैल', 'बकरी', 'भेड़', 'सूअर',
            'मुर्गी', 'बतख', 'मछली', 'मधुमक्खी',
            'दूध', 'घी', 'दही', 'पनीर', 'अंडा', 'शहद', 'मांस',
            'चारा', 'दाना', 'नस्ल', 'टीकाकरण', 'पशु चिकित्सक',
            'पशु', 'पशुपालन', 'गौशाला', 'तबेला', 'डेयरी',
            'बायोगैस', 'गोबर गैस', 'केंचुआ',

            # ── सरकारी योजना / Schemes ──
            'योजना', 'सब्सिडी', 'अनुदान', 'पीएम किसान', 'फसल बीमा',
            'किसान सम्मान निधि', 'क्रेडिट कार्ड', 'ऋण', 'कर्ज़',
            'मृदा स्वास्थ्य कार्ड', 'नाबार्ड', 'कृषि', 'विस्तार',

            # ── General farming terms ──
            'बुआई', 'रोपाई', 'कटाई', 'गहाई', 'निराई', 'गुड़ाई',
            'जुताई', 'खुदाई', 'समय', 'तरीका', 'विधि', 'प्रक्रिया',
            'उत्पादन', 'पैदावार', 'उपज', 'अंकुरण', 'पौध', 'कलम',
            'छंटाई', 'सलाह', 'मार्गदर्शन', 'जानकारी', 'सुझाव',
            'पत्ती', 'जड़', 'तना', 'फूल', 'शाखा', 'छाल', 'गांठ',
            'एकड़', 'हेक्टेयर', 'बीघा', 'प्रति', 'मात्रा', 'खुराक',
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in farming_keywords)
    
    def _build_messages(self, user_message, context=None):
        """Build messages for Gemma (only user/assistant roles supported)"""
        if context:
            context_text = "\n\n".join(context)
            user_content = f"""[INSTRUCTIONS]\n{self.system_prompt}\n\n[DATABASE CONTEXT]\n{context_text}\n\n[USER QUESTION]\n{user_message}"""
        else:
            user_content = f"""[INSTRUCTIONS]\n{self.system_prompt}\n\n[USER QUESTION]\n{user_message}"""
        
        return [
            {"role": "user", "content": user_content}
        ]
    
    def chat_stream(self, user_message, context=None):
        """Stream chat response generator (OpenAI Compatible)"""
        try:
            if not self.is_farming_related(user_message):
                yield "🚜 I can only help with farming questions!\n\n🚜 मैं सिर्फ खेती से जुड़े सवालों में मदद कर सकता हूं!"
                return

            messages = self._build_messages(user_message, context)
            
            with requests.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": True,
                    "temperature": 0.5,
                    "max_tokens": 600
                },
                stream=True,
                timeout=120
            ) as response:
                if response.status_code == 200:
                    for line in response.iter_lines():
                        if line:
                            decoded_line = line.decode('utf-8').strip()
                            if decoded_line.startswith('data: '):
                                data_str = decoded_line[6:]
                                if data_str == '[DONE]':
                                    break
                                try:
                                    json_response = json.loads(data_str)
                                    if 'choices' in json_response and len(json_response['choices']) > 0:
                                        delta = json_response['choices'][0].get('delta', {})
                                        content = delta.get('content', '')
                                        if content:
                                            yield content
                                except Exception:
                                    pass
                else:
                    yield f"Error: {response.status_code} - {response.text}"
                    
        except Exception as e:
            print(f"Gemma Stream Error: {e}")
            fallback = self._get_fallback_response(user_message)
            yield fallback.get('response', "Sorry, could not connect to AI Assistant.")

    def chat(self, user_message, context=None):
        """Main chat function (OpenAI Compatible)"""
        if not self.is_farming_related(user_message):
            return {
                'response': "🚜 I can only help with farming questions!\n\n🚜 मैं सिर्फ खेती से जुड़े सवालों में मदद कर सकता हूं!",
                'is_farming_related': False,
                'has_context': False
            }
        
        messages = self._build_messages(user_message, context)
        
        try:
            response = requests.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "temperature": 0.5,
                    "max_tokens": 600
                },
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = ""
                if 'choices' in result and len(result['choices']) > 0:
                    ai_response = result['choices'][0]['message']['content'].strip()
                
                if ai_response:
                    return {
                        'response': ai_response,
                        'is_farming_related': True,
                        'has_context': bool(context)
                    }
            
            return self._get_fallback_response(user_message)
                
        except Exception as e:
            print(f"Gemma Connection Error: {e}")
            return self._get_fallback_response(user_message)

    def _get_fallback_response(self, query):
        """Provide offline fallback responses"""
        query_lower = query.lower()
        
        if any(w in query_lower for w in ['गेहूं', 'gehun', 'wheat']):
            return {
                'response': """🌾 **गेहूं की खेती / Wheat Farming:**

• **बुआई समय:** नवंबर-दिसंबर (रबी सीजन)
• **बीज दर:** 100-125 kg/hectare
• **खाद:** DAP 130 kg + Urea 260 kg/hectare
• **सिंचाई:** 4-6 बार
• **प्रमुख रोग:** Brown Rust, Karnal Bunt, Loose Smut
• **कीटनाशक:** Propiconazole 25% EC (1 ml/liter)

⚡ *Offline response — Connect to AI for detailed advice*""",
                'is_farming_related': True,
                'has_context': False
            }
        
        elif any(w in query_lower for w in ['धान', 'dhan', 'rice', 'paddy']):
            return {
                'response': """🌿 **धान की खेती / Rice Farming:**

• **बुआई:** जून-जुलाई (खरीफ)
• **रोपाई:** 21-25 दिन की पौध
• **खाद:** DAP 100 kg + Urea 200 kg/hectare
• **प्रमुख रोग:** Blast, Sheath Blight, BLB
• **कीटनाशक:** Tricyclazole (0.6 g/liter) for Blast

⚡ *Offline response — Connect to AI for detailed advice*""",
                'is_farming_related': True,
                'has_context': False
            }
        
        elif any(w in query_lower for w in ['टमाटर', 'tamatar', 'tomato']):
            return {
                'response': """🍅 **टमाटर की खेती / Tomato Farming:**

• **बुआई:** अक्टूबर-नवंबर / फरवरी-मार्च
• **बीज:** 400-500 g/hectare
• **खाद:** FYM 25 ton + NPK 120:60:60 kg/ha
• **प्रमुख रोग:** Early Blight, Late Blight, Leaf Curl Virus
• **दवाई:** Mancozeb (2.5 g/liter) + Imidacloprid (0.5 ml/liter)

⚡ *Offline response — Connect to AI for detailed advice*""",
                'is_farming_related': True,
                'has_context': False
            }
        
        elif any(w in query_lower for w in ['आलू', 'aloo', 'potato']):
            return {
                'response': """🥔 **आलू की खेती / Potato Farming:**

• **बुआई:** अक्टूबर-नवंबर
• **बीज:** 25-30 quintal/hectare
• **खाद:** FYM 20-25 ton + NPK 150:60:100 kg/ha
• **प्रमुख रोग:** Late Blight, Early Blight, Black Scurf
• **दवाई:** Mancozeb 75% WP (2 g/liter)
• **MSP 2026:** ₹2,366/quintal

⚡ *Offline response — Connect to AI for detailed advice*""",
                'is_farming_related': True,
                'has_context': False
            }

        elif any(w in query_lower for w in ['गन्ना', 'ganna', 'sugarcane']):
            return {
                'response': """🌿 **गन्ना की खेती / Sugarcane Farming:**

• **बुआई:** फरवरी-मार्च (बसंतकालीन)
• **बीज:** 60-75 quintal/hectare
• **खाद:** FYM 10-15 ton + NPK 150:60:60 kg/ha
• **प्रमुख रोग:** Red Rot, Smut, Wilt
• **कीट:** Top Borer, Stem Borer, Pyrilla
• **दवाई:** Carbendazim (1 g/liter) for Red Rot

⚡ *Offline response — Connect to AI for detailed advice*""",
                'is_farming_related': True,
                'has_context': False
            }
        
        else:
            return {
                'response': """मैं आपकी मदद कर सकता हूं / I can help you with:

• **फसल की जानकारी** / Crop Information
• **रोग पहचान** / Disease Identification  
• **कीटनाशक सुझाव** / Pesticide Recommendations
• **उर्वरक गणना** / Fertilizer Calculation
• **मौसम सलाह** / Weather Advice
• **बाजार मूल्य** / Market Prices
• **खेती के तरीके** / Farming Methods

कृपया एक विशिष्ट प्रश्न पूछें!
Please ask a specific question!""",
                'is_farming_related': True,
                'has_context': False
            }


# Global assistant instance
assistant = GemmaAssistant()
