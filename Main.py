
import telebot
import requests
import json
import os
from flask import Flask
from threading import Thread

# --- CONFIG (Render Environment se Keys uthayega) ---
BOT_TOKEN = os.getenv('BOT_TOKEN')
GEMINI_KEY = os.getenv('GEMINI_KEY')

bot = telebot.TeleBot(BOT_TOKEN)
app = Flask('')

def call_swarg_ai(prompt):
    if not GEMINI_KEY:
        return "❌ Error: Gemini Key nahi mili. Render Environment check karein."
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
    payload = {"contents": [{"parts": [{"text": f"Your name is Swarg AI. Answer in Hinglish: {prompt}"}]}]}
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        res_data = response.json()
        if 'candidates' in res_data:
            return res_data['candidates'][0]['content']['parts'][0]['text']
        return f"❌ Google Error: {res_data.get('error', {}).get('message', 'Unknown Error')}"
    except Exception as e:
        return "❌ Swarg AI connect nahi ho paa raha."

# --- Aapka Manga Hua Welcome Message ---
@bot.message_handler(commands=['start'])
def welcome(message):
    msg = (
        "✨ **Swarg AI ko message karne ke liye dhanyawaad!** ✨\n\n"
        "Main aapka personal AI assistant hoon. Aap **Swarg AI se kuch bhi puche, ye jawab dega!** 🚀"
    )
    bot.send_message(message.chat.id, msg, parse_mode="Markdown")

@bot.message_handler(func=lambda message: True)
def chat(message):
    bot.send_chat_action(message.chat.id, 'typing')
    answer = call_swarg_ai(message.text)
    bot.send_message(message.chat.id, answer)

@app.route('/')
def home(): return "Healthy"

def run_flask(): app.run(host='0.0.0.0', port=8080)

if __name__ == "__main__":
    Thread(target=run_flask).start()
    bot.polling(none_stop=True)
    
