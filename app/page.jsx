"use client";
import { useState } from "react";
import { RingLoader } from "react-spinners";

export default function Home() {
  const [response, setResponse] = useState("");
  const [promt, setPromt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
            model: "deepseek/deepseek-r1:free",
            messages: [
              {
                role: "user",
                content: promt,
              },
            ],
          }),
        }
      );

      const data = await response.json();
      console.log(data.choices?.[0]?.message?.content);
      setResponse(
        data.choices?.[0]?.message?.content || "No response received!"
      );
      setPromt("");
    } catch (error) {
      console.error("Error:", error);
      setResponse("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (text) => {
    // Define patterns to match terms that need special formatting
    const patterns = [
      {
        regex: /\b([A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/g,
        className: "font-bold text-blue-400/70",
      }, // Proper nouns like places (Capitalized words)
    ];

    let formattedText = text;

    // Loop through each pattern to replace matched terms with HTML spans
    patterns.forEach(({ regex, className }) => {
      formattedText = formattedText.replace(regex, (match) => {
        return `<span class="${className}">${match}</span>`;
      });
    });

    return formattedText;
  };

  return (
    <div className="h-[100vh] pb-10 w-full pt-10 flex flex-col items-center bg-gray-900 text-white">
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
            <label htmlFor="user" className="font-bold text-end pr-4">YOU </label>
              <div id="user" className="p-4 bg-blue-500 text-white rounded-lg max-w-md self-end">
                {promt}
              </div>
            </>
          )}

          {/* AI's Response */}
          {loading ? (
            <div className="p-4 flex justify-center items-center bg-gray-800 text-white rounded-lg max-w-md">
              <RingLoader color="#25c2c7"/>{" "}
            </div>
          ) : (
            response && (
              <>
                <label htmlFor="ai" className="font-bold pl-4">AI: </label>
                <div
                  id="ai"
                  className="p-4 bg-gray-800 text-white rounded-lg max-w-md"
                >
                  <div
                    className="mt-2"
                    dangerouslySetInnerHTML={{
                      __html: formatResponse(response),
                    }}
                  />
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
