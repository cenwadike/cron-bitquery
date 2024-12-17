"use client";
import dotenv from "dotenv";
import { useState } from 'react';

dotenv.config();

const IntervalForm = () => {
  const [interval, setInterval] = useState(10);
  const [frame, setFrame] = useState('minutes');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [baseUrl, setBaseUrl] = useState(process.env.BASE_URL)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const data = {
      interval: parseInt(interval),
      frame,
    };

    try {
      const response = await fetch(`${baseUrl}/api/v1/cron-bitquery/intervals/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setSuccess(true);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Set Interval</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Interval (minutes):</label>
          <input
            type="number"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="mt-1 block w-full p-2 rounded-md border border-gray-600 bg-gray-700 text-white focus:ring focus:ring-blue-400"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Frame:</label>
          <select
            value={frame}
            onChange={(e) => setFrame(e.target.value)}
            className="mt-1 block w-full p-2 rounded-md border border-gray-600 bg-gray-700 text-white focus:ring focus:ring-blue-400"
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Submit
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">Interval set successfully!</p>}
    </div>
  );
};

export default IntervalForm;
