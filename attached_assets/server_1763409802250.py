from flask import Flask, request, jsonify
import json
from scoring_engine import calculate_scores

app = Flask(__name__)

@app.route('/quantum360/submit', methods=['POST'])
def submit():
    data = request.json
    # TODO: Save to database
    return jsonify({"status": "ok", "message": "Submission received"})

@app.route('/quantum360/report/<leader_id>', methods=['GET'])
def report(leader_id):
    # TODO: Fetch from database
    results = calculate_scores(leader_id)
    return jsonify(results)
import os
if __name__ == "__main__":
    # Use the PORT provided by Koyeb, or default to 8000
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port)
