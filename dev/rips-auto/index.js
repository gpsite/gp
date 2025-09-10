import React, { useState } from "react";

const TMDB_API_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
const LAMBDA_ENDPOINT = "YOUR_LAMBDA_API_GATEWAY_URL";

function App() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lambdaResult, setLambdaResult] = useState(null);

  const searchMovies = async () => {
    setLoading(true);
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(search)}`
    );
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  };

  const handleSelect = async (movie) => {
    setLoading(true);
    // Fetch movie details for exact title
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`
    );
    const details = await detailRes.json();
    const exactTitle = details.title;
    // Call Lambda
    const lambdaRes = await fetch(LAMBDA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: exactTitle }),
    });
    const lambdaData = await lambdaRes.json();
    setLambdaResult(lambdaData.line); // or whatever key you use
    setLoading(false);
  };
}
