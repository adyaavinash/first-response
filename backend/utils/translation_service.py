from transformers import MarianMTModel, MarianTokenizer

MODELS = {
    "en": None,  
    "hi": "Helsinki-NLP/opus-mt-en-hi",   # English <-> Hindi
    "ar": "Helsinki-NLP/opus-mt-en-ar",   # English <-> Arabic
    "es": "Helsinki-NLP/opus-mt-en-es",   # English <-> Spanish
}

loaded_models = {}

def load_model(lang_code):
    if lang_code not in loaded_models:
        model_name = MODELS[lang_code]
        if model_name:
            tokenizer = MarianTokenizer.from_pretrained(model_name)
            model = MarianMTModel.from_pretrained(model_name)
            loaded_models[lang_code] = (tokenizer, model)
    return loaded_models.get(lang_code)

def translate_text(text, src="en", dest="en"):
    # If source = dest, no translation
    if src == dest or dest not in MODELS or not MODELS[dest]:
        return text

    tokenizer, model = load_model(dest)
    tokens = tokenizer([text], return_tensors="pt", padding=True)
    translated = model.generate(**tokens, max_length=512)
    out = tokenizer.batch_decode(translated, skip_special_tokens=True)
    return out[0]
