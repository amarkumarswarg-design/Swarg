import telebot
import requests
import json
import os
from flask import Flask
from threading import Thread

# --- CONFIG (Render Environment Variables se uthayega) ---
BOT_TOKEN = os.getenv('BOT_TOKEN', '8324843782:AAGsDnmPurCkZg4123GJSndtN4wiyTI6NnY')
GEMINI_KEY = os.getenv('GEMINI_KEY', 'AIzaSyARhU1QpC3pFZvSAocroZ1NT2w62dWMUrE')

bot = telebot.TeleBot(BOT_TOKEN)
app = Flask('')

def call_swarg_ai(prompt):
    # Gemini API Version check karein
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
    payload = {"contents": [{"parts": [{"text": f"Your name is Swarg AI. Answer in Hinglish: {prompt}"}]}]}
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=15)
        res_data = response.json()
        
        # Render logs mein asli error dekhne ke liye
        print(f"DEBUG: Google Response -> {res_data}")
        
        if 'candidates' in res_data and len(res_data['candidates']) > 0:
            return res_data['candidates'][0]['content']['parts'][0]['text']
        else:
            # Agar key galat hogi toh yahan message aayega
            error_msg = res_data.get('error', {}).get('message', 'Unknown Error')
            return f"❌ Google AI Error: {error_msg}"
            
    except Exception as e:
        return f"❌ Connection Fail: {str(e)}"

@bot.message_handler(commands=['start'])
def welcome(message):
    bot.send_message(message.chat.id, "✨ Swarg AI is Online! Ab aap mujhse sawal puch sakte hain.")

@bot.message_handler(func=lambda message: True)
def chat(message):
    bot.send_chat_action(message.chat.id, 'typing')
    answer = call_swarg_ai(message.text)
    bot.send_message(message.chat.id, answer)

@app.route('/')
def home():
    return "Bot is Running!"

def run_flask():
    app.run(host='0.0.0.0', port=8080)

if __name__ == "__main__":
    print("🚀 Bot starting on Render...")
    Thread(target=run_flask).start()
    bot.polling(none_stop=True)
    
