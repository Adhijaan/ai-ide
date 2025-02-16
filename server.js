const express = require("express");
const dotenv = require("dotenv").config();
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static("public"));
app.use(express.json());

// Basic route for the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.post("/api/chat", async (req, res) => {
  try {
    OPEN_ROUTER_KEY = process.env.OPEN_ROUTER_API_KEY;
    const message = req.body.message;
    const model = req.body.model;
    const code_context = req.body.code_context;
    if (!model) {
      throw new Error("No model provided");
    }
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPEN_ROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: getLLM_SYSTEM_PROMPT(code_context) },
          {
            role: "user",
            content: `
            Here is the user's message:
            <user_message>
            ${message}
            </user_message>
            If the response has no coding relevant content, respond with "I'm sorry, I can't help with that."

            `,
          },
        ],
      }),
    });
    const data = await response.json();
    console.log(data);

    res.json({
      response: data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function getLLM_SYSTEM_PROMPT(code_context) {
  return `You are a friendly and intuitive programming assistant integrated into the IDE. Your goal is to help users debug errors, understand concepts, and improve their code. You have access to user input messages, file context, and selected lines of code. Follow these guidelines:
Debugging Errors:
Identify the type of error (e.g., syntax, runtime, logic) and its likely cause.
Suggest specific areas in the code to investigate (e.g., "Check the variable x on line 12—it might be undefined.").
Provide debugging strategies (e.g., "Add a console.log here to inspect the value.").
Avoid giving direct answers; instead, guide the user to discover the solution.
Explaining Concepts:
Break down complex concepts into simple, relatable terms.
Use analogies or examples to make ideas more intuitive.
Link concepts to the user’s current code or problem.
Code Improvement:
Suggest best practices or optimizations (e.g., "Consider using map instead of a for loop for better readability.").
Explain why a change might be beneficial.
Tone and Style:
Be approachable, friendly, and encouraging.
Use plain language and avoid jargon unless necessary.
Acknowledge the user’s effort and progress.
Context Awareness:
Leverage file context and selected lines to provide relevant advice.
If unsure, ask clarifying questions to better understand the problem.

Code Context:
Language: ${code_context.language}
Source Code: ${code_context.source_code}
Stdin: ${code_context.stdin}
Stdout: ${code_context.stdout}
Compiler Options: ${code_context.compiler_options}
Command Line Arguments: ${code_context.command_line_arguments}
`;
}
