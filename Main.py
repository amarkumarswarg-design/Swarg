import telebot
import requests
import json
import os
from flask import Flask
from threading import Thread

# --- CONFIG ---
BOT_TOKEN = '8324843782:AAGsDnmPurCkZg4123GJSndtN4wiyTI6NnY'
# Aapki OpenAI Key
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
            {"role": "system", "content": "Your name is Swarg AI. Answer everything in friendly Hinglish."},
            {"role": "user", "content": prompt}
        ]
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        res_data = response.json()
        if 'choices' in res_data:
            return res_data['choices'][0]['message']['content']
        else:
            # Agar OpenAI key mein balance khatam hai toh ye dikhayega
            print(f"Error: {res_data}")
            return "❌ Swarg AI abhi jawab nahi de pa raha. Shayad limit khatam ho gayi hai."
    except Exception as e:
        return f"❌ Connection Error: Thodi der baad koshish karein."

# --- Welcome Message (Aapke mutabiq) ---
@bot.message_handler(commands=['start'])
def welcome(message):
    welcome_text = (
        "✨ **Swarg AI ko message karne ke liye dhanyawaad!** ✨\n\n"
        "Main aapka personal AI assistant hoon. Aap **Swarg AI se kuch bhi puche, ye jawab dega!** 🚀"
    )
    # Seedha send_message use karein taaki Error 400 na aaye
    bot.send_message(message.chat.id, welcome_text, parse_mode="Markdown")

@bot.message_handler(func=lambda message: True)
def handle_chat(message):
    bot.send_chat_action(message.chat.id, 'typing')
    answer = call_swarg_ai(message.text)
    bot.send_message(message.chat.id, answer)

# --- Health Check (Render ke liye zaroori) ---
@app.route('/')
def home():
    return "Swarg AI is Online!"

def run_flask():
    # Render hamesha 8080 port par health check karta hai
    app.run(host='0.0.0.0', port=8080)

if __name__ == "__main__":
    print("🚀 Swarg AI is launching on Render...")
    Thread(target=run_flask).start()
    bot.polling(none_stop=True)
    
