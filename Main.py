import telebot
import requests
import json
import os
from flask import Flask
from threading import Thread

# --- CONFIG ---
BOT_TOKEN = '8324843782:AAGsDnmPurCkZg4123GJSndtN4wiyTI6NnY'
GEMINI_KEY = 'AIzaSyARhU1QpC3pFZvSAocroZ1NT2w62dWMUrE'
bot = telebot.TeleBot(BOT_TOKEN)
app = Flask('')

def call_swarg_ai(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
    payload = {
        "contents": [{"parts": [{"text": f"Your name is Swarg AI. Answer in friendly Hinglish: {prompt}"}]}]
    }
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=15)
        res_data = response.json()
        if 'candidates' in res_data:
            return res_data['candidates'][0]['content']['parts'][0]['text']
        return "❌ Swarg AI ko jawab nahi mila."
    except Exception as e:
        return f"❌ AI Connection Error: Thodi der baad try karein."

@bot.message_handler(commands=['start'])
def welcome(message):
    # reply_to ki jagah send_message use karein taaki Error 400 na aaye
    bot.send_message(message.chat.id, "✨ Swarg AI is Live! Main aapki kya madad kar sakta hoon?")

@bot.message_handler(func=lambda message: True)
def chat(message):
    bot.send_chat_action(message.chat.id, 'typing')
    answer = call_swarg_ai(message.text)
    bot.send_message(message.chat.id, answer)

# --- Health Check ke liye Flask ---
@app.route('/')
def home():
    return "Swarg AI is Running!"

def run_flask():
    # Koyeb/Render ke liye port 8080 set karein
    app.run(host='0.0.0.0', port=8080)

if __name__ == "__main__":
    print("🚀 Swarg AI starting...")
    Thread(target=run_flask).start()
    bot.polling(none_stop=True)
    
