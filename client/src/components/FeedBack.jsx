import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

export default function FeedBack({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleStarClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleStarHover = (hoveredRating) => {
    setHover(hoveredRating);
  };

  const handleMouseLeave = () => {
    setHover(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the feedback to your backend
    console.log({ rating, feedback });
    onSubmit();
  };

  return (
    <div className="bg-white rounded-lg p-8 w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#000000]">Your Feedback</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-center mb-6">
          <div className="rating" onMouseLeave={handleMouseLeave}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-4xl transition-all duration-150 focus:outline-none ${
                  star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
                } ${star <= (hover || rating) ? 'scale-110' : ''}`}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
              >
                <Star className="w-8 h-8 fill-current" />
              </button>
            ))}
          </div>
        </div>
        <Textarea
          className="w-full p-4 mb-6 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2368a0] resize-none"
          placeholder="Tell us about your experience..."
          rows={5}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <div className="flex justify-center">
          <Button
            type="submit"
            className="bg-[#000000] hover:bg-[#000011] text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#2368a0] focus:ring-opacity-50"
          >
            Submit Feedback
          </Button>
        </div>
      </form>
    </div>
  );
}