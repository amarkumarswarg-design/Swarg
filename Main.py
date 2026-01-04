import telebot
import requests
import json
import os
from flask import Flask
from threading import Thread

# --- Render ke liye Web Server ---
app = Flask('')
@app.route('/')
def home():
    return "Swarg AI is Online!"

def run():
    app.run(host='0.0.0.0', port=8080)

def keep_alive():
    t = Thread(target=run)
    t.start()

# --- Bot Config ---
BOT_TOKEN = '8324843782:AAGsDnmPurCkZg4123GJSndtN4wiyTI6NnY'
GEMINI_KEY = 'AIzaSyARhU1QpC3pFZvSAocroZ1NT2w62dWMUrE'
bot = telebot.TeleBot(BOT_TOKEN)

def call_swarg_ai(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
    # System Prompt: Isse bot Swarg ki tarah behave karega
    system_instruction = "Your name is Swarg AI. You are a wise and helpful educational assistant for Indian students. Explain concepts simply in Hinglish. Be polite and encouraging."
    
    payload = {
        "contents": [{
            "parts": [{"text": f"{system_instruction}\n\nUser Question: {prompt}"}]
        }]
    }
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    return response.json()['candidates'][0]['content']['parts'][0]['text']

@bot.message_handler(commands=['start'])
def welcome(message):
    welcome_text = (
        "✨ **Swarg AI mein aapka swagat hai!** ✨\n\n"
        "Main aapka personal study partner hoon. Aap mujhse kisi bhi subject ke bare mein puch sakte hain.\n"
        "Example: 'Physics Newton's law samjhao' ya 'History notes' "
    )
    bot.reply_to(message, welcome_text, parse_mode="Markdown")

@bot.message_handler(func=lambda message: True)
def chat(message):
    status = bot.reply_to(message, "☁️ Swarg AI soch raha hai...")
    try:
        answer = call_swarg_ai(message.text)
        bot.edit_message_text(answer, message.chat.id, status.message_id, parse_mode="Markdown")
    except:
        bot.edit_message_text("❌ Swarg ke servers abhi busy hain. Thoda intezar karein.", message.chat.id, status.message_id)

if __name__ == "__main__":
    keep_alive() # Render ko active rakhne ke liye
    print("🚀 Swarg AI is launching on Render...")
    bot.polling(none_stop=True)
    
