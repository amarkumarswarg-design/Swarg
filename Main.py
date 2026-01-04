import telebot
import requests
import json
import os
from flask import Flask
from threading import Thread

# --- CONFIG (Check karein ki ye sahi hain) ---
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
        
        # Ye line Render logs mein error dikhayegi
        print(f"DEBUG AI RESPONSE: {res_data}") 
        
        if 'candidates' in res_data and len(res_data['candidates']) > 0:
            return res_data['candidates'][0]['content']['parts'][0]['text']
        elif 'error' in res_data:
            return f"❌ Google AI Error: {res_data['error'].get('message', 'Unknown Error')}"
        else:
            return "❌ AI ne khali jawab diya. Dubara try karein."
            
    except Exception as e:
        print(f"Fatal Error: {e}")
        return "❌ Connection fail ho gaya."

@bot.message_handler(commands=['start'])
def welcome(message):
    bot.send_message(message.chat.id, "✨ **Swarg AI Live ho gaya hai!**\nAapka bot ab Render par 24/7 chalega. Puchiye jo puchna hai!")

@bot.message_handler(func=lambda message: True)
def chat(message):
    bot.send_chat_action(message.chat.id, 'typing')
    answer = call_swarg_ai(message.text)
    bot.send_message(message.chat.id, answer)

@app.route('/')
def home():
    return "Swarg AI Status: Healthy & Online!"

def run_flask():
    # Render ke liye port 8080
    app.run(host='0.0.0.0', port=8080)

if __name__ == "__main__":
    print("🚀 Swarg AI is launching on Render...")
    Thread(target=run_flask).start()
    bot.polling(none_stop=True)
    
