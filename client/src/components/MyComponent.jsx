import React, { useState } from 'react';
import { useTypewriter, Cursor } from 'react-simple-typewriter';

export default function MyComponent() {
  const [isDone, setIsDone] = useState(false);
  const userName = localStorage.getItem("userName");
  const [text] = useTypewriter({
    words: [`Good Morning ${userName}!`],
    loop: 1,
    onLoopDone: () => setIsDone(true), // Set typing to done when the loop is finished
  });

  return (
    <div>
      {text}
      {!isDone && <Cursor cursorStyle="|" />}
    </div>
  );
}
