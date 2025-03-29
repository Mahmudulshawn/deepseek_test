"use client";
import { parse } from "path";
import { useRef, useState } from "react";
import Markdown from "react-markdown";

export default function Home() {
  const [response, setResponse] = useState("");
  const [promt, setPromt] = useState("");
  const [loading, setLoading] = useState(false);

  const responseRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    
    responseRef.current = "";

    try {
      console.log("fetching");
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_R1_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3-0324:free",
            messages: [
              {
                role: "user",
                content: promt,
              },
            ],
            stream: true,
          }),
        }
      );

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Append new chunk to buffer
          buffer += decoder.decode(value, { stream: true });
          // Process complete lines from buffer
          while (true) {
            const lineEnd = buffer.indexOf("\n");
            if (lineEnd === -1) break;
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0].delta.content;
                if (content) {
                  responseRef.current += content; // Update response in real-time
                  setResponse(responseRef.current);
                }
              } catch (e) {
                console.log(e);
                console.log("streaming failed!");
              }
            }
          }
        }
      } finally {
        reader.cancel();
      }
    } catch (error) {
      console.error("Error: ", error);
      setResponse("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-10 w-full pt-10 flex flex-col items-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="p-4 flex gap-6">
        <input
          type="text"
          placeholder="Enter Prompt"
          value={promt}
          onChange={(e) => setPromt(e.target.value)}
          className="py-2 px-6 rounded-lg border border-white/10 bg-gray-800 text-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 hover:bg-green-500/80 rounded-lg"
        >
          Submit
        </button>
      </form>

      {/* Chat Bubbles for User and AI */}
      <div className="w-full max-w-3xl mt-6">
        <div className="flex flex-col gap-4">
          {/* User's Prompt */}
          {promt && (
            <>
              <label htmlFor="user" className="font-bold text-end pr-4">
                YOU{" "}
              </label>
              <div
                id="user"
                className="p-4 bg-blue-500 text-white rounded-lg max-w-md self-end"
              >
                {promt}
              </div>
            </>
          )}

          {/* AI response */}
          {(
            response && (
              <>
                <label htmlFor="ai" className="font-bold pl-4">
                  AI:{" "}
                </label>
                <div
                  id="ai"
                  className="p-4 bg-gray-800 text-white rounded-lg max-w-lg overflow-x-scroll"
                >
                  <div className="mt-2" />
                  <Markdown>{response}</Markdown>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
