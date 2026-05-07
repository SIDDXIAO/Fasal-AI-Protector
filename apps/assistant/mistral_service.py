import requests
from django.conf import settings
import json


class MistralAssistant:
    """AI Assistant using LM Studio (Mistral) with farming domain boundaries"""

    def __init__(self):
        self.base_url = getattr(settings, 'LM_STUDIO_BASE_URL', 'http://localhost:1234')
        self.model = getattr(settings, 'MISTRAL_MODEL', 'mistral-7b-instruct-v0.3')
        self.api_key = getattr(settings, 'LM_STUDIO_API_KEY', 'sk-empty')

        self.system_prompt = """You are FasAi, an expert Indian farming AI assistant.
IMPORTANT - LANGUAGE RULE:
- You MUST reply in EXACTLY the same language as the user writes their question
- If user writes in Hindi (Devanagari script) → reply ONLY in Hindi Devanagari
- If user writes in English → reply ONLY in English
- If user writes in Punjabi → reply ONLY in Punjabi (Gurmukhi)
- If user writes in Bengali → reply ONLY in Bengali
- If user writes in Tamil → reply ONLY in Tamil
- If user writes in Telugu → reply ONLY in Telugu
- If user writes in Kannada → reply ONLY in Kannada
- If user writes in Malayalam → reply ONLY in Malayalam
- If user writes in Gujarati → reply ONLY in Gujarati
- If user writes in Odia → reply ONLY in Odia
- NEVER translate the user's question to another language in your response
- NEVER respond in a different language than what user used
- You may use English only for pesticide/chemical names (Mancozeb, Carbendazim, Carbaryl, Urea, DAP) and technical terms
RULES:
- Only answer farming/agriculture questions
- Be concise, use bullet points and emojis
- Include dosage, prices, safety info when relevant
- Write all words correctly, no garbled text"""

    def is_farming_related(self, query):
        """Check if query is farming-related"""
        farming_keywords = [
            'wheat', 'rice', 'paddy', 'maize', 'corn', 'barley', 'oat', 'millet',
            'sorghum', 'jowar', 'bajra', 'ragi', 'quinoa', 'buckwheat', 'triticale',
            'lentil', 'chickpea', 'pigeon pea', 'moong', 'urad', 'masoor', 'chana',
            'arhar', 'toor', 'rajma', 'kidney bean', 'black gram', 'green gram',
            'moth bean', 'horse gram', 'kulthi', 'cowpea', 'lobia', 'soybean',
            'groundnut', 'peanut', 'mustard', 'rapeseed', 'sunflower', 'safflower',
            'sesame', 'til', 'linseed', 'castor', 'coconut', 'olive', 'tomato',
            'potato', 'onion', 'garlic', 'ginger', 'turmeric', 'chilli', 'pepper',
            'capsicum', 'brinjal', 'eggplant', 'okra', 'ladyfinger', 'bhindi',
            'cabbage', 'cauliflower', 'broccoli', 'spinach', 'palak', 'methi',
            'fenugreek', 'coriander', 'dhaniya', 'radish', 'mooli', 'carrot',
            'turnip', 'beetroot', 'sweet potato', 'yam', 'taro', 'arbi', 'pumpkin',
            'bottle gourd', 'lauki', 'bitter gourd', 'karela', 'ridge gourd',
            'cucumber', 'watermelon', 'muskmelon', 'pea', 'matar', 'bean',
            'mushroom', 'mint', 'pudina', 'amaranth', 'mango', 'aam', 'banana',
            'kela', 'apple', 'seb', 'grape', 'angoor', 'orange', 'santra',
            'lemon', 'nimbu', 'papaya', 'guava', 'amrud', 'pomegranate', 'anar',
            'litchi', 'pineapple', 'strawberry', 'fig', 'anjeer', 'date', 'khajoor',
            'kiwi', 'avocado', 'guava', 'coconut', 'banana', 'sugarcane', 'ganna',
            'cotton', 'kapas', 'jute', 'tobacco', 'rubber', 'coffee', 'tea',
            'fertilizer', 'pesticide', 'insecticide', 'fungicide', 'herbicide',
            'urea', 'dap', 'npk', 'potash', 'manure', 'compost', 'vermicompost',
            'irrigation', 'drip', 'sprinkler', 'flood', 'soil', 'ph', 'nitrogen',
            'phosphorus', 'potassium', 'crop', 'farmer', 'farming', 'agriculture',
            'harvest', 'sowing', 'planting', 'field', 'khet', 'fasal', 'diye',
            'keet', 'rog', 'bimari', 'dawai', 'kit', 'kisan', 'खेती', 'खेत',
            'गेहूं', 'चावल', 'धान', 'मक्का', 'सरसों', 'तम्बाकू', 'नमक', 'उर्वरक',
            'कीट', 'रोग', 'कीटनाशक', 'फफूंदनाशक', 'खाद', 'सिंचाई', 'मिट्टी'
        ]
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in farming_keywords)

    def _build_messages(self, user_message, context=None):
        """Build messages for API call"""
        user_content = f"{self.system_prompt}\n\nUser question: {user_message}"
        return [{"role": "user", "content": user_content}]

    def _get_fallback_response(self, user_message):
        """Generate a fallback response when API fails"""
        return {
            'response': "मुझे खेती से जुड़े सवालों का जवाब देना है। कृपया खेती, फसल, खाद, दवाई, मिट्टी, सिंचाई आदि के बारे में पूछें।",
            'is_farming_related': True,
            'has_context': False
        }

    def chat_stream(self, user_message, context=None):
        """Stream chat response using LM Studio (OpenAI-compatible API)"""
        try:
            if not self.is_farming_related(user_message):
                yield "🚜 I can only help with farming questions!\n\n🚜 मैं सिर्फ खेती से जुड़े सवालों में मदद कर सकता हूं!"
                return

            messages = self._build_messages(user_message, context)

            # LM Studio uses OpenAI-compatible endpoint
            url = f"{self.base_url}/v1/chat/completions"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.api_key}'
            }

            payload = {
                "model": self.model,
                "messages": messages,
                "stream": True,
                "temperature": 0.5,
                "max_tokens": 600
            }

            with requests.post(url, headers=headers, json=payload, stream=True, timeout=120) as response:
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
                                except:
                                    pass
                else:
                    yield f"Error: {response.status_code} - Check if LM Studio is running and {self.model} is loaded."

        except Exception as e:
            print(f"[Mistral/LM Studio] Stream Error: {e}")
            fallback = self._get_fallback_response(user_message)
            yield fallback.get('response', "Sorry, could not connect to AI Assistant.")

    def chat(self, user_message, context=None):
        """Main chat function (non-streaming)"""
        if not self.is_farming_related(user_message):
            return {
                'response': "🚜 I can only help with farming questions!\n\n🚜 मैं सिर्फ खेती से जुड़े सवालों में मदद कर सकता हूं!",
                'is_farming_related': False,
                'has_context': False
            }

        try:
            messages = self._build_messages(user_message, context)
            url = f"{self.base_url}/v1/chat/completions"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.api_key}'
            }

            payload = {
                "model": self.model,
                "messages": messages,
                "stream": False,
                "temperature": 0.5,
                "max_tokens": 600
            }

            response = requests.post(url, headers=headers, json=payload, timeout=120)

            if response.status_code == 200:
                result = response.json()
                if 'choices' in result and len(result['choices']) > 0:
                    ai_response = result['choices'][0]['message']['content'].strip()
                    return {'response': ai_response, 'is_farming_related': True, 'has_context': False}

            return self._get_fallback_response(user_message)

        except Exception as e:
            print(f"[Mistral/LM Studio] Error: {e}")
            return self._get_fallback_response(user_message)


# Singleton instance
assistant = MistralAssistant()