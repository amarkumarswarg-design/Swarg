import telebot
import requests
import json
import os
from flask import Flask
from threading import Thread

# --- CONFIG ---
BOT_TOKEN = '8324843782:AAGsDnmPurCkZg4123GJSndtN4wiyTI6NnY'
# Aapki OpenAI Key (GitHub par 'Allow Secret' zaroor karna)
OPENAI_KEY = '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'

bot = telebot.TeleBot(BOT_TOKEN)
app = Flask('')

def call_swarg_ai(prompt):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_KEY}"
    }
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "Your name is Swarg AI. Answer in friendly Hinglish."},
            {"role": "user", "content": prompt}
        ]
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        res_data = response.json()
        
        # Ye line Render logs mein asli error batayegi
        print(f"DEBUG OPENAI: {res_data}")
        
        if 'choices' in res_data:
            return res_data['choices'][0]['message']['content']
        else:
            return "❌ Swarg AI ko abhi jawab nahi mila. Shayad key mein balance ya quota khatam hai."
    except Exception as e:
        return f"❌ Connection Error: Thodi der baad try karein."

# --- Welcome Message (Jo aapne manga tha) ---
@bot.message_handler(commands=['start'])
def welcome(message):
    msg = (
        "✨ **Swarg AI ko message karne ke liye dhanyawaad!** ✨\n\n"
        "Aap **Swarg AI se kuch bhi puche, ye jawab dega!** 🚀"
    )
    bot.send_message(message.chat.id, msg, parse_mode="Markdown")

@bot.message_handler(func=lambda message: True)
def chat(message):
    bot.send_chat_action(message.chat.id, 'typing')
    answer = call_swarg_ai(message.text)
    bot.send_message(message.chat.id, answer)

@app.route('/')
def home():
    return "Swarg AI is Online!"

def run_flask():
    app.run(host='0.0.0.0', port=8080)

if __name__ == "__main__":
    print("🚀 Swarg AI is starting on Render...")
    Thread(target=run_flask).start()
    bot.polling(none_stop=True)
    
