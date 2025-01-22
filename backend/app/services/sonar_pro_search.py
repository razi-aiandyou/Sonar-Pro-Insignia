from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
thread_histories = {}

def chat_sonar_memory(user_input, thread_id):
    if thread_id not in thread_histories:
        thread_histories[thread_id] = []

    conversation_history = thread_histories[thread_id]

    # Add user input to conversation history
    conversation_history.append({"role": "user", "content": user_input})

    # Prepare message for user input
    messages = [
        {
            "role": "system",
            "content": (
                "You are an Investment Analyst at Insignia, an investment company based in Indonesia,"
                "Your primary responsibility is to conduct comprehensive research to assist the company in assessing market conditions"
                "and fostering growth. When provided a query, your tasks are:"
                "1. Analyze user queries to understand the specific information or insights they seek."
                "2. Identify key themes and areas of interest within the queries to guide your research."
                "3. Perform extensive web searches using reliable and credible sources to gather relevant information such as articles, reports, statistics, market analyses, and many more"
                "Ensure that:"
                "A. The information gathered is up-to-date and applicable to investment and market conditions in Indonesia."
                "B. Your findings are synthesized logically and coherently."
                "C. Key points and insights most pertinent to the queries are summarized effectively."
                "Based on your research you must:"
                "1. Offer actionable insights and recommendations that help the user make informed decisions."
                "2. Prepare detailed reports summarizing your findings, insights, and recommendations."
                "3. Ensure all reports are well-structured, easy to understand, and professionally presented."
            ),
        }
    ]

    # add conversation history to messages
    messages.extend(conversation_history[-5:])

    client = OpenAI(api_key=PERPLEXITY_API_KEY, base_url="https://api.perplexity.ai")

    # Chat completion
    response = client.chat.completions.create(
        model="sonar-pro",
        messages=messages
    )

    output = response.choices[0].message.content
    citations = response.citations

    # Add assistant message to conversation history
    conversation_history.append({"role": "assistant", "content": "output"})

    return output, citations

