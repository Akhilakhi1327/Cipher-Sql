const { OpenAI } = require('openai');
require('dotenv').config();



let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

exports.fetchHintFromLLM = async (question, userQuery, schemaContext) => {
    if (!openai) {
        return "Warning: OPENAI_API_KEY is not configured in .env. Here is a generic hint: Make sure you understand the column names strictly and use the WHERE clause appropriately. Focus on the schema provided.";
    }

    const prompt = `
You are an expert SQL programming tutor. A student is trying to solve the following assignment:
Question: ${question}
Schema Context: ${schemaContext}

The student has written the following query so far (it may be empty, incomplete, or incorrect):
${userQuery || "(empty)"}

Your goal is to provide a helpful, intelligent hint to guide the student toward the correct answer WITHOUT giving them the complete solution or rewriting the entire query for them.
Highlight conceptual mistakes or what SQL clause they should think about.
Limit your hint to 2-3 sentences max.
`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: prompt }],
            max_tokens: 150,
            temperature: 0.7,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("LLM API Call Error:", error);
        throw error;
    }
};
