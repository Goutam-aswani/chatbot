# import re
# from urllib import response
# import requests
# from langchain_groq import ChatGroq
# from langchain_core.output_parsers import StrOutputParser
# from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# from sympy import true


# def get_response_for_web_search(query: str, max_results: int = 2) -> str:
#     """
#     Perform a web search using the Tavily API and return concise results.
    
#     Args:
#         query (str): The user query for web search.
#         max_results (int): Maximum number of results to fetch (default: 5).
    
#     Returns:
#         str: A formatted string with search results.
#     """
#     # if not settings.Tavily_API_KEY:
#     #     raise ValueError("TAVILY_API_KEY is not set in the environment.")

#     url = "https://api.tavily.com/search"
#     headers = {"Content-Type": "application/json"}
#     payload = {
#         "api_key": "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",
#         "query": query,
#         "max_results": max_results,
#         "include_raw_content": true 
#     }

#     try:
#         response = requests.post(url, json=payload, headers=headers)
#         response.raise_for_status()
#         data = response.json()

#         # Tavily typically returns results under "results"
#         results = data.get("results", [])
#         if not results:
#             return "No relevant results found."

#         # Format results in markdown for chatbot use
#         formatted_results = []
#         for i, res in enumerate(results, start=1):
#             title = res.get("title", "No Title")
#             link = res.get("url", "")
#             snippet = res.get("content", "No description available.")
#             formatted_results.append(f"**{i}. [{title}]({link})**\n{snippet}")

#         return "\n\n".join(formatted_results)

#     except requests.exceptions.RequestException as e:
#         print(f"--- ERROR: Tavily API request failed: {e} ---")
#         return "Sorry, I couldn't fetch results from the web at the moment."

# def get_llm_response(prompt:str,web_results:str):
#     llm = ChatGroq(
#     model="llama3-70b-8192",
#     temperature=0.2,
#     max_tokens=None,
#     timeout=None,
#     max_retries=2,
#     api_key="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",  # Optional if you set GROQ_API_KEY
#     streaming=True
# )
#     prompt_template = ChatPromptTemplate.from_messages([
#         ("system", (
#             "You are a helpful assistant. You provide concise answers based on the provided context. "
#             "Format your responses using GitHub-flavored Markdown."
#             "Here are some relevant search results:\n{web_results} , uuse this search results when you think that latest news is required to answer the question"
#         )),
#         ("user", "{input}")
#     ])
#     output_parser = StrOutputParser()
#     chain = prompt_template | llm | output_parser

#     return chain.invoke(
#         {
#             "input": prompt,
#             "web_results": web_results
#         }
#     )
     
query = "who is the world champion in CHESS 2025?"
import re
from langchain_community.tools.tavily_search import TavilySearchResults
from openai import api_key
tool = TavilySearchResults(tavily_api_key="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" )
response = tool.invoke({
  "query": query,
  "search_depth": "advanced",
  "include_raw_content": True
})

print(response[0]["content"],response[1]["content"])

# response = get_llm_response(query,web_results=web_result)
# web_result = get_response_for_web_search(query)
# print(response)
