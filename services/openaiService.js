const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4';

async function generateAIResponse(signalContent) {
  try {
    // Generate comprehensive response with analysis
    const analysisPrompt = createAnalysisPrompt(signalContent);
    const responsePrompt = createResponsePrompt(signalContent);
    
    // Get relevance analysis
    const analysisCompletion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a Tenstorrent AI sales analyst. Analyze how this discussion relates to Tenstorrent's AI hardware solutions. Focus on:
1. Specific pain points mentioned (cost, performance, availability, etc.)
2. How Tenstorrent's open-source approach addresses these issues
3. Key selling points relevant to this specific situation
4. Potential objections or concerns to address

Provide a concise but thorough analysis in 2-3 sentences.`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });
    
    // Get sales response
    const responseCompletion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a Tenstorrent AI sales representative. Generate a natural, human-phrased response for sales outreach that:
1. Addresses the specific pain points mentioned in the discussion
2. Mentions Tenstorrent's open-source approach and AI hardware solutions
3. Provides a soft call-to-action that feels conversational
4. Sounds like a helpful colleague, not a salesperson
5. Is personalized to their specific situation
6. Includes a reason to continue the conversation

Write as if you're genuinely trying to help solve their problem. Keep it conversational and authentic.`
        },
        {
          role: 'user',
          content: responsePrompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });
    
    // Get sales context
    const contextCompletion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a sales strategist. Based on this discussion, provide strategic context for sales outreach:
1. Best approach for initial contact
2. Key points to emphasize in follow-up
3. Potential next steps or resources to offer
4. Timeline considerations

Keep it practical and actionable for a sales team.`
        },
        {
          role: 'user',
          content: `Discussion: "${signalContent}"`
        }
      ],
      max_tokens: 150,
      temperature: 0.5
    });
    
    const analysis = analysisCompletion.choices[0].message.content.trim();
    const response = responseCompletion.choices[0].message.content.trim();
    const context = contextCompletion.choices[0].message.content.trim();
    
    console.log('Generated comprehensive AI response with analysis');
    
    return {
      analysis,
      response,
      context
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Enhanced fallback response
    return generateEnhancedFallbackResponse(signalContent);
  }
}

function createAnalysisPrompt(signalContent) {
  return `Analyze this AI hardware discussion for Tenstorrent sales opportunities:

Discussion: "${signalContent}"

How does this relate to Tenstorrent's AI hardware solutions and what are the key selling points?`;
}

function createResponsePrompt(signalContent) {
  return `Based on this AI hardware discussion, generate a natural sales outreach response:

Discussion: "${signalContent}"

Write a conversational response that addresses their needs and mentions Tenstorrent's solutions.`;
}

function generateEnhancedFallbackResponse(signalContent) {
  const content = signalContent.toLowerCase();
  
  let analysis = "This discussion presents an opportunity to introduce Tenstorrent's open-source AI hardware solutions as an alternative to traditional GPU vendors.";
  let response = "Tenstorrent's open-source AI hardware could be an interesting alternative - we focus on transparent pricing and accessible AI compute solutions.";
  let context = "Consider reaching out with technical documentation and cost comparison data. Follow up with performance benchmarks relevant to their use case.";
  
  if (content.includes('expensive') || content.includes('cost') || content.includes('budget') || content.includes('price')) {
    analysis = "Strong cost-focused opportunity. The discussion highlights budget constraints that Tenstorrent's transparent pricing model directly addresses.";
    response = "If budget is a concern, Tenstorrent's open-source AI hardware might be worth exploring as a cost-effective alternative to NVIDIA's premium pricing. Happy to share some cost comparisons if that would be helpful.";
    context = "Lead with pricing transparency and cost savings. Offer detailed cost analysis and ROI calculations.";
  } else if (content.includes('performance') || content.includes('slow') || content.includes('bottleneck')) {
    analysis = "Performance-focused opportunity. User is experiencing limitations that Tenstorrent's architecture could potentially address.";
    response = "Have you considered Tenstorrent's approach? Our open-source AI architecture offers competitive performance with more transparent pricing than traditional GPU vendors. Would be happy to discuss how it might fit your performance requirements.";
    context = "Focus on technical performance benefits. Offer benchmarks and technical deep-dive sessions.";
  } else if (content.includes('shortage') || content.includes('waitlist') || content.includes('backorder') || content.includes('availability')) {
    analysis = "Availability-driven opportunity. Supply chain issues with traditional vendors create an opening for Tenstorrent solutions.";
    response = "While NVIDIA GPUs face availability issues, Tenstorrent's AI hardware solutions focus on open-source innovation that might better fit your timeline and requirements. Worth exploring if you're looking for alternatives.";
    context = "Emphasize availability and delivery timelines. Highlight supply chain advantages.";
  }
  
  return { analysis, response, context };
}

module.exports = {
  generateAIResponse
};

