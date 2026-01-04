import telebot
import requests
import json
import os
from flask import Flask
from threading import Thread

# --- CONFIG (Render se connect hoga) ---
BOT_TOKEN = os.getenv('BOT_TOKEN', '8324843782:AAGsDnmPurCkZg4123GJSndtN4wiyTI6NnY')
OPENAI_KEY = os.getenv('OPENAI_KEY')

bot = telebot.TeleBot(BOT_TOKEN)
app = Flask('')

def call_swarg_ai(prompt):
    if not OPENAI_KEY:
        return "❌ OpenAI Key nahi mili. Render settings check karein."
    
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {OPENAI_KEY}"}
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "system", "content": "Your name is Swarg AI. Answer in Hinglish."},
                     {"role": "user", "content": prompt}]
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        res_data = response.json()
        if 'choices' in res_data:
            return res_data['choices'][0]['message']['content']
        return f"❌ Error: {res_data.get('error', {}).get('message', 'Unknown Error')}"
    except Exception as e:
        return "❌ Connection problem. Thodi der baad try karein."

@bot.message_handler(commands=['start'])
def welcome(message):
    msg = "✨ **Swarg AI ko message karne ke liye dhanyawaad!** ✨\n\nAap **Swarg AI se kuch bhi puche, ye jawab dega!** 🚀"
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
    
