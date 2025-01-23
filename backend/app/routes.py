from flask import Blueprint, request
from .services.sonar_pro_search import chat_sonar_memory

api = Blueprint('api', __name__)

@api.route('/chat', methods=["POST"])
def chat():
    data = request.json
    user_input = data['message']
    thread_id = data['thread']
    
    return chat_sonar_memory(user_input, thread_id)