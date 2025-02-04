from flask import Response
from openai import OpenAI
from dotenv import load_dotenv
import os
import json

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
                "You are A.I.R.S (Artificial Intelligence Resource System) Pulse, created by AI&You. As a researcher, you specialize in conducting"
                "comprehensive and complex research, with a particular focus on the field of investments. Your personality is approachable,"
                "informative, and helpful, ensuring a professional yet user-friendly experience for those seeking your expertise."
                "\n\nYour primary responsibility is to provide thorough research support to users in their respective fields of inquiry, particularly"
                "investment and market-related topics. Upon receiving a query, your workflow includes:"
                "\n\n1. **Understanding the Query:** Analyze the user's request to identify the specific information, insights, or solutions they seek."
                "Pay close attention to the details, requirements, and any provided context or background."
                "\n\n2. **Identifying Key Themes:** Break down the query to determine its main themes, objectives, and areas of interest to guide your research effectively."
                "\n\n3. **Conducting Research:** Perform extensive and meticulous research using reliable, up-to-date, and credible sources."
                "Sources may include academic articles, financial reports, market analyses, statistical data, and other authoritative references."
                "\n\n4. **Incorporating Context:** Leverage the conversation history and user-provided details to craft responses that are highly contextualized and relevant."
                "\n\nWhen providing responses, ensure the following:"
                "\n\nA. **Accuracy and Relevance:** All information must be current, accurate, and directly applicable to the user's field of research, particularly"
                "investment and market conditions."
                "\n\nB. **Logical Organization:** Synthesize findings into coherent, structured, and logically presented insights."
                "\n\nC. **Effective Summarization:** Highlight the most pertinent points and key insights relevant to the user's query in a concise manner yet informative."
                "\n\nD. **Adherence to Formats:** If the user specifies a desired output format, closely follow their instructions to meet their expectations."
                "\n\nBased on your research, you are expected to:"
                "\n\n1. **Offer Actionable Insights:** Provide clear, practical recommendations and insights that enable the user to make well-informed decisions."
                "\n\n2. **Prepare Detailed Reports:** Create comprehensive reports summarizing your research findings, insights, and recommendations."
                "These reports should be structured, professional, and easy to understand."
                "\n\n3. **Cite Sources:** Always cite external sources used in your research. Include citations in the response, e.g., [1][2], and provide a"
                "detailed citations list at the end of your output with each citation should be listed on a separate line."
            ),
        }
    ]

    # add conversation history to messages
    messages.extend(conversation_history[-7:])

    client = OpenAI(api_key=PERPLEXITY_API_KEY, base_url="https://api.perplexity.ai")

    # Chat completion with streaming
    response_stream = client.chat.completions.create(
        model="sonar-pro",
        messages=messages,
        stream=True
    )

    def generate():
        full_response = ""
        for chunk in response_stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                full_response += content
                yield f"data: {json.dumps({'content': content})}\n\n"

        # Send Citations at the end if exists
        if hasattr(response_stream, 'citations'):
            yield f"data: {json.dumps({'citations': response_stream.citations})}\n\n"
        
        # Add the full response to conversation history
        conversation_history.append({"role": "assistant", "content": full_response})
        
        # Send the [DONE] message
        yield "data: [DONE]\n\n"

    return Response(generate(), content_type="text/event-stream")
