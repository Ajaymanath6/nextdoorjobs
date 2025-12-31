# WhatsApp Flask Webhook Setup Plan

## Overview

Create a Flask webhook service in the NextDoorJobs project to receive WhatsApp data from Meta. The webhook must handle both GET (handshake/verification) and POST (message data) requests according to Meta's 2025 API requirements.

## Implementation Steps

### 1. Create Flask Application (`app.py`)

- Create `app.py` in the project root
- Set up Flask app with GET and POST routes at `/webhook`
- **Critical: Handle GET request for Meta verification (handshake)**
  - Meta sends GET request with `hub.mode`, `hub.verify_token`, and `hub.challenge`
  - Verify token matches `VERIFY_TOKEN` constant
  - Return challenge value on successful verification
- Handle POST requests for actual message data
- Parse Meta's 2025 API structure: `entry[0]['changes'][0]['value']['messages'][0]`
- Handle two message types:
  - **Location**: Extract `latitude` and `longitude` from `msg['location']`
  - **Text**: Extract message body from `msg['text']['body']`
- Add CORS support for webhook testing
- Run on `http://127.0.0.1:5000` by default with debug mode

### 2. Create Dependencies File (`requirements.txt`)

- Add `flask==3.0.0`
- Add `flask-cors==4.0.0`
- Add `requests==2.31.0`
- Specify exact versions for consistency

### 3. Add Meta Dashboard Configuration Instructions

- Document the complete setup process:
  - Step 1: Start Flask app and Ngrok tunnel
  - Step 2: Configure webhook in Meta Dashboard
  - Step 3: Subscribe to message events
- Include verify token configuration
- Explain webhook field subscription

## Files to Create

1. **`app.py`** - Flask webhook application

   - GET route `/webhook` for Meta verification (handshake)
   - POST route `/webhook` for receiving messages
   - VERIFY_TOKEN constant (must match Meta Dashboard)
   - Meta 2025 API JSON parsing
   - Location and text message handling
   - Console logging with emojis for clarity
   - Error handling with try-except blocks

2. **`requirements.txt`** - Python dependencies

   - flask==3.0.0
   - flask-cors==4.0.0
   - requests==2.31.0

## Implementation Details

### Webhook Route Structure

```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# This must match what you type in the Meta Dashboard
VERIFY_TOKEN = "my_secret_token_123" 

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    # --- STEP A: THE HANDSHAKE (GET) ---
    if request.method == 'GET':
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')

        if mode == 'subscribe' and token == VERIFY_TOKEN:
            print("WEBHOOK_VERIFIED")
            return challenge, 200
        else:
            return "Verification failed", 403

    # --- STEP B: RECEIVING DATA (POST) ---
    if request.method == 'POST':
        data = request.get_json()
        
        # In Meta's 2025 API, the data is hidden deep inside 'entry'
        try:
            entry = data['entry'][0]['changes'][0]['value']
            if 'messages' in entry:
                msg = entry['messages'][0]
                
                # Handle Location
                if msg['type'] == 'location':
                    lat = msg['location']['latitude']
                    lng = msg['location']['longitude']
                    print(f"📍 Location received: Lat {lat}, Lng {lng}")
                
                # Handle Text
                elif msg['type'] == 'text':
                    body = msg['text']['body']
                    print(f"💬 Text received: {body}")
                    
        except Exception as e:
            print(f"Error parsing JSON: {e}")

        return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)
```

### Error Handling

- Handle missing JSON data gracefully
- Try-except blocks for parsing Meta's nested JSON structure
- Return appropriate HTTP status codes (200 for success, 403 for verification failure)
- Log errors to console with descriptive messages

### Testing Flow (Baby Steps)

**Step 1: Start the Bridge (Ngrok)**

1. Run Flask app: `python app.py` (runs on port 5000)
2. Open new terminal and start Ngrok: `ngrok http 5000`
3. Copy the "Forwarding" URL (e.g., `https://random-name.ngrok-free.app`)
4. Keep both terminals running

**Step 2: Connect to Meta Dashboard**

1. Go to Meta App → WhatsApp → Configuration
2. Click Edit on the Webhook section
3. **Callback URL**: Paste Ngrok URL + `/webhook` (e.g., `https://random-name.ngrok-free.app/webhook`)
4. **Verify Token**: Type `my_secret_token_123` (must match `VERIFY_TOKEN` in `app.py`)
5. Click "Verify and Save" (Flask console should show "WEBHOOK_VERIFIED")
6. If successful, you'll see "Success!" in Meta Dashboard

**Step 3: Subscribe to Messages**

1. On the same Meta Dashboard page, look for "Webhook Fields"
2. Click "Manage"
3. Find "messages" and click "Subscribe"
4. Now Meta will send POST requests when users send messages/locations

**Step 4: Test**

1. Send a test message or location from WhatsApp
2. Check Flask console for output:

   - `💬 Text received: [message]` for text messages
   - `📍 Location received: Lat [lat], Lng [lng]` for locations

## Notes

- Flask runs alongside Next.js application (different ports: Flask on 5000, Next.js on 3000)
- Ngrok makes the local Flask server accessible to Meta's servers
- The verify token (`VERIFY_TOKEN`) must match exactly between code and Meta Dashboard
- Meta's 2025 API uses nested JSON structure: `entry[0]['changes'][0]['value']['messages'][0]`
- After receiving location data, the next step is to save coordinates to database and display on Leaflet map

