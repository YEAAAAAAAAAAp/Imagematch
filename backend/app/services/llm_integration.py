"""
LLM Integration for Visual RAG
Provides natural language understanding and generation capabilities.
"""

from typing import Dict, List, Optional
import os

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class LLMService:
    """Service for LLM-based text generation and understanding."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = None
        
        if OPENAI_AVAILABLE and self.api_key:
            self.client = OpenAI(api_key=self.api_key)
    
    def is_available(self) -> bool:
        """Check if LLM service is available."""
        return self.client is not None
    
    def generate_actor_description(
        self,
        actor_matches: List[Dict],
        query_context: Optional[str] = None
    ) -> str:
        """
        Generate natural language description of actor matches.
        
        Args:
            actor_matches: List of matched actors with scores
            query_context: Optional context about the query
        
        Returns:
            Natural language description
        """
        if not self.is_available():
            return self._fallback_description(actor_matches, query_context)
        
        # Prepare prompt
        matches_text = "\n".join([
            f"- {match['name']}: {match['score']:.2%} similarity"
            for match in actor_matches[:5]
        ])
        
        context_text = f"\nQuery context: {query_context}" if query_context else ""
        
        prompt = f"""Based on the following actor similarity matches, provide a concise summary:

{matches_text}{context_text}

Summarize the top matches and explain why they might be similar to the query image."""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI casting assistant. Provide concise, helpful summaries of actor matches."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            print(f"LLM generation error: {e}")
            return self._fallback_description(actor_matches, query_context)
    
    def _fallback_description(
        self,
        actor_matches: List[Dict],
        query_context: Optional[str] = None
    ) -> str:
        """Fallback description without LLM."""
        if not actor_matches:
            return "No matching actors found."
        
        top_match = actor_matches[0]
        context = f" for '{query_context}'" if query_context else ""
        
        desc = f"Top match{context}: {top_match['name']} "
        desc += f"({top_match['score']:.1%} similarity)"
        
        if len(actor_matches) > 1:
            others = ", ".join([m['name'] for m in actor_matches[1:4]])
            desc += f". Other similar actors: {others}"
        
        return desc
    
    def parse_natural_query(self, query_text: str) -> Dict:
        """
        Parse natural language query into structured format.
        
        Args:
            query_text: Natural language query
        
        Returns:
            Structured query dict with actor names, characteristics, etc.
        """
        if not self.is_available():
            return {"raw_query": query_text, "actor_names": []}
        
        prompt = f"""Parse this casting query and extract:
1. Actor names mentioned
2. Characteristics or style requested
3. Age range if mentioned

Query: "{query_text}"

Respond in JSON format with keys: actor_names (list), characteristics (list), age_range (string or null)"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a query parser. Extract structured information and respond ONLY with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=150,
                temperature=0.3
            )
            
            import json
            result = json.loads(response.choices[0].message.content.strip())
            result["raw_query"] = query_text
            return result
        
        except Exception as e:
            print(f"Query parsing error: {e}")
            return {"raw_query": query_text, "actor_names": [], "characteristics": []}


# Global instance
LLM_SERVICE = LLMService()
